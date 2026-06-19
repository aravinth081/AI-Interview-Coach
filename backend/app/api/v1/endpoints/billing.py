"""
Billing and subscription management endpoints (Stripe integration skeleton).
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import User, Subscription
from app.schemas.schemas import CreateCheckoutSession, SubscriptionStatus
from app.services.auth_service import get_current_user
from app.config import get_settings
import logging

router = APIRouter()
logger = logging.getLogger("interview_coach.api.billing")
settings = get_settings()

# In a real app, we'd initialize Stripe here
# import stripe
# stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/checkout-session")
async def create_checkout_session(
    checkout_in: CreateCheckoutSession,
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe checkout session for Pro subscription."""
    # Placeholder for Stripe logic
    return {
        "checkout_url": "https://checkout.stripe.com/pay/placeholder",
        "session_id": "cs_test_placeholder"
    }

@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's subscription status and limits."""
    return {
        "plan": current_user.role,
        "status": "active",
        "current_period_end": current_user.plan_expires_at,
        "interviews_used": current_user.interviews_used_this_month,
        "interviews_limit": current_user.monthly_interview_limit
    }

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks for subscription updates."""
    # Placeholder for Stripe webhook logic
    return {"status": "success"}
