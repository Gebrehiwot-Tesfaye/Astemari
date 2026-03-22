from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.job import JobStatus


class JobCreate(BaseModel):
    title: str
    department: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    school_id: Optional[int] = None  # required when posting as admin


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    status: Optional[JobStatus] = None


class JobOut(BaseModel):
    id: int
    school_id: int
    school_name: Optional[str] = None
    school_address: Optional[str] = None
    title: str
    department: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    status: JobStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedJobs(BaseModel):
    items: list[JobOut]
    total: int
    page: int
    size: int
    pages: int
