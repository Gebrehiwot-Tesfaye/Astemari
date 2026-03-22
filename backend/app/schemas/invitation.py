from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.models.invitation import InvitationStatus


class InvitationCreate(BaseModel):
    teacher_id: int
    department: str
    message: Optional[str] = None
    school_id: Optional[int] = None  # required when sending as admin

    @field_validator("teacher_id")
    @classmethod
    def teacher_id_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("teacher_id must be a positive integer")
        return v


class InvitationUpdate(BaseModel):
    status: InvitationStatus


class InvitationOut(BaseModel):
    id: int
    school_id: int
    teacher_id: int
    department: str
    message: Optional[str] = None
    status: InvitationStatus
    created_at: datetime
    school_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = {"from_attributes": True}
