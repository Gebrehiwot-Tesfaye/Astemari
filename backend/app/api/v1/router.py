from fastapi import APIRouter
from app.api.v1.routes import auth, jobs, applications, invitations, notifications, teachers, schools, admin

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)
api_router.include_router(invitations.router)
api_router.include_router(notifications.router)
api_router.include_router(teachers.router)
api_router.include_router(schools.router)
api_router.include_router(admin.router)
