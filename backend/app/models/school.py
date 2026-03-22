from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    school_name = Column(String(255), nullable=False)
    representative_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    license_number = Column(String(100), nullable=True)
    license_file_path = Column(String(500), nullable=True)
    founded_year = Column(Integer, nullable=True)
    school_type = Column(String(50), nullable=True)
    number_of_students = Column(Integer, nullable=True)
    number_of_teachers = Column(Integer, nullable=True)
    accreditation_info = Column(Text, nullable=True)
    school_level = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="school")
    jobs = relationship("Job", back_populates="school", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="school", cascade="all, delete-orphan")


class SchoolList(Base):
    """Reference table of all schools in Ethiopia (admin-managed)."""
    __tablename__ = "school_list"

    id = Column(Integer, primary_key=True, autoincrement=True)
    School_Name = Column(String(255), nullable=False)
    School_level = Column(String(100), nullable=True)
    School_address = Column(Text, nullable=True)
    No_bracch = Column(Integer, default=0)
    no_teachers = Column(Integer, default=0)
    no_students = Column(Integer, default=0)
    repsentative = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
