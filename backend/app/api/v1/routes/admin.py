from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from math import ceil
from app.core.database import get_db
from app.core.security import hash_password
from app.core.activity import log_activity
from app.models.user import User, UserRole, UserStatus
from app.models.teacher import Teacher, TeacherStatus
from app.models.school import School
from app.models.job import Job, JobStatus
from app.models.job_application import JobApplication
from app.models.invitation import Invitation
from app.schemas.user import UserOut, UserUpdate, StaffProfileCreate, StaffProfileUpdate, StaffProfileOut, StaffRole
from app.core.database import Base
from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum, DateTime, ForeignKey, func as safunc
import enum as _enum

# Local stub — staff_profiles table not in current DB schema
class _StaffRole(_enum.Enum):
    other = "other"

class StaffProfile(Base):
    __tablename__ = "staff_profiles"
    __table_args__ = {"extend_existing": True}
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    staff_role = Column(String(50), default="other")
    department = Column(String(100))
    notes = Column(String(500))
    can_manage_jobs = Column(Boolean, default=False)
    can_manage_schools = Column(Boolean, default=False)
    can_manage_teachers = Column(Boolean, default=False)
    can_view_reports = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=safunc.now())
    updated_at = Column(DateTime, server_default=safunc.now(), onupdate=safunc.now())
from app.schemas.school import SchoolOut, SchoolCreate, SchoolUpdate
from app.schemas.teacher import TeacherOut, TeacherCreate, TeacherUpdate
from app.schemas.job import JobCreate, JobOut, JobUpdate, PaginatedJobs
from app.api.deps import require_role

router = APIRouter(prefix="/admin", tags=["admin"])

AdminDep = Depends(require_role(UserRole.admin))


# ── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db), _: User = AdminDep):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_teachers = (await db.execute(select(func.count(Teacher.id)))).scalar()
    total_schools = (await db.execute(select(func.count(School.id)))).scalar()
    active_jobs = (await db.execute(select(func.count(Job.id)).where(Job.status == JobStatus.active))).scalar()
    total_applications = (await db.execute(select(func.count(JobApplication.id)))).scalar()
    total_invitations = (await db.execute(select(func.count(Invitation.id)))).scalar()
    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_schools": total_schools,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "total_invitations": total_invitations,
    }


# ── Users ────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    role: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    q = select(User)
    if search:
        q = q.where(User.email.ilike(f"%{search}%"))
    if role:
        q = q.where(User.role == role)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    users = (await db.execute(q.offset((page - 1) * size).limit(size).order_by(User.created_at.desc()))).scalars().all()
    return {"items": [UserOut.model_validate(u) for u in users], "total": total, "page": page, "size": size, "pages": ceil(total / size) if total else 1}


@router.patch("/users/{user_id}")
async def update_user(user_id: int, data: UserUpdate, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.status:
        user.status = data.status
    await db.commit()
    return UserOut.model_validate(user)


# ── Schools ──────────────────────────────────────────────────────────────────

@router.get("/schools/all")
async def admin_list_schools_simple(db: AsyncSession = Depends(get_db), _: User = AdminDep):
    """Lightweight list of all schools for dropdowns."""
    schools = (await db.execute(select(School).order_by(School.school_name))).scalars().all()
    return {"items": [SchoolOut.model_validate(s) for s in schools], "total": len(schools), "page": 1, "size": len(schools), "pages": 1}


@router.get("/schools")
async def admin_list_schools(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    school_level: str = Query(None),
    school_type: str = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    q = select(School, User.email, User.status.label("user_status")).join(User, School.user_id == User.id)
    if search:
        q = q.where(or_(
            School.school_name.ilike(f"%{search}%"),
            School.representative_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        ))
    if status:
        q = q.where(User.status == status)
    if school_level:
        q = q.where(School.school_level == school_level)
    if school_type:
        q = q.where(School.school_type == school_type)

    # Sorting
    sort_col = getattr(School, sort_by, School.created_at)
    q = q.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()

    total_all = (await db.execute(select(func.count(School.id)))).scalar()
    total_pending = (await db.execute(select(func.count(School.id)).join(User, School.user_id == User.id).where(User.status == UserStatus.pending))).scalar()
    total_active = (await db.execute(select(func.count(School.id)).join(User, School.user_id == User.id).where(User.status == UserStatus.active))).scalar()
    total_inactive = (await db.execute(select(func.count(School.id)).join(User, School.user_id == User.id).where(User.status == UserStatus.inactive))).scalar()
    total_completed = (await db.execute(select(func.count(School.id)).join(User, School.user_id == User.id).where(User.status == UserStatus.completed))).scalar()

    rows = (await db.execute(q.offset((page - 1) * size).limit(size))).all()

    items = []
    for school, email, user_status in rows:
        job_count = (await db.execute(select(func.count(Job.id)).where(Job.school_id == school.id))).scalar()
        inv_count = (await db.execute(select(func.count(Invitation.id)).where(Invitation.school_id == school.id))).scalar()
        d = SchoolOut.model_validate(school).model_dump()
        d["user_email"] = email
        d["user_status"] = str(user_status.value) if hasattr(user_status, "value") else str(user_status)
        d["job_count"] = job_count
        d["invitation_count"] = inv_count
        items.append(d)

    return {
        "items": items, "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
        "stats": {"all": total_all, "pending": total_pending, "active": total_active, "inactive": total_inactive, "completed": total_completed},
    }


@router.post("/schools", status_code=201)
async def admin_create_school(
    data: SchoolCreate,
    email: str = Query(...),
    password: str = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=email, password=hash_password(password), role=UserRole.school, status=UserStatus.pending)
    db.add(user)
    await db.flush()
    school = School(**data.model_dump(), user_id=user.id)
    db.add(school)
    await db.commit()
    await db.refresh(school)
    d = SchoolOut.model_validate(school).model_dump()
    d["user_email"] = email
    d["user_status"] = "pending"
    d["job_count"] = 0
    d["invitation_count"] = 0
    return d


@router.patch("/schools/{school_id}")
async def admin_update_school(school_id: int, data: SchoolUpdate, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    school = (await db.execute(select(School).where(School.id == school_id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(school, k, v)
    await db.commit()
    await db.refresh(school)
    return SchoolOut.model_validate(school)


@router.patch("/schools/{school_id}/status")
async def change_school_status(
    school_id: int,
    status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    school = (await db.execute(select(School).where(School.id == school_id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    user = (await db.execute(select(User).where(User.id == school.user_id))).scalar_one_or_none()
    if user:
        user.status = status
        await db.commit()
    return {"message": f"Status changed to {status}"}


@router.patch("/schools/{school_id}/approve")
async def approve_school(school_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    school = (await db.execute(select(School).where(School.id == school_id))).scalar_one_or_none()
    if school:
        user = (await db.execute(select(User).where(User.id == school.user_id))).scalar_one_or_none()
        if user:
            user.status = UserStatus.active
            await db.commit()
            await log_activity(action="school_approved", user_id=user.id, user_email=user.email, user_role="admin",
                               description=f"School '{school.school_name}' approved")
    return {"message": "Approved"}


@router.patch("/schools/{school_id}/reject")
async def reject_school(school_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    school = (await db.execute(select(School).where(School.id == school_id))).scalar_one_or_none()
    if school:
        user = (await db.execute(select(User).where(User.id == school.user_id))).scalar_one_or_none()
        if user:
            user.status = UserStatus.inactive
            await db.commit()
            await log_activity(action="school_rejected", user_id=user.id, user_email=user.email, user_role="admin",
                               description=f"School '{school.school_name}' rejected")
    return {"message": "Rejected"}


@router.delete("/schools/{school_id}", status_code=204)
async def delete_school(school_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    school = (await db.execute(select(School).where(School.id == school_id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    user = (await db.execute(select(User).where(User.id == school.user_id))).scalar_one_or_none()
    if user:
        await db.delete(user)  # cascades to school
    else:
        await db.delete(school)
    await db.commit()


# ── Teachers ─────────────────────────────────────────────────────────────────

@router.get("/teachers")
async def admin_list_teachers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    department: str = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    q = select(Teacher, User.email, User.status.label("user_status")).join(User, Teacher.user_id == User.id)
    if search:
        q = q.where(or_(
            Teacher.first_name.ilike(f"%{search}%"),
            Teacher.last_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        ))
    if status:
        q = q.where(User.status == status)
    if department:
        q = q.where(Teacher.department == department)

    sort_col = getattr(Teacher, sort_by, Teacher.created_at)
    q = q.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()

    total_all = (await db.execute(select(func.count(Teacher.id)))).scalar()
    total_pending = (await db.execute(select(func.count(Teacher.id)).join(User, Teacher.user_id == User.id).where(User.status == UserStatus.pending))).scalar()
    total_active = (await db.execute(select(func.count(Teacher.id)).join(User, Teacher.user_id == User.id).where(User.status == UserStatus.active))).scalar()
    total_inactive = (await db.execute(select(func.count(Teacher.id)).join(User, Teacher.user_id == User.id).where(User.status == UserStatus.inactive))).scalar()
    total_completed = (await db.execute(select(func.count(Teacher.id)).join(User, Teacher.user_id == User.id).where(User.status == UserStatus.completed))).scalar()

    rows = (await db.execute(q.offset((page - 1) * size).limit(size))).all()

    items = []
    for teacher, email, user_status in rows:
        app_count = (await db.execute(select(func.count(JobApplication.id)).where(JobApplication.teacher_id == teacher.id))).scalar()
        inv_count = (await db.execute(select(func.count(Invitation.id)).where(Invitation.teacher_id == teacher.id))).scalar()
        d = TeacherOut.model_validate(teacher).model_dump()
        d["user_email"] = email
        d["user_status"] = str(user_status.value) if hasattr(user_status, "value") else str(user_status)
        d["application_count"] = app_count
        d["invitation_count"] = inv_count
        items.append(d)

    return {
        "items": items, "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
        "stats": {"all": total_all, "pending": total_pending, "active": total_active, "inactive": total_inactive, "completed": total_completed},
    }


@router.post("/teachers", status_code=201)
async def admin_create_teacher(
    data: TeacherCreate,
    email: str = Query(...),
    password: str = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=email, password=hash_password(password), role=UserRole.teacher, status=UserStatus.pending)
    db.add(user)
    await db.flush()
    teacher = Teacher(**data.model_dump(), user_id=user.id)
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    d = TeacherOut.model_validate(teacher).model_dump()
    d["user_email"] = email
    d["user_status"] = "pending"
    d["application_count"] = 0
    d["invitation_count"] = 0
    return d


@router.patch("/teachers/{teacher_id}")
async def admin_update_teacher(teacher_id: int, data: TeacherUpdate, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    teacher = (await db.execute(select(Teacher).where(Teacher.id == teacher_id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(teacher, k, v)
    await db.commit()
    await db.refresh(teacher)
    return TeacherOut.model_validate(teacher)


@router.patch("/teachers/{teacher_id}/status")
async def change_teacher_status(
    teacher_id: int,
    status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    teacher = (await db.execute(select(Teacher).where(Teacher.id == teacher_id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    user = (await db.execute(select(User).where(User.id == teacher.user_id))).scalar_one_or_none()
    if user:
        user.status = status
        await db.commit()
    return {"message": f"Status changed to {status}"}


@router.delete("/teachers/{teacher_id}", status_code=204)
async def delete_teacher(teacher_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    teacher = (await db.execute(select(Teacher).where(Teacher.id == teacher_id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    user = (await db.execute(select(User).where(User.id == teacher.user_id))).scalar_one_or_none()
    if user:
        await db.delete(user)
    else:
        await db.delete(teacher)
    await db.commit()


# ── Staff ─────────────────────────────────────────────────────────────────────

@router.get("/staff")
async def admin_list_staff(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    staff_role: str = Query(None),
    status: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    q = select(StaffProfile, User.email, User.status.label("user_status")).join(User, StaffProfile.user_id == User.id)
    if search:
        q = q.where(or_(
            StaffProfile.first_name.ilike(f"%{search}%"),
            StaffProfile.last_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        ))
    if staff_role:
        q = q.where(StaffProfile.staff_role == staff_role)
    if status:
        q = q.where(User.status == status)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((page - 1) * size).limit(size).order_by(StaffProfile.created_at.desc()))).all()

    items = []
    for staff, email, user_status in rows:
        d = StaffProfileOut.model_validate(staff).model_dump()
        d["user_email"] = email
        d["user_status"] = str(user_status.value) if hasattr(user_status, "value") else str(user_status)
        items.append(d)

    return {"items": items, "total": total, "page": page, "size": size, "pages": ceil(total / size) if total else 1}


@router.post("/staff", status_code=201)
async def admin_create_staff(data: StaffProfileCreate, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    existing = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), role=UserRole.staff, status=UserStatus.active)
    db.add(user)
    await db.flush()
    staff = StaffProfile(
        user_id=user.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        staff_role=data.staff_role,
        department=data.department,
        notes=data.notes,
        can_manage_jobs=data.can_manage_jobs,
        can_manage_schools=data.can_manage_schools,
        can_manage_teachers=data.can_manage_teachers,
        can_view_reports=data.can_view_reports,
        can_manage_users=data.can_manage_users,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    d = StaffProfileOut.model_validate(staff).model_dump()
    d["user_email"] = data.email
    d["user_status"] = "active"
    return d


@router.patch("/staff/{staff_id}")
async def admin_update_staff(staff_id: int, data: StaffProfileUpdate, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    staff = (await db.execute(select(StaffProfile).where(StaffProfile.id == staff_id))).scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    update_data = data.model_dump(exclude_none=True)
    status = update_data.pop("status", None)
    for k, v in update_data.items():
        setattr(staff, k, v)
    if status:
        user = (await db.execute(select(User).where(User.id == staff.user_id))).scalar_one_or_none()
        if user:
            user.status = status
    await db.commit()
    await db.refresh(staff)
    return StaffProfileOut.model_validate(staff)


@router.delete("/staff/{staff_id}", status_code=204)
async def delete_staff(staff_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    staff = (await db.execute(select(StaffProfile).where(StaffProfile.id == staff_id))).scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    user = (await db.execute(select(User).where(User.id == staff.user_id))).scalar_one_or_none()
    if user:
        await db.delete(user)
    else:
        await db.delete(staff)
    await db.commit()


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics/departments")
async def analytics_departments(db: AsyncSession = Depends(get_db), _: User = AdminDep):
    """Return distinct departments that actually exist in jobs or teachers tables."""
    job_depts = (await db.execute(
        select(Job.department).where(Job.department.isnot(None)).distinct()
    )).scalars().all()
    teacher_depts = (await db.execute(
        select(Teacher.department).where(Teacher.department.isnot(None)).distinct()
    )).scalars().all()
    merged = sorted(set(d for d in list(job_depts) + list(teacher_depts) if d and d.strip()))
    return {"departments": merged}


@router.get("/analytics")
async def analytics(
    date_range: str = Query("12m", description="today|7d|1m|6m|1y|2y|5y|12m"),
    department: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    from datetime import datetime, timedelta, date as date_type
    from sqlalchemy import extract, and_
    import calendar

    now = datetime.utcnow()

    # ── Resolve cutoff ────────────────────────────────────────────────────
    range_map = {
        "today": timedelta(days=1),
        "7d":    timedelta(days=7),
        "1m":    timedelta(days=30),
        "6m":    timedelta(days=182),
        "1y":    timedelta(days=365),
        "2y":    timedelta(days=730),
        "5y":    timedelta(days=1825),
        "12m":   timedelta(days=365),
    }
    if date_range == "all":
        cutoff = datetime(2000, 1, 1)  # effectively no cutoff
    else:
        delta = range_map.get(date_range, timedelta(days=365))
        cutoff = now - delta

    use_daily = date_range in ("today", "7d", "1m")

    # ── Build buckets oldest→newest ───────────────────────────────────────
    if date_range == "all":
        # Find earliest record across teachers, schools, jobs
        earliest_teacher = (await db.execute(select(func.min(Teacher.created_at)))).scalar()
        earliest_school  = (await db.execute(select(func.min(School.created_at)))).scalar()
        earliest_job     = (await db.execute(select(func.min(Job.created_at)))).scalar()
        candidates = [x for x in [earliest_teacher, earliest_school, earliest_job] if x]
        earliest = min(candidates) if candidates else now
        # Monthly buckets from earliest month to now
        start_year, start_month = earliest.year, earliest.month
        buckets = []
        y, m = start_year, start_month
        while (y, m) <= (now.year, now.month):
            last_day = calendar.monthrange(y, m)[1]
            buckets.append({
                "key": f"{y}-{m:02d}",
                "label": f"{calendar.month_abbr[m]} {y}",
                "year": y, "month": m,
                "dt_start": datetime(y, m, 1, 0, 0, 0),
                "dt_end":   datetime(y, m, last_day, 23, 59, 59, 999999),
            })
            m += 1
            if m > 12:
                m = 1; y += 1
        use_daily = False
    elif use_daily:
        days_count = 1 if date_range == "today" else (7 if date_range == "7d" else 30)
        buckets = []
        for i in range(days_count - 1, -1, -1):
            d = (now - timedelta(days=i)).date()
            buckets.append({
                "key": f"{d.year}-{d.month:02d}-{d.day:02d}",
                "label": d.strftime("%b %d"),
                "year": d.year, "month": d.month, "day": d.day,
                "dt_start": datetime(d.year, d.month, d.day, 0, 0, 0),
                "dt_end":   datetime(d.year, d.month, d.day, 23, 59, 59, 999999),
            })
    else:
        months_count = {"6m": 6, "1y": 12, "2y": 24, "5y": 60, "12m": 12}.get(date_range, 12)
        buckets = []
        for i in range(months_count - 1, -1, -1):
            month_offset = now.month - 1 - i
            year = now.year + month_offset // 12
            month = month_offset % 12 + 1
            if month <= 0:
                month += 12
                year -= 1
            last_day = calendar.monthrange(year, month)[1]
            buckets.append({
                "key": f"{year}-{month:02d}",
                "label": f"{calendar.month_abbr[month]} {year}",
                "year": year, "month": month,
                "dt_start": datetime(year, month, 1, 0, 0, 0),
                "dt_end":   datetime(year, month, last_day, 23, 59, 59, 999999),
            })

    # ── Registration time-series ──────────────────────────────────────────
    registrations = []
    for b in buckets:
        t_q = select(func.count(Teacher.id)).where(
            Teacher.created_at >= b["dt_start"], Teacher.created_at <= b["dt_end"]
        )
        s_q = select(func.count(School.id)).where(
            School.created_at >= b["dt_start"], School.created_at <= b["dt_end"]
        )
        t_count = (await db.execute(t_q)).scalar() or 0
        s_count = (await db.execute(s_q)).scalar() or 0
        registrations.append({"key": b["key"], "name": b["label"], "teachers": t_count, "schools": s_count})

    # ── Department distribution ───────────────────────────────────────────
    dept_q = (
        select(Job.department, func.count(Job.id).label("cnt"))
        .where(Job.created_at >= cutoff)
        .group_by(Job.department)
        .order_by(func.count(Job.id).desc())
    )
    if department:
        dept_q = dept_q.where(Job.department == department)
    dept_rows = (await db.execute(dept_q)).all()
    departments_list = [{"name": r.department, "value": r.cnt} for r in dept_rows if r.department]

    # Teacher counts per department
    dept_teacher_rows = (await db.execute(
        select(Teacher.department, func.count(Teacher.id).label("cnt"))
        .where(Teacher.created_at >= cutoff, Teacher.department.isnot(None))
        .group_by(Teacher.department)
        .order_by(func.count(Teacher.id).desc())
    )).all()
    dept_teachers_map = {r.department: r.cnt for r in dept_teacher_rows}

    # School counts per department (schools that have jobs in that dept)
    dept_school_rows = (await db.execute(
        select(Job.department, func.count(func.distinct(Job.school_id)).label("cnt"))
        .where(Job.created_at >= cutoff, Job.department.isnot(None))
        .group_by(Job.department)
    )).all()
    dept_schools_map = {r.department: r.cnt for r in dept_school_rows}

    for d in departments_list:
        d["teacher_count"] = dept_teachers_map.get(d["name"], 0)
        d["school_count"] = dept_schools_map.get(d["name"], 0)

    # ── Application time-series ───────────────────────────────────────────
    applications = []
    for b in buckets:
        app_q = select(func.count(JobApplication.id)).where(
            JobApplication.applied_at >= b["dt_start"], JobApplication.applied_at <= b["dt_end"]
        )
        acc_q = select(func.count(JobApplication.id)).where(
            JobApplication.applied_at >= b["dt_start"], JobApplication.applied_at <= b["dt_end"],
            JobApplication.status == "accepted",
        )
        job_q = select(func.count(Job.id)).where(
            Job.created_at >= b["dt_start"], Job.created_at <= b["dt_end"]
        )
        if department:
            app_q = app_q.join(Job, JobApplication.job_id == Job.id).where(Job.department == department)
            acc_q = acc_q.join(Job, JobApplication.job_id == Job.id).where(Job.department == department)
            job_q = job_q.where(Job.department == department)

        total_apps  = (await db.execute(app_q)).scalar() or 0
        accepted_apps = (await db.execute(acc_q)).scalar() or 0
        jobs_posted = (await db.execute(job_q)).scalar() or 0
        applications.append({
            "key": b["key"], "name": b["label"],
            "applications": total_apps, "accepted": accepted_apps, "jobs_posted": jobs_posted,
        })

    # ── Job status breakdown (within range) ───────────────────────────────
    js_q = select(Job.status, func.count(Job.id).label("cnt")).where(Job.created_at >= cutoff).group_by(Job.status)
    if department:
        js_q = js_q.where(Job.department == department)
    job_status = [{"name": r.status, "value": r.cnt} for r in (await db.execute(js_q)).all()]

    # ── Application status breakdown (within range) ───────────────────────
    as_q = (
        select(JobApplication.status, func.count(JobApplication.id).label("cnt"))
        .where(JobApplication.applied_at >= cutoff)
        .group_by(JobApplication.status)
    )
    if department:
        as_q = as_q.join(Job, JobApplication.job_id == Job.id).where(Job.department == department)
    app_status = [{"name": r.status, "value": r.cnt} for r in (await db.execute(as_q)).all()]

    # ── Top locations (within range) ──────────────────────────────────────
    loc_q = (
        select(Job.location, func.count(Job.id).label("cnt"))
        .where(Job.location.isnot(None), Job.created_at >= cutoff)
        .group_by(Job.location)
        .order_by(func.count(Job.id).desc())
        .limit(10)
    )
    if department:
        loc_q = loc_q.where(Job.department == department)
    top_locations = [{"name": r.location, "value": r.cnt} for r in (await db.execute(loc_q)).all()]

    # ── Recent teachers list (latest first) ───────────────────────────────
    recent_teachers_rows = (await db.execute(
        select(Teacher, User.email)
        .join(User, Teacher.user_id == User.id)
        .where(Teacher.created_at >= cutoff)
        .order_by(Teacher.created_at.desc())
        .limit(20)
    )).all()
    recent_teachers = [
        {
            "id": t.id,
            "name": f"{t.first_name} {t.last_name}",
            "email": email,
            "department": t.department,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t, email in recent_teachers_rows
    ]

    # ── Recent schools list (latest first) ────────────────────────────────
    recent_schools_rows = (await db.execute(
        select(School, User.email)
        .join(User, School.user_id == User.id)
        .where(School.created_at >= cutoff)
        .order_by(School.created_at.desc())
        .limit(20)
    )).all()
    recent_schools = [
        {
            "id": s.id,
            "name": s.school_name,
            "email": email,
            "address": s.address,
            "school_type": s.school_type,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s, email in recent_schools_rows
    ]

    # ── Summary totals (within range) ─────────────────────────────────────
    total_teachers = (await db.execute(select(func.count(Teacher.id)).where(Teacher.created_at >= cutoff))).scalar() or 0
    total_schools = (await db.execute(select(func.count(School.id)).where(School.created_at >= cutoff))).scalar() or 0
    total_jobs_q = select(func.count(Job.id)).where(Job.created_at >= cutoff)
    if department:
        total_jobs_q = total_jobs_q.where(Job.department == department)
    total_jobs = (await db.execute(total_jobs_q)).scalar() or 0
    active_jobs_q = select(func.count(Job.id)).where(Job.status == JobStatus.active, Job.created_at >= cutoff)
    if department:
        active_jobs_q = active_jobs_q.where(Job.department == department)
    active_jobs = (await db.execute(active_jobs_q)).scalar() or 0
    total_apps_q = select(func.count(JobApplication.id)).where(JobApplication.applied_at >= cutoff)
    if department:
        total_apps_q = total_apps_q.join(Job, JobApplication.job_id == Job.id).where(Job.department == department)
    total_apps = (await db.execute(total_apps_q)).scalar() or 0
    pending_q = select(func.count(JobApplication.id)).where(JobApplication.status == "pending", JobApplication.applied_at >= cutoff)
    if department:
        pending_q = pending_q.join(Job, JobApplication.job_id == Job.id).where(Job.department == department)
    pending_apps = (await db.execute(pending_q)).scalar() or 0
    accepted_q = select(func.count(JobApplication.id)).where(JobApplication.status == "accepted", JobApplication.applied_at >= cutoff)
    if department:
        accepted_q = accepted_q.join(Job, JobApplication.job_id == Job.id).where(Job.department == department)
    accepted_total = (await db.execute(accepted_q)).scalar() or 0

    return {
        "registrations": list(reversed(registrations)),
        "departments": departments_list,
        "applications": list(reversed(applications)),
        "job_status": job_status,
        "app_status": app_status,
        "top_locations": top_locations,
        "recent_teachers": recent_teachers,
        "recent_schools": recent_schools,
        "summary": {
            "total_teachers": total_teachers,
            "total_schools": total_schools,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_apps,
            "pending_applications": pending_apps,
            "accepted_applications": accepted_total,
            "acceptance_rate": round((accepted_total / total_apps * 100), 1) if total_apps else 0,
        },
    }


# ── Admin Jobs ────────────────────────────────────────────────────────────────

@router.get("/jobs", response_model=PaginatedJobs)
async def admin_list_jobs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    search: str = Query(None),
    department: str = Query(None),
    school_id: int = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    q = select(Job, School.school_name).join(School, Job.school_id == School.id)
    if status:
        q = q.where(Job.status == status)
    if search:
        q = q.where(or_(Job.title.ilike(f"%{search}%"), School.school_name.ilike(f"%{search}%")))
    if department:
        q = q.where(Job.department == department)
    if school_id:
        q = q.where(Job.school_id == school_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((page - 1) * size).limit(size).order_by(Job.created_at.desc()))).all()

    items = []
    for job, school_name in rows:
        out = JobOut.model_validate(job)
        out.school_name = school_name
        items.append(out)

    return PaginatedJobs(items=items, total=total, page=page, size=size, pages=ceil(total / size) if total else 1)


@router.post("/jobs", response_model=JobOut, status_code=201)
async def admin_create_job(
    data: JobCreate,
    school_id: int = Query(..., description="School to post the job under"),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    school = (await db.execute(select(School).where(School.id == school_id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    job = Job(**data.model_dump(), school_id=school_id)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    await log_activity(action="job_posted", user_role="admin",
                       description=f"Job posted: '{job.title}' at {school.school_name}")
    out = JobOut.model_validate(job)
    out.school_name = school.school_name
    return out


@router.patch("/jobs/{job_id}/approve", response_model=JobOut)
async def admin_approve_job(job_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = JobStatus.active
    await db.commit()
    await db.refresh(job)
    school = (await db.execute(select(School).where(School.id == job.school_id))).scalar_one_or_none()
    out = JobOut.model_validate(job)
    out.school_name = school.school_name if school else None
    return out


@router.patch("/jobs/{job_id}", response_model=JobOut)
async def admin_update_job(job_id: int, data: JobUpdate, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(job, k, v)
    await db.commit()
    await db.refresh(job)
    school = (await db.execute(select(School).where(School.id == job.school_id))).scalar_one_or_none()
    out = JobOut.model_validate(job)
    out.school_name = school.school_name if school else None
    return out


@router.delete("/jobs/{job_id}", status_code=204)
async def admin_delete_job(job_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()


# ── Admin Applications ────────────────────────────────────────────────────────

@router.get("/applications")
async def admin_list_applications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    from sqlalchemy.orm import selectinload
    from app.models.job_application import JobApplication
    from app.schemas.application import ApplicationOut

    q = (
        select(JobApplication)
        .options(
            selectinload(JobApplication.job),
            selectinload(JobApplication.teacher),
        )
        .order_by(JobApplication.applied_at.desc())
    )
    if status:
        q = q.where(JobApplication.status == status)
    if search:
        q = q.join(Teacher, JobApplication.teacher_id == Teacher.id).where(
            or_(
                Teacher.first_name.ilike(f"%{search}%"),
                Teacher.last_name.ilike(f"%{search}%"),
            )
        )

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((page - 1) * size).limit(size))).scalars().all()

    # Status counts
    from app.models.job_application import ApplicationStatus
    counts = {}
    for s in ["pending", "accepted", "rejected"]:
        counts[s] = (await db.execute(select(func.count(JobApplication.id)).where(JobApplication.status == s))).scalar() or 0

    # Enrich job.school_name
    school_ids = list({a.job.school_id for a in rows if a.job})
    schools_map = {s.id: s.school_name for s in (await db.execute(select(School).where(School.id.in_(school_ids)))).scalars().all()} if school_ids else {}

    items = []
    for a in rows:
        out = ApplicationOut.model_validate(a)
        if out.job and a.job:
            out.job.school_name = schools_map.get(a.job.school_id)
        items.append(out)

    return {
        "items": items,
        "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
        "counts": counts,
    }


@router.patch("/applications/{app_id}")
async def admin_update_application(
    app_id: int,
    status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    from sqlalchemy.orm import selectinload
    from app.models.job_application import JobApplication
    from app.schemas.application import ApplicationOut

    app = (await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.job), selectinload(JobApplication.teacher))
        .where(JobApplication.id == app_id)
    )).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = status
    await db.commit()
    await db.refresh(app)
    await log_activity(action="application_updated", user_role="admin",
                       description=f"Application #{app_id} status set to {status}")
    return ApplicationOut.model_validate(app)


@router.delete("/applications/{app_id}", status_code=204)
async def admin_delete_application(app_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    from app.models.job_application import JobApplication
    app = (await db.execute(select(JobApplication).where(JobApplication.id == app_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()


# ── Admin Invitations ─────────────────────────────────────────────────────────

@router.get("/invitations")
async def admin_list_invitations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    from app.models.invitation import Invitation
    from app.schemas.invitation import InvitationOut

    q = select(Invitation).order_by(Invitation.created_at.desc())
    if status:
        q = q.where(Invitation.status == status)
    if search:
        q = q.join(School, Invitation.school_id == School.id).where(
            School.school_name.ilike(f"%{search}%")
        )

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((page - 1) * size).limit(size))).scalars().all()

    # Enrich with names
    school_ids = list({i.school_id for i in rows})
    teacher_ids = list({i.teacher_id for i in rows})
    schools_map = {s.id: s for s in (await db.execute(select(School).where(School.id.in_(school_ids)))).scalars().all()} if school_ids else {}
    teachers_map = {t.id: t for t in (await db.execute(select(Teacher).where(Teacher.id.in_(teacher_ids)))).scalars().all()} if teacher_ids else {}

    items = []
    for inv in rows:
        out = InvitationOut.model_validate(inv)
        s = schools_map.get(inv.school_id)
        t = teachers_map.get(inv.teacher_id)
        if s: out.school_name = s.school_name
        if t: out.teacher_name = f"{t.first_name} {t.last_name}"
        items.append(out)

    # Status counts
    from app.models.invitation import InvitationStatus
    counts = {}
    for st in ["pending", "accepted", "rejected"]:
        counts[st] = (await db.execute(select(func.count(Invitation.id)).where(Invitation.status == st))).scalar() or 0

    return {
        "items": items,
        "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
        "counts": counts,
    }


@router.patch("/invitations/{inv_id}")
async def admin_update_invitation(
    inv_id: int,
    status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    from app.models.invitation import Invitation
    from app.schemas.invitation import InvitationOut
    inv = (await db.execute(select(Invitation).where(Invitation.id == inv_id))).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    inv.status = status
    await db.commit()
    await db.refresh(inv)
    await log_activity(action="invitation_updated", user_role="admin",
                       description=f"Invitation #{inv_id} status set to {status}")
    out = InvitationOut.model_validate(inv)
    # Re-enrich names
    school = (await db.execute(select(School).where(School.id == inv.school_id))).scalar_one_or_none()
    teacher = (await db.execute(select(Teacher).where(Teacher.id == inv.teacher_id))).scalar_one_or_none()
    if school: out.school_name = school.school_name
    if teacher: out.teacher_name = f"{teacher.first_name} {teacher.last_name}"
    return out


@router.delete("/invitations/{inv_id}", status_code=204)
async def admin_delete_invitation(inv_id: int, db: AsyncSession = Depends(get_db), _: User = AdminDep):
    from app.models.invitation import Invitation
    inv = (await db.execute(select(Invitation).where(Invitation.id == inv_id))).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    await db.delete(inv)
    await db.commit()


# ── Activity Log ──────────────────────────────────────────────────────────────

@router.get("/activity")
async def list_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    role: str = Query(None),
    action: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = AdminDep,
):
    from app.models.activity_log import ActivityLog

    q = select(ActivityLog).order_by(ActivityLog.created_at.desc())
    if search:
        q = q.where(
            or_(
                ActivityLog.user_email.ilike(f"%{search}%"),
                ActivityLog.description.ilike(f"%{search}%"),
            )
        )
    if role:
        q = q.where(ActivityLog.user_role == role)
    if action:
        q = q.where(ActivityLog.action == action)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    rows = (await db.execute(q.offset((page - 1) * limit).limit(limit))).scalars().all()

    items = [
        {
            "id": r.id,
            "action": r.action,
            "user_id": r.user_id,
            "user_email": r.user_email,
            "user_role": r.user_role,
            "description": r.description,
            "ip_address": r.ip_address,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]

    return {"items": items, "total": total, "pages": ceil(total / limit) if total else 1}


# ── Pending schools (legacy) ──────────────────────────────────────────────────

@router.get("/schools/pending")
async def pending_schools(db: AsyncSession = Depends(get_db), _: User = AdminDep):
    result = await db.execute(
        select(School).join(User, School.user_id == User.id).where(User.status == UserStatus.pending)
    )
    schools = result.scalars().all()
    return [SchoolOut.model_validate(s) for s in schools]
