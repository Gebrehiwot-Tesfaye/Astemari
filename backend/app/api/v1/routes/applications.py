from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.job_application import JobApplication
from app.models.teacher import Teacher
from app.models.school import School
from app.models.job import Job
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationOut
from app.api.deps import get_current_user, require_role
from app.core.activity import log_activity

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/my", response_model=list[ApplicationOut])
async def my_applications(current_user: User = Depends(require_role(UserRole.teacher)), db: AsyncSession = Depends(get_db)):
    teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        return []
    apps = (await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.job), selectinload(JobApplication.teacher))
        .where(JobApplication.teacher_id == teacher.id)
        .order_by(JobApplication.applied_at.desc())
    )).scalars().all()

    # Enrich school_name and school_address on each job
    school_ids = list({a.job.school_id for a in apps if a.job})
    schools = (await db.execute(select(School).where(School.id.in_(school_ids)))).scalars().all() if school_ids else []
    schools_map = {s.id: s for s in schools}

    result = []
    for a in apps:
        out = ApplicationOut.model_validate(a)
        if out.job and a.job:
            school = schools_map.get(a.job.school_id)
            if school:
                out.job.school_name = school.school_name
                out.job.school_address = school.address
        result.append(out)
    return result


@router.get("/my-job-ids", response_model=list[int])
async def my_applied_job_ids(current_user: User = Depends(require_role(UserRole.teacher)), db: AsyncSession = Depends(get_db)):
    """Returns job IDs the current teacher has already applied to."""
    teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        return []
    ids = (await db.execute(
        select(JobApplication.job_id).where(JobApplication.teacher_id == teacher.id)
    )).scalars().all()
    return list(ids)


@router.get("/school", response_model=list[ApplicationOut])
async def school_applications(current_user: User = Depends(require_role(UserRole.school)), db: AsyncSession = Depends(get_db)):
    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        return []
    job_ids = (await db.execute(select(Job.id).where(Job.school_id == school.id))).scalars().all()
    if not job_ids:
        return []
    apps = (await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.job), selectinload(JobApplication.teacher))
        .where(JobApplication.job_id.in_(job_ids))
        .order_by(JobApplication.applied_at.desc())
    )).scalars().all()
    result = []
    for a in apps:
        out = ApplicationOut.model_validate(a)
        if out.job:
            out.job.school_name = school.school_name
            out.job.school_address = school.address
        result.append(out)
    return result


@router.post("", response_model=ApplicationOut, status_code=201)
async def apply(data: ApplicationCreate, current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.admin:
        if not data.teacher_id:
            raise HTTPException(status_code=400, detail="Admin must provide teacher_id")
        teacher = (await db.execute(select(Teacher).where(Teacher.id == data.teacher_id))).scalar_one_or_none()
    else:
        teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    existing = (await db.execute(
        select(JobApplication).where(JobApplication.job_id == data.job_id, JobApplication.teacher_id == teacher.id)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    app = JobApplication(job_id=data.job_id, teacher_id=teacher.id, cover_letter=data.cover_letter)
    db.add(app)

    # Notify school
    job = (await db.execute(select(Job).where(Job.id == data.job_id))).scalar_one_or_none()
    if job:
        school = (await db.execute(select(School).where(School.id == job.school_id))).scalar_one_or_none()
        if school:
            notif = Notification(
                user_id=school.user_id,
                type=NotificationType.application,
                title="New Application",
                message=f"{teacher.first_name} {teacher.last_name} applied for {job.title}",
                related_id=job.id,
            )
            db.add(notif)

    await db.commit()

    # Reload with relationships
    app = (await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.job), selectinload(JobApplication.teacher))
        .where(JobApplication.id == app.id)
    )).scalar_one()
    await log_activity(
        action="job_applied",
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=str(current_user.role.value),
        description=f"{teacher.first_name} {teacher.last_name} applied for job #{data.job_id}",
    )
    return ApplicationOut.model_validate(app)


@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_application(app_id: int, data: ApplicationUpdate, current_user: User = Depends(require_role(UserRole.school, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    app = (await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.job), selectinload(JobApplication.teacher))
        .where(JobApplication.id == app_id)
    )).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = data.status
    await db.commit()
    await db.refresh(app)
    return ApplicationOut.model_validate(app)
