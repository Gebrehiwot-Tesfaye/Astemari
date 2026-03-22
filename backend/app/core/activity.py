"""Utility for writing activity log entries using an isolated session."""
from app.core.database import AsyncSessionLocal
from app.models.activity_log import ActivityLog


async def log_activity(
    db=None,  # kept for backward compat, not used
    *,
    action: str,
    user_id: int | None = None,
    user_email: str | None = None,
    user_role: str | None = None,
    description: str | None = None,
    ip_address: str | None = None,
) -> None:
    """Insert an activity log row in its own session. Never raises."""
    try:
        async with AsyncSessionLocal() as session:
            session.add(ActivityLog(
                action=action,
                user_id=user_id,
                user_email=user_email,
                user_role=user_role,
                description=description,
                ip_address=ip_address,
            ))
            await session.commit()
    except Exception:
        pass
