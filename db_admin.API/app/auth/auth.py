# Librerias

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from decouple import config

from database import get_db
from models import User, LoginSession

# Configuración de seguridad

SECRET_KEY = config('SECRET_KEY', default='your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ Verifica la contraseña vs el hash """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """ Hashea una contraseña """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """ Crea un token de acceso JWT """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.now(datetime.timezone.utc) + timedelta(days = ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)

    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """ Verifica el token JWT y regresa el email """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
        email: str = payload.get('sub')
        if email is None:
            return None
        return email
    except JWTError:
        return None

async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
) -> User:
    """ Obtener el actual usuario autenticado """
    token = credentials.credentials

    # Verifica token JWT
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = 'Invalid authentication credentials',
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verifica si hay sesión activa
    session = db.query(LoginSession).filter(
        LoginSession.token == token,
        LoginSession.is_active == True,
        LoginSession.expires_at > datetime.now(datetime.timezone.utc)
    ).first()

    if not session:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Sesión expirada o inválida",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Obtener user
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = 'Usuario no encontrado',
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
