"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# ============================================
# ENUMS
# ============================================
class UserRole(str, Enum):
    FREE = "free"
    PRO = "pro"
    ADMIN = "admin"


class InterviewType(str, Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SYSTEM_DESIGN = "system_design"
    RESUME_BASED = "resume_based"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


# ============================================
# AUTH SCHEMAS
# ============================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    interviews_used_this_month: int
    monthly_interview_limit: int
    preferred_language: str
    has_resume: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
    avatar_url: Optional[str] = None


# ============================================
# INTERVIEW SCHEMAS
# ============================================
class InterviewCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    interview_type: InterviewType
    difficulty: Difficulty = Difficulty.MEDIUM
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    language: str = "en"


class InterviewResponse(BaseModel):
    id: UUID
    title: str
    interview_type: str
    difficulty: str
    target_role: Optional[str]
    target_company: Optional[str]
    status: str
    overall_score: Optional[float]
    total_questions: int
    duration_seconds: Optional[int]
    language: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class InterviewDetail(InterviewResponse):
    responses: List["ResponseOut"] = []
    feedback_summary: Optional["FeedbackSummaryOut"] = None


# ============================================
# RESPONSE SCHEMAS
# ============================================
class ResponseCreate(BaseModel):
    question_number: int
    question_text: str
    answer_transcript: Optional[str] = None
    answer_duration_seconds: Optional[int] = None


class ResponseOut(BaseModel):
    id: UUID
    question_number: int
    question_text: str
    question_category: Optional[str]
    answer_transcript: Optional[str]
    answer_duration_seconds: Optional[int]
    content_score: Optional[float]
    communication_score: Optional[float]
    confidence_score: Optional[float]
    overall_score: Optional[float]
    words_per_minute: Optional[float]
    filler_word_count: int
    filler_words: Optional[Dict[str, int]]
    dominant_emotion: Optional[str]
    emotion_distribution: Optional[Dict[str, float]]
    eye_contact_percentage: Optional[float]
    ai_feedback: Optional[str]
    strengths: Optional[List[str]]
    improvements: Optional[List[str]]
    sample_answer: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class FeedbackSummaryOut(BaseModel):
    overall_feedback: Optional[str]
    top_strengths: Optional[List[str]]
    key_improvements: Optional[List[str]]
    recommended_resources: Optional[List[Dict[str, str]]]
    improvement_plan: Optional[str]
    
    class Config:
        from_attributes = True


# ============================================
# AI / EVALUATION SCHEMAS
# ============================================
class EvaluationRequest(BaseModel):
    question: str
    answer: str
    interview_type: InterviewType
    target_role: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM


class EvaluationResult(BaseModel):
    content_score: float = Field(..., ge=0, le=10)
    communication_score: float = Field(..., ge=0, le=10)
    overall_score: float = Field(..., ge=0, le=10)
    feedback: str
    strengths: List[str]
    improvements: List[str]
    sample_answer: str


class SpeechAnalysis(BaseModel):
    transcript: str
    words_per_minute: float
    filler_word_count: int
    filler_words: Dict[str, int]
    pause_count: int
    longest_pause_seconds: float
    confidence_score: float


class VideoAnalysis(BaseModel):
    dominant_emotion: str
    emotion_distribution: Dict[str, float]
    eye_contact_percentage: float
    confidence_score: float


class QuestionGenerateRequest(BaseModel):
    interview_type: InterviewType
    difficulty: Difficulty = Difficulty.MEDIUM
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    resume_text: Optional[str] = None
    previous_questions: List[str] = []
    count: int = Field(default=1, ge=1, le=10)


class GeneratedQuestion(BaseModel):
    question: str
    category: str
    difficulty: str
    follow_up_hints: List[str] = []


# ============================================
# ANALYTICS SCHEMAS
# ============================================
class AnalyticsOverview(BaseModel):
    total_interviews: int
    total_practice_minutes: int
    avg_overall_score: Optional[float]
    avg_content_score: Optional[float]
    avg_communication_score: Optional[float]
    avg_confidence_score: Optional[float]
    score_trend: List[Dict[str, Any]]
    common_weaknesses: List[str]
    recent_interviews: List[InterviewResponse]


class ProgressData(BaseModel):
    period: str
    interviews_completed: int
    avg_score: Optional[float]
    improvement_percentage: Optional[float]


# ============================================
# WEBSOCKET MESSAGE SCHEMAS
# ============================================
class WSMessage(BaseModel):
    type: str  # "audio_chunk", "video_frame", "transcript", "evaluation", "emotion", "error"
    data: Any
    timestamp: datetime = Field(default_factory=lambda: datetime.now())


class WSAudioChunk(BaseModel):
    type: str = "audio_chunk"
    data: str  # base64 encoded audio
    sample_rate: int = 16000


class WSTranscriptUpdate(BaseModel):
    type: str = "transcript"
    text: str
    is_final: bool = False
    confidence: float = 0.0


class WSEvaluationUpdate(BaseModel):
    type: str = "evaluation"
    content_score: float
    communication_score: float
    confidence_score: float
    overall_score: float
    feedback: str
    strengths: List[str]
    improvements: List[str]


class WSEmotionUpdate(BaseModel):
    type: str = "emotion"
    dominant_emotion: str
    confidence: float
    eye_contact: bool


# ============================================
# BILLING SCHEMAS
# ============================================
class CreateCheckoutSession(BaseModel):
    plan: str = "pro"
    success_url: str
    cancel_url: str


class SubscriptionStatus(BaseModel):
    plan: str
    status: str
    current_period_end: Optional[datetime]
    interviews_used: int
    interviews_limit: int


class ResumeUpload(BaseModel):
    text: str


# Rebuild forward refs
InterviewDetail.model_rebuild()
