from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from math import ceil
from datetime import datetime, timedelta
from typing import List, Optional
from app.core.database import get_db
from app.models.job import Job, JobStatus
from app.models.school import School
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobUpdate, JobOut, PaginatedJobs
from app.api.deps import get_current_user, require_role
from app.core.activity import log_activity
from app.core.notify import notify_admins
from app.models.notification import NotificationType

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=PaginatedJobs)
async def list_jobs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str = Query("active"),
    search: Optional[str] = Query(None),
    department: Optional[List[str]] = Query(None),
    location: Optional[List[str]] = Query(None),
    job_type: Optional[List[str]] = Query(None),
    date_range: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Job, School.school_name).join(School, Job.school_id == School.id)

    if status:
        q = q.where(Job.status == status)
    if search:
        q = q.where(or_(
            Job.title.ilike(f"%{search}%"),
            Job.department.ilike(f"%{search}%"),
            School.school_name.ilike(f"%{search}%"),
        ))

    # Multi-value department filter (OR within same field)
    if department:
        # Support comma-separated values too
        flat_depts = []
        for d in department:
            flat_depts.extend([x.strip() for x in d.split(",") if x.strip()])
        if flat_depts:
            q = q.where(or_(*[Job.department.ilike(f"%{d}%") for d in flat_depts]))

    # Multi-value location filter
    if location:
        flat_locs = []
        for l in location:
            flat_locs.extend([x.strip() for x in l.split(",") if x.strip()])
        if flat_locs:
            q = q.where(or_(*[Job.location.ilike(f"%{loc}%") for loc in flat_locs]))

    # Multi-value job_type filter (stored in title/description — use ilike on title for now)
    if job_type:
        flat_types = []
        for jt in job_type:
            flat_types.extend([x.strip() for x in jt.split(",") if x.strip()])
        if flat_types:
            q = q.where(or_(*[Job.title.ilike(f"%{jt}%") for jt in flat_types]))

    # Date range filter
    if date_range:
        now = datetime.utcnow()
        if date_range == "today":
            cutoff = now - timedelta(days=1)
        elif date_range == "week":
            cutoff = now - timedelta(weeks=1)
        elif date_range == "month":
            cutoff = now - timedelta(days=30)
        else:
            cutoff = None
        if cutoff:
            q = q.where(Job.created_at >= cutoff)

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar()

    # Sorting
    if sort == "oldest":
        q = q.order_by(Job.created_at.asc())
    else:
        q = q.order_by(Job.created_at.desc())

    q = q.offset((page - 1) * size).limit(size)
    rows = (await db.execute(q)).all()

    items = []
    for job, school_name in rows:
        out = JobOut.model_validate(job)
        out.school_name = school_name
        items.append(out)

    return PaginatedJobs(items=items, total=total, page=page, size=size, pages=ceil(total / size) if total else 1)


@router.get("/departments")
async def list_departments(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns distinct departments from active jobs only."""
    rows = (await db.execute(
        select(Job.department).where(Job.department.isnot(None), Job.status == JobStatus.active).distinct()
    )).scalars().all()
    return {"departments": sorted(d for d in rows if d and d.strip())}


@router.get("/my", response_model=list[JobOut])
async def my_jobs(current_user: User = Depends(require_role(UserRole.school)), db: AsyncSession = Depends(get_db)):
    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        return []
    jobs = (await db.execute(select(Job).where(Job.school_id == school.id).order_by(Job.created_at.desc()))).scalars().all()
    return [JobOut.model_validate(j) for j in jobs]


@router.post("", response_model=JobOut, status_code=201)
async def create_job(data: JobCreate, current_user: User = Depends(require_role(UserRole.school, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.admin:
        # Admin must supply school_id in the request body
        if not data.school_id:
            raise HTTPException(status_code=400, detail="Admin must provide school_id")
        school = (await db.execute(select(School).where(School.id == data.school_id))).scalar_one_or_none()
    else:
        school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")
    job = Job(**data.model_dump(exclude={"school_id"}), school_id=school.id)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    await log_activity(
        action="job_posted",
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=str(current_user.role.value),
        description=f"Job posted: '{job.title}' at {school.school_name}",
    )
    await notify_admins(
        title="New Job Posted",
        message=f"'{job.title}' was posted by {school.school_name}. Review and approve it.",
        notif_type=NotificationType.job_posted,
        related_id=job.id,
    )
    return JobOut.model_validate(job)


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(job_id: int, data: JobUpdate, current_user: User = Depends(require_role(UserRole.school, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(job, k, v)
    await db.commit()
    await db.refresh(job)
    return JobOut.model_validate(job)


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: int, current_user: User = Depends(require_role(UserRole.school, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
