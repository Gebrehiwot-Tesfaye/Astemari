from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from math import ceil
from typing import List, Optional
import os, shutil, uuid
from app.core.database import get_db
from app.models.school import School
from app.models.user import User, UserRole, UserStatus
from app.schemas.school import SchoolUpdate, SchoolOut
from app.api.deps import get_current_user, require_role

UPLOAD_DIR = "uploads"
os.makedirs(f"{UPLOAD_DIR}/licenses", exist_ok=True)

router = APIRouter(prefix="/schools", tags=["schools"])


@router.get("", response_model=dict)
async def list_schools(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    location: Optional[List[str]] = Query(None),
    school_type: Optional[List[str]] = Query(None),
    school_level: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(School).join(User, School.user_id == User.id).where(User.status == UserStatus.active)

    if search:
        q = q.where(or_(
            School.school_name.ilike(f"%{search}%"),
            School.address.ilike(f"%{search}%"),
            School.school_type.ilike(f"%{search}%"),
        ))
    if location:
        flat_locs = []
        for l in location:
            flat_locs.extend([x.strip() for x in l.split(",") if x.strip()])
        if flat_locs:
            q = q.where(or_(*[School.address.ilike(f"%{loc}%") for loc in flat_locs]))
    if school_type:
        flat_types = []
        for st in school_type:
            flat_types.extend([x.strip() for x in st.split(",") if x.strip()])
        if flat_types:
            q = q.where(or_(*[School.school_type.ilike(f"%{t}%") for t in flat_types]))
    if school_level:
        flat_levels = []
        for sl in school_level:
            flat_levels.extend([x.strip() for x in sl.split(",") if x.strip()])
        if flat_levels:
            q = q.where(or_(*[School.school_level.ilike(f"%{lv}%") for lv in flat_levels]))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    schools = (await db.execute(q.offset((page - 1) * size).limit(size).order_by(School.created_at.desc()))).scalars().all()
    return {
        "items": [SchoolOut.model_validate(s) for s in schools],
        "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
    }


# ── /me routes MUST come before /{school_id} ─────────────────────────────────

@router.get("/me", response_model=SchoolOut)
async def get_my_school(
    current_user: User = Depends(require_role(UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")
    return SchoolOut.model_validate(school)


@router.put("/me", response_model=SchoolOut)
async def update_my_school(
    data: SchoolUpdate,
    current_user: User = Depends(require_role(UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(school, k, v)
    await db.commit()
    await db.refresh(school)
    return SchoolOut.model_validate(school)


@router.post("/me/upload")
async def upload_school_license(
    license: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")
    ext = os.path.splitext(license.filename or "")[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = f"{UPLOAD_DIR}/licenses/{filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(license.file, f)
    school.license_file_path = path
    await db.commit()
    await db.refresh(school)
    return {"license_file_path": school.license_file_path}


@router.delete("/me/license")
async def delete_school_license(
    current_user: User = Depends(require_role(UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")
    if school.license_file_path and os.path.exists(school.license_file_path):
        os.remove(school.license_file_path)
    school.license_file_path = None
    await db.commit()
    return {"ok": True}


@router.get("/me/analytics")
async def school_analytics(
    date_range: str = Query("all"),
    current_user: User = Depends(require_role(UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timedelta
    from collections import Counter, defaultdict
    from app.models.job import Job, JobStatus
    from app.models.job_application import JobApplication
    from app.models.invitation import Invitation
    from app.models.teacher import Teacher

    school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")

    now = datetime.utcnow()
    cutoff_map = {
        "today": now - timedelta(days=1),
        "7d":    now - timedelta(days=7),
        "1m":    now - timedelta(days=30),
        "6m":    now - timedelta(days=182),
        "1y":    now - timedelta(days=365),
        "2y":    now - timedelta(days=730),
        "5y":    now - timedelta(days=1825),
    }
    cutoff = cutoff_map.get(date_range)

    job_q = select(Job).where(Job.school_id == school.id)
    if cutoff:
        job_q = job_q.where(Job.created_at >= cutoff)
    jobs = (await db.execute(job_q)).scalars().all()
    job_ids = [j.id for j in jobs]

    app_q = select(JobApplication)
    if job_ids:
        app_q = app_q.where(JobApplication.job_id.in_(job_ids))
    else:
        app_q = app_q.where(JobApplication.id == -1)
    if cutoff:
        app_q = app_q.where(JobApplication.applied_at >= cutoff)
    applications = (await db.execute(app_q)).scalars().all()

    inv_q = select(Invitation).where(Invitation.school_id == school.id)
    if cutoff:
        inv_q = inv_q.where(Invitation.created_at >= cutoff)
    invitations = (await db.execute(inv_q)).scalars().all()

    total_jobs = len(jobs)
    active_jobs = sum(1 for j in jobs if j.status == JobStatus.active)
    total_apps = len(applications)
    accepted_apps = sum(1 for a in applications if a.status == "accepted")
    pending_apps = sum(1 for a in applications if a.status == "pending")
    rejected_apps = sum(1 for a in applications if a.status == "rejected")
    acceptance_rate = round((accepted_apps / total_apps * 100), 1) if total_apps else 0
    total_invitations = len(invitations)
    accepted_invitations = sum(1 for i in invitations if i.status == "accepted")

    job_status_counts = Counter(str(j.status.value) if hasattr(j.status, "value") else str(j.status) for j in jobs)
    job_status = [{"name": k, "value": v} for k, v in job_status_counts.items()]

    app_status_counts = Counter(a.status for a in applications)
    app_status = [{"name": k, "value": v} for k, v in app_status_counts.items()]

    inv_status_counts = Counter(str(i.status.value) if hasattr(i.status, "value") else str(i.status) for i in invitations)
    inv_status = [{"name": k, "value": v} for k, v in inv_status_counts.items()]

    dept_counts = Counter(j.department for j in jobs if j.department)
    departments = [{"name": k, "value": v} for k, v in sorted(dept_counts.items(), key=lambda x: -x[1])]

    app_per_job = Counter(a.job_id for a in applications)
    job_map = {j.id: j for j in jobs}
    top_jobs = [
        {"name": job_map[jid].title if jid in job_map else f"Job #{jid}", "applications": cnt}
        for jid, cnt in app_per_job.most_common(10)
    ]

    monthly_jobs: dict = defaultdict(int)
    monthly_apps: dict = defaultdict(int)
    monthly_accepted: dict = defaultdict(int)
    for j in jobs:
        key = j.created_at.strftime("%b %Y") if j.created_at else "Unknown"
        monthly_jobs[key] += 1
    for a in applications:
        key = a.applied_at.strftime("%b %Y") if a.applied_at else "Unknown"
        monthly_apps[key] += 1
        if a.status == "accepted":
            monthly_accepted[key] += 1

    all_months = sorted(
        set(list(monthly_jobs.keys()) + list(monthly_apps.keys())),
        key=lambda x: datetime.strptime(x, "%b %Y") if x != "Unknown" else datetime.min,
    )
    trend = [
        {"name": m, "jobs_posted": monthly_jobs.get(m, 0), "applications": monthly_apps.get(m, 0), "accepted": monthly_accepted.get(m, 0)}
        for m in all_months[-12:]
    ]

    recent_sorted = sorted(applications, key=lambda a: a.applied_at or datetime.min, reverse=True)[:20]
    teacher_ids = list({a.teacher_id for a in recent_sorted})
    teachers_map = {}
    if teacher_ids:
        ts = (await db.execute(select(Teacher).where(Teacher.id.in_(teacher_ids)))).scalars().all()
        teachers_map = {t.id: t for t in ts}

    recent_applications = [
        {
            "id": a.id,
            "teacher_name": f"{teachers_map[a.teacher_id].first_name} {teachers_map[a.teacher_id].last_name}" if a.teacher_id in teachers_map else f"Teacher #{a.teacher_id}",
            "teacher_department": teachers_map[a.teacher_id].department if a.teacher_id in teachers_map else None,
            "job_title": job_map[a.job_id].title if a.job_id in job_map else f"Job #{a.job_id}",
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
        }
        for a in recent_sorted
    ]

    return {
        "summary": {
            "total_jobs": total_jobs, "active_jobs": active_jobs,
            "total_applications": total_apps, "accepted_applications": accepted_apps,
            "pending_applications": pending_apps, "rejected_applications": rejected_apps,
            "acceptance_rate": acceptance_rate,
            "total_invitations": total_invitations, "accepted_invitations": accepted_invitations,
        },
        "job_status": job_status, "app_status": app_status, "inv_status": inv_status,
        "departments": departments, "top_jobs": top_jobs, "trend": trend,
        "recent_applications": recent_applications,
    }


# ── /{school_id} MUST come LAST ───────────────────────────────────────────────

@router.get("/{school_id}", response_model=dict)
async def get_school_by_id(
    school_id: int,
    current_user: User = Depends(require_role(UserRole.admin, UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func as sqlfunc
    from app.models.job import Job
    from app.models.invitation import Invitation
    result = await db.execute(
        select(School, User.email.label("user_email"), User.status.label("user_status"))
        .join(User, School.user_id == User.id)
        .where(School.id == school_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="School not found")
    school, user_email, user_status = row
    job_count = (await db.execute(select(sqlfunc.count(Job.id)).where(Job.school_id == school_id))).scalar()
    inv_count = (await db.execute(select(sqlfunc.count(Invitation.id)).where(Invitation.school_id == school_id))).scalar()
    d = SchoolOut.model_validate(school).model_dump()
    d["user_email"] = user_email
    d["user_status"] = str(user_status.value) if hasattr(user_status, "value") else str(user_status)
    d["job_count"] = job_count
    d["invitation_count"] = inv_count
    return d
