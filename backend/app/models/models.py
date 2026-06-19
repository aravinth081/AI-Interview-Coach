"""
SQLAlchemy ORM models for all database tables.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Text, Boolean, DateTime, ForeignKey,
    Numeric, JSON, UniqueConstraint, Index, CheckConstraint, Date
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(Text, nullable=True)
    role = Column(String(20), default="free")
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    interviews_used_this_month = Column(Integer, default=0)
    monthly_interview_limit = Column(Integer, default=3)
    preferred_language = Column(String(10), default="en")
    resume_text = Column(Text, nullable=True)
    resume_parsed_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    # Relationships
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    analytics = relationship("UserAnalytics", back_populates="user", cascade="all, delete-orphan")


class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    interview_type = Column(String(50), nullable=False)  # behavioral, technical, system_design, resume_based
    difficulty = Column(String(20), default="medium")
    target_role = Column(String(255), nullable=True)
    target_company = Column(String(255), nullable=True)
    status = Column(String(20), default="pending")
    overall_score = Column(Numeric(4, 2), nullable=True)
    total_questions = Column(Integer, default=0)
    duration_seconds = Column(Integer, nullable=True)
    language = Column(String(10), default="en")
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    # Relationships
    user = relationship("User", back_populates="interviews")
    responses = relationship("Response", back_populates="interview", cascade="all, delete-orphan")
    feedback_summary = relationship("FeedbackSummary", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_interviews_user", "user_id"),
        Index("idx_interviews_status", "status"),
        Index("idx_interviews_created", "created_at"),
    )


class Response(Base):
    __tablename__ = "responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_category = Column(String(50), nullable=True)
    answer_transcript = Column(Text, nullable=True)
    answer_duration_seconds = Column(Integer, nullable=True)
    
    # AI Evaluation Scores
    content_score = Column(Numeric(4, 2), nullable=True)
    communication_score = Column(Numeric(4, 2), nullable=True)
    confidence_score = Column(Numeric(4, 2), nullable=True)
    overall_score = Column(Numeric(4, 2), nullable=True)
    
    # Speech Analysis
    words_per_minute = Column(Numeric(6, 2), nullable=True)
    filler_word_count = Column(Integer, default=0)
    filler_words = Column(JSON, nullable=True)
    pause_count = Column(Integer, default=0)
    longest_pause_seconds = Column(Numeric(6, 2), nullable=True)
    
    # Video Analysis
    dominant_emotion = Column(String(50), nullable=True)
    emotion_distribution = Column(JSON, nullable=True)
    eye_contact_percentage = Column(Numeric(5, 2), nullable=True)
    
    # AI Feedback
    ai_feedback = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=True)
    improvements = Column(JSON, nullable=True)
    sample_answer = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="responses")
    
    __table_args__ = (
        Index("idx_responses_interview", "interview_id"),
    )


class FeedbackSummary(Base):
    __tablename__ = "feedback_summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_feedback = Column(Text, nullable=True)
    top_strengths = Column(JSON, nullable=True)
    key_improvements = Column(JSON, nullable=True)
    recommended_resources = Column(JSON, nullable=True)
    improvement_plan = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="feedback_summary")


class UserAnalytics(Base):
    __tablename__ = "user_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    interviews_completed = Column(Integer, default=0)
    avg_content_score = Column(Numeric(4, 2), nullable=True)
    avg_communication_score = Column(Numeric(4, 2), nullable=True)
    avg_confidence_score = Column(Numeric(4, 2), nullable=True)
    avg_overall_score = Column(Numeric(4, 2), nullable=True)
    total_practice_minutes = Column(Integer, default=0)
    common_weaknesses = Column(JSON, nullable=True)
    score_trend = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    # Relationships
    user = relationship("User", back_populates="analytics")
    
    __table_args__ = (
        UniqueConstraint("user_id", "period_start", "period_end"),
        Index("idx_analytics_user", "user_id"),
    )


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    plan = Column(String(20), default="free")
    status = Column(String(20), default="active")
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    
    __table_args__ = (
        Index("idx_subscriptions_stripe", "stripe_customer_id"),
    )
