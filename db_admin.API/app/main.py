# Librerias
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
import uvicorn

from app.database import get_db, engine, Base
from app.models.models import User, PasswordResetToken, LoginSession
from app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, PasswordReset,
    PasswordResetRequest, Token, LoginResponse
)
from app.auth.auth import (
    create_access_token, verify_token, get_password_hash,
    verify_password, get_current_user
)
from app.email_service.email_service import send_password_reset_email


# Creación de tablas

Base.metadata.create_all(bind = engine)

app = FastAPI(
    title = 'API de Autenticación SPS DB',
    description = 'Servicio de autenticación para el portal de DBA',
    version = '1.0.0'
)

# CORS Middleware

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['http://localhost:4200'], # dev Server de Angular
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*'],
)

security = HTTPBearer()

@app.post("/api/auth/register", response_model = UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """ Registro nuevo usuario """
    # Valida si hay usuario existente
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "Ya existe el correo registrado"
        )

    # Crea nuevo usuario
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email = user.email,
        full_name = user.full_name,
        hashed_password = hashed_password,
        is_active = True,
        created_at = datetime.now(timezone.utc)
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return UserResponse(
        id = db_user.id,
        email = db_user.email,
        full_name = db_user.full_name,
        is_active = db_user.is_active,
        created_at = db_user.created_at
    )

@app.post("/api/auth/login", response_model = LoginResponse)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """ Autenticación de usuario y token de acceso """
    # Encuentra usuario por email
    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Correo o contraseña incorrecta"
        )

    if not user.is_active:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "La cuenta esta desactivada"
        )

    # Crear token de acceso
    access_token = create_access_token(data={"sub": user.email})

    # Crear sesión de login
    login_session = LoginSession(
        user_id = user.id,
        token = access_token,
        expires_at = datetime.now(timezone.utc) + timedelta(days = 7),
        created_at = datetime.now(timezone.utc)
    )
    db.add(login_session)

    # Actualiza el ultimo login del user
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return LoginResponse(
        access_token = access_token,
        token_type = "bearer",
        expires_in = 7 * 24 * 60 * 60,
        user = UserResponse(
            id = user.id,
            email = user.email,
            full_name = user.full_name,
            is_active = user.is_active,
            created_at = user.created_at
        )
    )

@app.post("/api/auth/logout")
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """ Logout e invalidacion de token """
    token = credentials.credentials

    # Encuentra y desactiva la sesion
    session = db.query(LoginSession).filter(LoginSession.token == token).first()
    if session:
        session.is_active = False
        db.commit()

    return {"message": "Has cerrado sesión"}

@app.get("/api/auth/me", response_model = UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """ Obtener la info del usuario actual """
    return UserResponse(
        id = current_user.id,
        email = current_user.email,
        full_name = current_user.full_name,
        is_active = current_user.is_active,
        created_at = current_user.created_at
    )

@app.post("/api/auth/forgot-password")
async def forgot_passord(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """ Request del reset del password """
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        return {"message": "Si el correo está registrado, se enviará una URL para cambiar la contraseña"}

    # Crea un token para el reseteo de password
    reset_token = PasswordResetToken.create_token(user.id)
    db_token = PasswordResetToken(
        user_id = user.id,
        token = reset_token,
        expires_at = datetime.now(timezone.utc) + timedelta(hours = 1),
        created_at = datetime.now(timezone.utc)
    )

    db.add(db_token)
    db.commit()

    # Envio de correo en background
    background_tasks.add_task(
        send_password_reset_email,
        user.email,
        user.full_name,
        reset_token
    )

    return {"message": "Si el correo está registrado, se enviará una URL para cambiar la contraseña"}

@app.post("/api/auth/reset-password")
async def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """ Reseteo de contraseña usando token """

    # Encuentra un token valido
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == reset_data.token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()

    if not token_record:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "Reset token inválido o expirado"
        )

    # Obtener usuario y actualiza contraseña
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Usuario no encontrado"
        )

    # Actualiza contraseña
    user.hashed_password = get_password_hash(reset_data.new_password)

    # Marcar token como usado
    token_record.used = True
    token_record.used_at = datetime.now(timezone.utc)

    # Inválida todas las sesiones del usuario
    db.query(LoginSession).filter(LoginSession.user_id == user.id).update({"is_active": False})
    db.commit()

    return {"message": "Se ha cambiado la contraseña"}

@app.get("/api/auth/verify-token/{token}")
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """ Verifica si la contraseña del reinicio del token es valido """

    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()

    if not token_record:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "Token inválido o expirado"
        )

    return {"valid": True, "message": "Token es válido"}

@app.get("/api/health")
async def health_check():
    """ Health check endpoint """
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

if __name__ == "__main__":
    uvicorn.run("main:app", host = "0.0.0.0", port = 8000, reload = True)




