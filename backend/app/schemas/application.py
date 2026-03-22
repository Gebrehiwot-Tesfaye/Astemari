from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.models.job_application import ApplicationStatus
from app.schemas.teacher import TeacherOut
from app.schemas.job import JobOut


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None
    teacher_id: Optional[int] = None  # required when applying as admin

    @field_validator("job_id")
    @classmethod
    def job_id_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("job_id must be a positive integer")
        return v


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    teacher_id: int
    cover_letter: Optional[str] = None
    status: ApplicationStatus
    applied_at: datetime
    teacher: Optional[TeacherOut] = None
    job: Optional[JobOut] = None

    model_config = {"from_attributes": True}
