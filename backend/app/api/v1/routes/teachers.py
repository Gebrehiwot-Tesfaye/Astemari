from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from math import ceil
import os, shutil, uuid
from app.core.database import get_db
from app.models.teacher import Teacher, TeacherStatus
from app.models.user import User, UserRole
from app.schemas.teacher import TeacherUpdate, TeacherOut
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/teachers", tags=["teachers"])

UPLOAD_DIR = "uploads"
os.makedirs(f"{UPLOAD_DIR}/cv", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/documents", exist_ok=True)


@router.get("/me", response_model=TeacherOut)
async def get_my_profile(current_user: User = Depends(require_role(UserRole.teacher)), db: AsyncSession = Depends(get_db)):
    teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Profile not found")
    return TeacherOut.model_validate(teacher)


@router.put("/me", response_model=TeacherOut)
async def update_my_profile(data: TeacherUpdate, current_user: User = Depends(require_role(UserRole.teacher)), db: AsyncSession = Depends(get_db)):
    teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Profile not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(teacher, k, v)
    # Mark profile completed if key fields are filled
    if teacher.first_name and teacher.last_name and teacher.department:
        teacher.profile_completed = True
    await db.commit()
    await db.refresh(teacher)
    return TeacherOut.model_validate(teacher)


@router.post("/me/upload")
async def upload_documents(
    cv: UploadFile | None = File(None),
    documents: list[UploadFile] = File(default=[]),
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: AsyncSession = Depends(get_db),
):
    teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Profile not found")

    if cv:
        ext = os.path.splitext(cv.filename or "")[1]
        filename = f"{uuid.uuid4()}{ext}"
        path = f"{UPLOAD_DIR}/cv/{filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(cv.file, f)
        teacher.cv_path = path

    if documents:
        saved = []
        for doc in documents:
            ext = os.path.splitext(doc.filename or "")[1]
            filename = f"{uuid.uuid4()}{ext}"
            path = f"{UPLOAD_DIR}/documents/{filename}"
            with open(path, "wb") as f:
                shutil.copyfileobj(doc.file, f)
            saved.append(path)
        # Append to existing additional_documents (comma-separated paths)
        existing = teacher.additional_documents or ""
        all_docs = [d for d in existing.split(",") if d] + saved
        teacher.additional_documents = ",".join(all_docs)

    await db.commit()
    await db.refresh(teacher)
    return {"cv_path": teacher.cv_path, "additional_documents": teacher.additional_documents}


@router.delete("/me/document")
async def delete_document(
    path: str,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: AsyncSession = Depends(get_db),
):
    teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Remove from cv_path
    if teacher.cv_path == path:
        if os.path.exists(path):
            os.remove(path)
        teacher.cv_path = None
    else:
        # Remove from additional_documents
        docs = [d for d in (teacher.additional_documents or "").split(",") if d and d != path]
        if os.path.exists(path):
            os.remove(path)
        teacher.additional_documents = ",".join(docs) or None

    await db.commit()
    return {"ok": True}


@router.get("/public", response_model=dict)
async def list_teachers_public(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    location: str = Query(None),
    min_experience_years: int = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — returns teachers with profile_completed=True, no auth required."""
    q = select(Teacher).where(Teacher.profile_completed == True, Teacher.status == TeacherStatus.active)

    if search:
        q = q.where(or_(
            Teacher.first_name.ilike(f"%{search}%"),
            Teacher.last_name.ilike(f"%{search}%"),
            Teacher.department.ilike(f"%{search}%"),
        ))
    if department:
        q = q.where(Teacher.department == department)
    if location:
        q = q.where(Teacher.preferred_location.ilike(f"%{location}%"))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((page - 1) * size).limit(size).order_by(Teacher.created_at.desc()))).scalars().all()

    dept_rows = (await db.execute(
        select(Teacher.department).where(Teacher.department.isnot(None), Teacher.profile_completed == True).distinct()
    )).scalars().all()
    departments = sorted(d for d in dept_rows if d and d.strip())

    items = []
    for teacher in rows:
        d = TeacherOut.model_validate(teacher).model_dump()
        # Remove sensitive fields only
        d.pop("user_id", None)
        items.append(d)

    return {
        "items": items,
        "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
        "departments": departments,
    }



async def get_teacher_by_id(
    teacher_id: int,
    current_user: User = Depends(require_role(UserRole.admin, UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Teacher, User.email.label("user_email"), User.status.label("user_status"))
        .join(User, Teacher.user_id == User.id)
        .where(Teacher.id == teacher_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Teacher not found")
    teacher, user_email, user_status = row
    d = TeacherOut.model_validate(teacher).model_dump()
    d["user_email"] = user_email
    d["user_status"] = str(user_status.value) if hasattr(user_status, "value") else str(user_status)
    return d


@router.get("", response_model=dict)
async def list_teachers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    location: str = Query(None),
    status: str = Query(None),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.school)),
    db: AsyncSession = Depends(get_db),
):
    q = select(Teacher, User.status.label("user_status")).join(User, Teacher.user_id == User.id)

    if status:
        q = q.where(User.status == status)

    if search:
        q = q.where(or_(
            Teacher.first_name.ilike(f"%{search}%"),
            Teacher.last_name.ilike(f"%{search}%"),
            Teacher.department.ilike(f"%{search}%"),
        ))
    if department:
        q = q.where(Teacher.department == department)
    if location:
        q = q.where(Teacher.preferred_location.ilike(f"%{location}%"))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((page - 1) * size).limit(size).order_by(Teacher.created_at.desc()))).all()

    items = []
    for teacher, user_status in rows:
        d = TeacherOut.model_validate(teacher).model_dump()
        d["user_status"] = str(user_status.value) if hasattr(user_status, "value") else str(user_status)
        items.append(d)

    # Distinct departments for filter
    dept_rows = (await db.execute(
        select(Teacher.department).where(Teacher.department.isnot(None)).distinct()
    )).scalars().all()
    departments = sorted(d for d in dept_rows if d and d.strip())

    return {
        "items": items,
        "total": total, "page": page, "size": size,
        "pages": ceil(total / size) if total else 1,
        "departments": departments,
    }
