from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = (await db.execute(
        select(Notification).where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc()).limit(limit)
    )).scalars().all()
    return [NotificationOut.model_validate(n) for n in notifs]


@router.post("/read-all", status_code=204)
async def mark_all_read(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()


@router.patch("/{notif_id}/read", status_code=204)
async def mark_read(notif_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    notif = (await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id))).scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
