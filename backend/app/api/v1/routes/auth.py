import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.core.activity import log_activity
from app.core.notify import notify_admins
from app.models.user import User, UserRole, UserStatus
from app.models.teacher import Teacher
from app.models.school import School
from app.models.password_reset import PasswordReset
from app.schemas.user import UserCreate, UserOut, Token, ChangePassword
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_EXPIRE_MINUTES = 15


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Send email via SMTP. Raises on failure."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        status=UserStatus.pending,
    )
    db.add(user)
    await db.flush()

    if data.role == UserRole.teacher:
        db.add(Teacher(user_id=user.id, first_name="", last_name=""))
    elif data.role == UserRole.school:
        db.add(School(user_id=user.id, school_name="", representative_name=""))

    await db.commit()
    await log_activity(
        action="register",
        user_id=user.id,
        user_email=user.email,
        user_role=str(user.role.value),
        description=f"New {user.role.value} registered",
    )
    if data.role == UserRole.teacher:
        await notify_admins(
            title="New Teacher Registered",
            message=f"A new teacher registered with email {user.email}. Review and approve their profile.",
            related_id=user.id,
        )
    elif data.role == UserRole.school:
        await notify_admins(
            title="New School Registered",
            message=f"A new school registered with email {user.email}. Review and approve their profile.",
            related_id=user.id,
        )
    return {"message": "Registration successful"}


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.teacher), selectinload(User.school))
        .where(User.email == form.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status == UserStatus.inactive:
        raise HTTPException(status_code=403, detail="Account is inactive. Contact support.")

    token = create_access_token({"sub": str(user.id), "role": user.role})

    await log_activity(
        action="login",
        user_id=user.id,
        user_email=user.email,
        user_role=str(user.role.value),
        description="User logged in",
        ip_address=request.client.host if request.client else None,
    )

    profile = None
    if user.role == UserRole.teacher and user.teacher:
        from app.schemas.teacher import TeacherOut
        profile = TeacherOut.model_validate(user.teacher).model_dump()
    elif user.role == UserRole.school and user.school:
        from app.schemas.school import SchoolOut
        profile = SchoolOut.model_validate(user.school).model_dump()

    return Token(access_token=token, user=UserOut.model_validate(user), profile=profile)


@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Send a 6-digit OTP to the user's email for password reset."""
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="Email is required")

    # Always return 200 to avoid user enumeration
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user:
        return {"message": "If that email exists, a reset code has been sent."}

    # Delete any existing OTPs for this email
    await db.execute(delete(PasswordReset).where(PasswordReset.email == email))

    otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    db.add(PasswordReset(email=email, otp=hash_password(otp), expires_at=expires_at))
    await db.commit()

    # Send email
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#221902;margin:0;">Password Reset</h2>
        <p style="color:#6b7280;margin-top:8px;">Use the code below to reset your Astemari password.</p>
      </div>
      <div style="background:#fef3c7;border:1px solid #C5A021;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <p style="margin:0;font-size:13px;color:#8E6708;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Your Reset Code</p>
        <p style="margin:8px 0 0;font-size:40px;font-weight:900;letter-spacing:12px;color:#221902;">{otp}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">This code expires in <strong>{OTP_EXPIRE_MINUTES} minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:11px;text-align:center;">Astemari — Ethiopia's Teacher Network</p>
    </div>
    """

    try:
        _send_email(email, "Your Astemari Password Reset Code", html)
    except Exception:
        # Don't expose SMTP errors to client
        pass

    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/reset-password")
async def reset_password(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Verify OTP and set new password."""
    email = payload.get("email", "").strip().lower()
    otp = payload.get("otp", "").strip()
    new_password = payload.get("new_password", "")

    if not email or not otp or not new_password:
        raise HTTPException(status_code=422, detail="email, otp, and new_password are required")
    if len(new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    record = (await db.execute(
        select(PasswordReset)
        .where(PasswordReset.email == email)
        .order_by(PasswordReset.created_at.desc())
    )).scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    if record.expires_at < datetime.utcnow():
        await db.delete(record)
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
    if not verify_password(otp, record.otp):
        raise HTTPException(status_code=400, detail="Invalid reset code")

    # Update password
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = hash_password(new_password)
    await db.delete(record)
    await db.commit()

    return {"message": "Password reset successfully. You can now log in."}
