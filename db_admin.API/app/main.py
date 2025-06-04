# Librerias
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import uvicorn

from database import get_db, engine, Base
from models import User, PasswordResetToken, LoginSession
from schemas import (
    UserCreate, UserLogin, UserResponse, PasswordReset,
    PasswordResetRequest, Token, LoginResponse
)
from auth import (
    create_access_token, verify_token, get_password_hash,
    verify_password, get_current_user
)
from email_service import send_password_reset_email


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


