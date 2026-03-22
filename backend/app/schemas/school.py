from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SchoolCreate(BaseModel):
    school_name: str
    representative_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    school_type: Optional[str] = None
    school_level: Optional[str] = None
    founded_year: Optional[int] = None


class SchoolUpdate(SchoolCreate):
    school_name: Optional[str] = None
    representative_name: Optional[str] = None
    license_number: Optional[str] = None
    number_of_students: Optional[int] = None
    number_of_teachers: Optional[int] = None
    accreditation_info: Optional[str] = None


class SchoolOut(BaseModel):
    id: int
    user_id: int
    school_name: str
    representative_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    license_number: Optional[str] = None
    license_file_path: Optional[str] = None
    founded_year: Optional[int] = None
    school_type: Optional[str] = None
    number_of_students: Optional[int] = None
    number_of_teachers: Optional[int] = None
    school_level: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
