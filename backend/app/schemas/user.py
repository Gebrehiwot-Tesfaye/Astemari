from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserStatus
import enum


class StaffRole(str, enum.Enum):
    cleaner = "cleaner"
    secretary = "secretary"
    manager = "manager"
    accountant = "accountant"
    it_support = "it_support"
    receptionist = "receptionist"
    other = "other"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class UserUpdate(BaseModel):
    status: Optional[UserStatus] = None


class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    status: UserStatus
    activated_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    profile: Optional[dict] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class StaffProfileCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    staff_role: StaffRole = StaffRole.other
    department: Optional[str] = None
    notes: Optional[str] = None
    can_manage_jobs: bool = False
    can_manage_schools: bool = False
    can_manage_teachers: bool = False
    can_view_reports: bool = False
    can_manage_users: bool = False


class StaffProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    staff_role: Optional[StaffRole] = None
    department: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[UserStatus] = None
    can_manage_jobs: Optional[bool] = None
    can_manage_schools: Optional[bool] = None
    can_manage_teachers: Optional[bool] = None
    can_view_reports: Optional[bool] = None
    can_manage_users: Optional[bool] = None


class StaffProfileOut(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    staff_role: str
    department: Optional[str] = None
    notes: Optional[str] = None
    can_manage_jobs: bool
    can_manage_schools: bool
    can_manage_teachers: bool
    can_view_reports: bool
    can_manage_users: bool
    created_at: datetime

    model_config = {"from_attributes": True}
