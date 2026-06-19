from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.models import Interview, Response, User, UserAnalytics, FeedbackSummary
from app.schemas.schemas import InterviewCreate
from typing import List, Optional
import uuid
from datetime import datetime, timezone

async def create_interview_session(db: AsyncSession, user_id: uuid.UUID, interview_in: InterviewCreate) -> Interview:
    new_interview = Interview(
        user_id=user_id,
        title=interview_in.title,
        interview_type=interview_in.interview_type,
        difficulty=interview_in.difficulty,
        target_role=interview_in.target_role,
        target_company=interview_in.target_company,
        language=interview_in.language,
        status="pending"
    )
    db.add(new_interview)
    
    # Update user stats
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one()
    user.interviews_used_this_month += 1
    
    await db.commit()
    await db.refresh(new_interview)
    return new_interview

async def save_response(
    db: AsyncSession, 
    interview_id: uuid.UUID, 
    question_text: str, 
    answer_transcript: str,
    evaluation_data: dict,
    question_number: int
) -> Response:
    new_response = Response(
        interview_id=interview_id,
        question_number=question_number,
        question_text=question_text,
        answer_transcript=answer_transcript,
        content_score=evaluation_data.get("content_score"),
        communication_score=evaluation_data.get("communication_score"),
        confidence_score=evaluation_data.get("confidence_score"),
        overall_score=evaluation_data.get("overall_score"),
        ai_feedback=evaluation_data.get("feedback"),
        strengths=evaluation_data.get("strengths"),
        improvements=evaluation_data.get("improvements"),
        sample_answer=evaluation_data.get("sample_answer")
    )
    db.add(new_response)
    await db.commit()
    await db.refresh(new_response)
    return new_response

async def complete_interview(db: AsyncSession, interview_id: uuid.UUID) -> Interview:
    # 1. Fetch interview and responses
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalar_one_or_none()
    if not interview:
        return None
        
    responses_result = await db.execute(select(Response).where(Response.interview_id == interview_id))
    responses = responses_result.scalars().all()
    
    if responses:
        # 2. Calculate aggregate scores
        avg_score = sum(r.overall_score for r in responses) / len(responses)
        interview.overall_score = avg_score
        interview.status = "completed"
        interview.completed_at = datetime.now(timezone.utc)
        
        # 3. Update User Analytics (Simplified logic for now)
        # In a full app, we'd update the user_analytics table for the current month
    
    await db.commit()
    await db.refresh(interview)
    return interview
