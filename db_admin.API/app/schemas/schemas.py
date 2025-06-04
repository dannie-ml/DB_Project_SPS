# Librerias

from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional

# Definiciones

class UserBase(BaseModel):
    email : EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe ser mayor a 6 caracteres')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(Token):
    expires_in: int
    user: UserResponse

class PasswordResetRequest(BaseModel):
    email:EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe ser mayor a 6 caracteres')
        return v
