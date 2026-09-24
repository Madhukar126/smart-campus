from fastapi import APIRouter

from app.api.routes import admin, auth, categories, health, issues, locations, maintenance, notifications

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(categories.router)
api_router.include_router(locations.router)
api_router.include_router(issues.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
api_router.include_router(maintenance.router)
