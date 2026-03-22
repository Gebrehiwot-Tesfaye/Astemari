from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class TeacherCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: Optional[str] = None


class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    work_experience: Optional[str] = None
    preferred_location: Optional[str] = None
    department: Optional[str] = None
    salary_expectation: Optional[Decimal] = None


class TeacherOut(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_completed: bool
    salary_expectation: Optional[Decimal] = None
    cv_path: Optional[str] = None
    additional_documents: Optional[str] = None
    address: Optional[str] = None
    work_experience: Optional[str] = None
    preferred_location: Optional[str] = None
    profile_picture: Optional[str] = None
    department: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
