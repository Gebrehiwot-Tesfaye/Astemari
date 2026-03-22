from sqlalchemy import Column, Integer, String, Boolean, Numeric, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TeacherStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    profile_completed = Column(Boolean, default=False)
    salary_expectation = Column(Numeric(10, 2), nullable=True)
    cv_path = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    work_experience = Column(Text, nullable=True)
    preferred_location = Column(String(255), nullable=True)
    additional_documents = Column(Text, nullable=True)
    profile_picture = Column(String(500), nullable=True)
    department = Column(String(100), nullable=True)
    status = Column(Enum(TeacherStatus), default=TeacherStatus.active)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="teacher")
    applications = relationship("JobApplication", back_populates="teacher", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="teacher", cascade="all, delete-orphan")
