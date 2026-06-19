"""
Interview management and real-time session endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.models import User, Interview, Response
from app.schemas.schemas import InterviewCreate, InterviewResponse, InterviewDetail, WSMessage
from app.services.auth_service import get_current_user
from app.ai.question_generator import generate_questions
from app.ai.evaluation_engine import evaluate_answer
import uuid
import json
import logging

router = APIRouter()
logger = logging.getLogger("interview_coach.api.interviews")

from app.services.interview_service import create_interview_session, save_response, complete_interview

@router.post("/", response_model=InterviewResponse)
async def create_interview(
    interview_in: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check limits for free tier
    # if current_user.role == "free" and current_user.interviews_used_this_month >= current_user.monthly_interview_limit:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Monthly interview limit reached for free tier. Upgrade to Pro for more.",
    #     )
    
    return await create_interview_session(db, current_user.id, interview_in)

@router.get("/", response_model=List[InterviewResponse])
async def list_interviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interview).where(Interview.user_id == current_user.id).order_by(Interview.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{interview_id}", response_model=InterviewDetail)
async def get_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == current_user.id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

# WebSocket implementation for real-time interview
@router.websocket("/ws/{interview_id}")
async def interview_websocket(
    websocket: WebSocket,
    interview_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    await websocket.accept()
    logger.info(f"WebSocket connection accepted for interview: {interview_id}")
    
    question_count = 0
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "start_session":
                # Initial questions could be generated here
                await websocket.send_json({
                    "type": "system",
                    "data": {"message": "Session started. Please answer the first question."}
                })
            
            elif message["type"] == "audio_chunk":
                # Placeholder for real-time STT
                pass
            
            elif message["type"] == "end_answer":
                question_count += 1
                transcript = message["data"].get("transcript", "")
                question = message["data"].get("question", "")
                
                # Real AI evaluation
                feedback = await evaluate_answer(question, transcript)
                
                # Save to DB
                await save_response(db, interview_id, question, transcript, feedback, question_count)
                
                await websocket.send_json({
                    "type": "evaluation",
                    "data": feedback
                })
            
            elif message["type"] == "complete_interview":
                await complete_interview(db, interview_id)
                await websocket.send_json({
                    "type": "system",
                    "data": {"message": "Interview completed and analyzed."}
                })
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for interview: {interview_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=1011)
