"""Send notifications to all admin users using an isolated session."""
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from sqlalchemy import select


async def notify_admins(
    *,
    title: str,
    message: str,
    notif_type: NotificationType = NotificationType.system,
    related_id: int | None = None,
) -> None:
    """Create a notification for every admin user. Never raises."""
    try:
        async with AsyncSessionLocal() as session:
            admin_ids = (
                await session.execute(
                    select(User.id).where(User.role == UserRole.admin)
                )
            ).scalars().all()
            for admin_id in admin_ids:
                session.add(Notification(
                    user_id=admin_id,
                    type=notif_type,
                    title=title,
                    message=message,
                    related_id=related_id,
                ))
            await session.commit()
    except Exception:
        pass
