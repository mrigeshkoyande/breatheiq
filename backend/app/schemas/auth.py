"""Pydantic schemas for authentication, sessions, profile controls, and password recovery."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseAuthSchema(BaseModel):
    """Strict input base schema rejecting unexpected payload attributes."""

    model_config = ConfigDict(extra="forbid")


class SignupRequest(BaseAuthSchema):
    """Account registration payload."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseAuthSchema):
    """Email/password authentication payload."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UpdateProfileRequest(BaseAuthSchema):
    """Authenticated user profile update payload."""

    full_name: str = Field(min_length=1, max_length=120)


class ChangePasswordRequest(BaseAuthSchema):
    """Authenticated password update payload."""

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    """Public user representation returned on auth & profile endpoints."""

    id: int
    email: str
    role: str
    full_name: str | None = None
    is_active: bool
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT access token envelope with associated user profile."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class SessionResponse(BaseModel):
    """Active or revoked refresh-token session metadata."""

    id: int
    family_id: str
    user_agent: str | None = None
    ip_address: str | None = None
    created_at: str
    expires_at: str
    is_revoked: bool


class AuthConfigResponse(BaseModel):
    """Client-visible environment flags (never includes secrets)."""

    demo_mode: bool
    environment: str


class ForgotPasswordRequest(BaseAuthSchema):
    """Password reset request payload."""

    email: EmailStr


class ResetPasswordRequest(BaseAuthSchema):
    """Single-use password reset token verification payload."""

    token: str = Field(min_length=16, max_length=2048)
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseAuthSchema):
    """Single-use email verification payload."""

    token: str = Field(min_length=16, max_length=2048)


class MessageResponse(BaseModel):
    """Generic confirmation envelope."""

    message: str
