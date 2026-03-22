from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: Optional[str] = None
    is_read: bool
    related_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
