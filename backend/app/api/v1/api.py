"""
API aggregation router for v1 endpoints.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, interviews, analytics, billing

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["Interviews"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing"])
