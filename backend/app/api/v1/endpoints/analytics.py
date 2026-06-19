"""
Analytics and performance tracking endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.models import User, Interview, Response, UserAnalytics
from app.schemas.schemas import AnalyticsOverview
from app.services.auth_service import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger("interview_coach.api.analytics")

@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all completed interviews
    result = await db.execute(
        select(Interview).where(
            Interview.user_id == current_user.id,
            Interview.status == "completed"
        ).order_by(Interview.created_at.desc())
    )
    interviews = result.scalars().all()
    
    if not interviews:
        return {
            "total_interviews": 0,
            "total_practice_minutes": 0,
            "avg_overall_score": 0,
            "avg_content_score": 0,
            "avg_communication_score": 0,
            "avg_confidence_score": 0,
            "score_trend": [],
            "common_weaknesses": [],
            "recent_interviews": []
        }
    
    # Calculate aggregates
    total_interviews = len(interviews)
    total_minutes = sum(i.duration_seconds or 0 for i in interviews) // 60
    
    # Aggregate scores from responses for deeper insights
    resp_result = await db.execute(
        select(
            func.avg(Response.content_score),
            func.avg(Response.communication_score),
            func.avg(Response.confidence_score),
            func.avg(Response.overall_score)
        ).join(Interview).where(Interview.user_id == current_user.id)
    )
    avg_content, avg_comm, avg_conf, avg_overall = resp_result.fetchone()
    
    # Get weaknesses from improvements fields in responses
    weakness_result = await db.execute(
        select(Response.improvements).join(Interview).where(
            Interview.user_id == current_user.id
        ).limit(20)
    )
    all_improvements = []
    for row in weakness_result.scalars():
        if row: all_improvements.extend(row)
    
    # Take top 3 unique weaknesses
    common_weaknesses = list(set(all_improvements))[:3]
    if not common_weaknesses:
        common_weaknesses = ["No weaknesses identified yet"]

    return {
        "total_interviews": total_interviews,
        "total_practice_minutes": total_minutes,
        "avg_overall_score": float(avg_overall or 0),
        "avg_content_score": float(avg_content or 0),
        "avg_communication_score": float(avg_comm or 0),
        "avg_confidence_score": float(avg_conf or 0),
        "score_trend": [{"date": i.created_at.date().isoformat(), "score": float(i.overall_score or 0)} for i in reversed(interviews[:10])],
        "common_weaknesses": common_weaknesses,
        "recent_interviews": interviews[:5]
    }
