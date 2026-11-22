from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class SessionResponse(BaseModel):
    id: int
    family_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: str
    expires_at: str
    is_revoked: bool

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

class VerifyEmailRequest(BaseModel):
    token: str

class MessageResponse(BaseModel):
    message: str
    details: Optional[str] = None
