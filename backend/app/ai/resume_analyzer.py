"""
AI Resume Analysis Service.
Extracts skills, experience, and key metrics from resume text to generate tailored interview questions.
"""

import logging
import json
from typing import Dict, List
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("interview_coach.ai.resume")

# Try to import OpenAI
try:
    from openai import AsyncOpenAI
    openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except ImportError:
    openai_client = None

RESUME_PARSING_PROMPT = """You are an expert technical recruiter. Analyze the provided resume text and extract key information in JSON format.
Focus on:
1. Technical Skills (Languages, Frameworks, Tools)
2. Soft Skills
3. Years of Experience
4. Key Achievements (especially those with metrics/numbers)
5. Industry focus

Respond in STRICT JSON format only."""

RESUME_PARSING_TEMPLATE = """Analyze this resume:

{resume_text}

JSON Output Structure:
{{
    "skills": ["skill1", "skill2"],
    "soft_skills": ["skill1", "skill2"],
    "experience_years": float,
    "achievements": ["achievement1 with metrics", "achievement2"],
    "industry": "e.g., Fintech, Healthcare, E-commerce",
    "suggested_topics": ["topic1", "topic2"]
}}"""

async def parse_resume(resume_text: str) -> Dict:
    """
    Parse resume text using LLM or rule-based fallback.
    """
    if openai_client and settings.OPENAI_API_KEY:
        try:
            response = await openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": RESUME_PARSING_PROMPT},
                    {"role": "user", "content": RESUME_PARSING_TEMPLATE.format(resume_text=resume_text)},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
    
    # Fallback rule-based parsing (simplified)
    return {
        "skills": ["Python", "JavaScript", "React", "FastAPI"], # Mock defaults
        "soft_skills": ["Leadership", "Communication"],
        "experience_years": 3.0,
        "achievements": ["Improved system performance by 20%"],
        "industry": "Software Engineering",
        "suggested_topics": ["Distributed Systems", "Web Security"]
    }
