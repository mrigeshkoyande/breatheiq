import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_one_time_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.api.deps import get_current_user, get_db
from app.models.auth import AuditLog, OneTimeToken, RefreshToken, User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SessionResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def log_audit(db: AsyncSession, user_id: Optional[int], action: str, request: Request, details: str = ""):
    client_ip = request.client.host if request.client else "unknown"
    audit = AuditLog(
        user_id=user_id,
        action=action,
        ip_address=client_ip,
        details=details
    )
    db.add(audit)

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    res = await db.execute(select(User).where(User.email == payload.email.lower()))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. An account with this email may already exist."
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role="user",
        is_active=True,
        is_verified=False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Establish new refresh token family
    family_id = str(uuid.uuid4())
    raw_refresh, jti_h, expires_at = create_refresh_token(user.id, family_id)
    
    rt = RefreshToken(
        user_id=user.id,
        family_id=family_id,
        jti_hash=jti_h,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=expires_at
    )
    db.add(rt)
    log_audit(db, user.id, "AUTH_SIGNUP_SUCCESS", request, f"Email: {user.email}")
    await db.commit()

    # Set secure HttpOnly cookie for refresh token
    response.set_cookie(
        key="breatheiq_refresh",
        value=raw_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )

    access_token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = res.scalars().first()

    generic_error = "Invalid credentials. Please verify your email and password."

    if not user or not verify_password(payload.password, user.hashed_password):
        log_audit(db, user.id if user else None, "AUTH_LOGIN_FAILED", request, f"Attempted: {payload.email}")
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=generic_error)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled. Please contact support.")

    # Create new refresh token family
    family_id = str(uuid.uuid4())
    raw_refresh, jti_h, expires_at = create_refresh_token(user.id, family_id)
    
    rt = RefreshToken(
        user_id=user.id,
        family_id=family_id,
        jti_hash=jti_h,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=expires_at
    )
    db.add(rt)
    log_audit(db, user.id, "AUTH_LOGIN_SUCCESS", request, "Login successful")
    await db.commit()

    response.set_cookie(
        key="breatheiq_refresh",
        value=raw_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )

    access_token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    response: Response,
    breatheiq_refresh: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db)
):
    if not breatheiq_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

    try:
        decoded = decode_token(breatheiq_refresh)
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = int(decoded.get("sub"))
        family_id = decoded.get("family_id")
        jti = decoded.get("jti")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    jti_h = hash_token(jti)
    now = datetime.now(timezone.utc)

    # Find the token record in database
    res = await db.execute(select(RefreshToken).where(RefreshToken.jti_hash == jti_h))
    token_record = res.scalars().first()

    # Reuse detection: if token not found or already revoked, compromise detected!
    if not token_record or token_record.revoked_at is not None:
        # Revoke the entire family
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id)
            .values(revoked_at=now)
        )
        log_audit(db, user_id, "AUTH_REFRESH_TOKEN_REUSE_DETECTED", request, f"Family {family_id} revoked")
        await db.commit()
        response.delete_cookie("breatheiq_refresh", path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session security compromise detected. Please log in again."
        )

    # Check expiration
    if ensure_utc(token_record.expires_at) < now:
        token_record.revoked_at = now
        await db.commit()
        response.delete_cookie("breatheiq_refresh", path="/")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    # Rotate token: revoke current token and issue new one in the same family
    token_record.revoked_at = now

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user or not user.is_active:
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive")

    new_raw_refresh, new_jti_h, new_expires_at = create_refresh_token(user.id, family_id)
    new_rt = RefreshToken(
        user_id=user.id,
        family_id=family_id,
        jti_hash=new_jti_h,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=new_expires_at
    )
    db.add(new_rt)
    await db.commit()

    response.set_cookie(
        key="breatheiq_refresh",
        value=new_raw_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )

    new_access = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=new_access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    breatheiq_refresh: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db)
):
    if breatheiq_refresh:
        try:
            decoded = decode_token(breatheiq_refresh)
            jti = decoded.get("jti")
            if jti:
                jti_h = hash_token(jti)
                await db.execute(
                    update(RefreshToken)
                    .where(RefreshToken.jti_hash == jti_h)
                    .values(revoked_at=datetime.now(timezone.utc))
                )
                await db.commit()
        except Exception:
            pass

    response.delete_cookie("breatheiq_refresh", path="/")
    return MessageResponse(message="Logged out successfully")

@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .values(revoked_at=datetime.now(timezone.utc))
    )
    await db.commit()
    response.delete_cookie("breatheiq_refresh", path="/")
    return MessageResponse(message="All active sessions revoked")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .order_by(RefreshToken.created_at.desc())
    )
    tokens = res.scalars().all()
    return [
        SessionResponse(
            id=t.id,
            family_id=t.family_id,
            user_agent=t.user_agent,
            ip_address=t.ip_address,
            created_at=t.created_at.isoformat(),
            expires_at=t.expires_at.isoformat(),
            is_revoked=t.revoked_at is not None
        )
        for t in tokens
    ]

@router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(RefreshToken).where(
            RefreshToken.id == session_id,
            RefreshToken.user_id == current_user.id
        )
    )
    token = res.scalars().first()
    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    token.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return MessageResponse(message="Session successfully revoked")

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = res.scalars().first()
    if user:
        raw_token, jti_h, expires_at = create_one_time_token(user.id, "reset_password", expires_minutes=30)
        ott = OneTimeToken(
            user_id=user.id,
            jti_hash=jti_h,
            purpose="reset_password",
            expires_at=expires_at
        )
        db.add(ott)
        await db.commit()
        # In Dev Mode, print reset URL to console
        print(f"\n[DEV MODE] Password Reset Link for {user.email}: http://localhost:5173/reset-password?token={raw_token}\n")

    return MessageResponse(
        message="If that email is registered, password reset instructions have been generated.",
        details="In development mode, check your server console log for the reset link."
    )

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        decoded = decode_token(payload.token)
        if decoded.get("type") != "one_time" or decoded.get("purpose") != "reset_password":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
        user_id = int(decoded.get("sub"))
        jti = decoded.get("jti")
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    jti_h = hash_token(jti)
    now = datetime.now(timezone.utc)
    res = await db.execute(select(OneTimeToken).where(OneTimeToken.jti_hash == jti_h))
    token_rec = res.scalars().first()

    if not token_rec or token_rec.used_at is not None or ensure_utc(token_rec.expires_at) < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already used or expired")

    token_rec.used_at = now

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    # Revoke all existing sessions for security
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id)
        .values(revoked_at=now)
    )
    log_audit(db, user.id, "AUTH_PASSWORD_RESET_SUCCESS", request, "Password reset and sessions revoked")
    await db.commit()

    return MessageResponse(message="Password successfully reset. You may now log in with your new password.")

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        decoded = decode_token(payload.token)
        if decoded.get("type") != "one_time" or decoded.get("purpose") != "verify_email":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
        user_id = int(decoded.get("sub"))
        jti = decoded.get("jti")
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    jti_h = hash_token(jti)
    now = datetime.now(timezone.utc)
    res = await db.execute(select(OneTimeToken).where(OneTimeToken.jti_hash == jti_h))
    token_rec = res.scalars().first()

    if not token_rec or token_rec.used_at is not None or ensure_utc(token_rec.expires_at) < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already used or expired")

    token_rec.used_at = now
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if user:
        user.is_verified = True
    await db.commit()

    return MessageResponse(message="Email address successfully verified.")
