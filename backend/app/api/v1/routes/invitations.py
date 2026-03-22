from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.invitation import Invitation
from app.models.teacher import Teacher
from app.models.school import School
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.schemas.invitation import InvitationCreate, InvitationUpdate, InvitationOut
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/invitations", tags=["invitations"])


def _enrich(inv: Invitation, school: School | None, teacher: Teacher | None) -> InvitationOut:
    out = InvitationOut.model_validate(inv)
    if school:
        out.school_name = school.school_name
    if teacher:
        out.teacher_name = f"{teacher.first_name} {teacher.last_name}"
    return out


@router.get("", response_model=list[InvitationOut])
async def list_invitations(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.school:
        school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
        if not school:
            return []
        invs = (await db.execute(select(Invitation).where(Invitation.school_id == school.id).order_by(Invitation.created_at.desc()))).scalars().all()
        # Fetch all teachers in one query
        teacher_ids = list({i.teacher_id for i in invs})
        teachers = {t.id: t for t in (await db.execute(select(Teacher).where(Teacher.id.in_(teacher_ids)))).scalars().all()} if teacher_ids else {}
        return [_enrich(i, school, teachers.get(i.teacher_id)) for i in invs]
    else:
        teacher = (await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))).scalar_one_or_none()
        if not teacher:
            return []
        invs = (await db.execute(select(Invitation).where(Invitation.teacher_id == teacher.id).order_by(Invitation.created_at.desc()))).scalars().all()
        # Fetch all schools in one query
        school_ids = list({i.school_id for i in invs})
        schools = {s.id: s for s in (await db.execute(select(School).where(School.id.in_(school_ids)))).scalars().all()} if school_ids else {}
        return [_enrich(i, schools.get(i.school_id), teacher) for i in invs]


@router.post("", response_model=InvitationOut, status_code=201)
async def send_invitation(data: InvitationCreate, current_user: User = Depends(require_role(UserRole.school, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.admin:
        if not data.school_id:
            raise HTTPException(status_code=400, detail="Admin must provide school_id")
        school = (await db.execute(select(School).where(School.id == data.school_id))).scalar_one_or_none()
    else:
        school = (await db.execute(select(School).where(School.user_id == current_user.id))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School profile not found")

    inv = Invitation(school_id=school.id, teacher_id=data.teacher_id, department=data.department, message=data.message)
    db.add(inv)

    teacher = (await db.execute(select(Teacher).where(Teacher.id == data.teacher_id))).scalar_one_or_none()
    if teacher:
        notif = Notification(
            user_id=teacher.user_id,
            type=NotificationType.invitation,
            title="New Invitation",
            message=f"{school.school_name} invited you for {data.department}",
            related_id=school.id,
        )
        db.add(notif)

    await db.commit()
    await db.refresh(inv)
    return _enrich(inv, school, teacher)


@router.patch("/{inv_id}", response_model=InvitationOut)
async def respond_invitation(inv_id: int, data: InvitationUpdate, current_user: User = Depends(require_role(UserRole.teacher)), db: AsyncSession = Depends(get_db)):
    inv = (await db.execute(select(Invitation).where(Invitation.id == inv_id))).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    inv.status = data.status
    await db.commit()
    await db.refresh(inv)
    school = (await db.execute(select(School).where(School.id == inv.school_id))).scalar_one_or_none()
    teacher = (await db.execute(select(Teacher).where(Teacher.id == inv.teacher_id))).scalar_one_or_none()
    return _enrich(inv, school, teacher)
