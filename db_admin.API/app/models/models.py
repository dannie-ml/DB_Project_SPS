# Librerias

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import secrets

# Definiciones

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True)
    email = Column (String(255), unique = True, index = True, nullable = False)
    full_name = Column(String(255), nullable = False)
    hashed_password = Column(String(255), nullable = False)
    is_active = Column(Boolean, default = True)
    created_at = Column(DateTime, default = datetime.now(datetime.timezone.utc))
    last_login = Column(DateTime, nullable = True)

    # Relaciones
    login_sessions = relationship("LoginSession", back_populates = "user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates = "user")

class LoginSession(Base):
    __tablename__ = "login_sessions"

    id = Column(Integer, primary_key = True, index = True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    token = Column(Text, nullable = False, index = True)
    is_active = Column(Boolean, default = True)
    created_at = Column(DateTime, default = datetime.now(datetime.timezone.utc))
    expires_at = Column(DateTime, nullable = False)

    # Relaciones
    user = relationship("User", back_populates = "login_sessions")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key = True, index = True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    token = Column(String(255), nullable = False, index = True)
    used = Column(Boolean, default = False)
    expires_at = Column(DateTime, nullable = False)
    created_at = Column(DateTime, default = datetime.now(datetime.timezone.utc))
    used_at = Column(DateTime, nullable = True)

    # Relaciones
    user = relationship('User', back_populates = 'password_reset_tokens')

    @staticmethod
    def create_token(user_id: int) -> str:
        """ Genera un token seguro para el reset de contraseña """
        return secrets.token_urlsafe(32)


