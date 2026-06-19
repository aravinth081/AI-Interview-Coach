"""
AI Question Generator.
Generates context-aware, difficulty-adaptive interview questions.
"""

import json
import logging
import random
from typing import Optional, List, Dict
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("interview_coach.ai.questions")

try:
    from openai import AsyncOpenAI
    openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except ImportError:
    openai_client = None

QUESTION_BANK = {
    "behavioral": {
        "easy": [
            {"question": "Tell me about yourself and your background.", "category": "introduction", "follow_up_hints": ["What drew you to this field?"]},
            {"question": "Why are you interested in this role?", "category": "motivation", "follow_up_hints": ["How does this align with your goals?"]},
            {"question": "Describe a time you worked effectively in a team.", "category": "teamwork", "follow_up_hints": ["What was your specific role?"]},
        ],
        "medium": [
            {"question": "Describe a situation where you had to deal with a difficult stakeholder.", "category": "conflict_resolution", "follow_up_hints": ["What was the root cause?"]},
            {"question": "Tell me about a project that failed. What did you learn?", "category": "failure", "follow_up_hints": ["What preventive measures did you implement?"]},
            {"question": "Give an example of when you made a decision with incomplete information.", "category": "decision_making", "follow_up_hints": ["How did you mitigate risk?"]},
            {"question": "Tell me about a time you had to influence someone without direct authority.", "category": "leadership", "follow_up_hints": ["What techniques did you use?"]},
            {"question": "Describe a situation where you had to prioritize competing deadlines.", "category": "time_management", "follow_up_hints": ["How did you decide what to prioritize?"]},
        ],
        "hard": [
            {"question": "Tell me about a time you challenged the status quo and drove organizational change.", "category": "leadership", "follow_up_hints": ["How did you get buy-in?"]},
            {"question": "Describe delivering bad news to senior leadership. How did you approach it?", "category": "communication", "follow_up_hints": ["How did you frame it?"]},
            {"question": "Tell me about the most complex cross-functional project you've led.", "category": "project_management", "follow_up_hints": ["How did you align teams?"]},
        ],
    },
    "technical": {
        "easy": [
            {"question": "Explain the difference between a stack and a queue.", "category": "data_structures", "follow_up_hints": ["Real-world examples?"]},
            {"question": "What is the difference between SQL and NoSQL databases?", "category": "databases", "follow_up_hints": ["Examples of each?"]},
        ],
        "medium": [
            {"question": "Explain database indexing. How does a B-tree index work?", "category": "databases", "follow_up_hints": ["Index trade-offs?"]},
            {"question": "What is the CAP theorem? Give examples.", "category": "distributed_systems", "follow_up_hints": ["Eventual consistency?"]},
            {"question": "Explain horizontal vs vertical scaling challenges.", "category": "scalability", "follow_up_hints": ["State management?"]},
        ],
        "hard": [
            {"question": "Design a distributed rate limiter. Discuss algorithms and trade-offs.", "category": "system_design", "follow_up_hints": ["Token bucket vs sliding window?"]},
            {"question": "How would you handle 1M concurrent WebSocket connections?", "category": "scalability", "follow_up_hints": ["Memory management?"]},
        ],
    },
    "system_design": {
        "easy": [
            {"question": "Design a URL shortener like bit.ly.", "category": "web_systems", "follow_up_hints": ["How to handle collisions?"]},
        ],
        "medium": [
            {"question": "Design a notification system for push, email, and SMS at scale.", "category": "messaging", "follow_up_hints": ["Priority handling?"]},
            {"question": "Design a recommendation system for e-commerce.", "category": "ml_systems", "follow_up_hints": ["Cold start problem?"]},
        ],
        "hard": [
            {"question": "Design a real-time collaborative editor like Google Docs.", "category": "real_time", "follow_up_hints": ["OT vs CRDT?"]},
            {"question": "Design a real-time fraud detection system for millions of TPS.", "category": "ml_systems", "follow_up_hints": ["Feature engineering?"]},
        ],
    },
}


async def generate_questions(
    interview_type: str = "behavioral", difficulty: str = "medium",
    target_role: Optional[str] = None, target_company: Optional[str] = None,
    resume_text: Optional[str] = None, previous_questions: List[str] = None, count: int = 1,
) -> List[Dict]:
    previous_questions = previous_questions or []
    if openai_client and settings.OPENAI_API_KEY:
        try:
            prompt = f"Generate {count} {interview_type} interview questions at {difficulty} difficulty for {target_role or 'Software Engineer'} role. {'Resume: ' + resume_text[:1500] if resume_text else ''} Previously asked: {json.dumps(previous_questions[-5:])}. Respond as JSON array with question, category, difficulty, follow_up_hints fields."
            response = await openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL_MINI,
                messages=[{"role": "system", "content": "You generate interview questions. Respond in JSON only."}, {"role": "user", "content": prompt}],
                temperature=0.7, max_tokens=600, response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return (result.get("questions", [result]) if isinstance(result, dict) else result)[:count]
        except Exception as e:
            logger.error(f"LLM question gen failed: {e}")
    
    type_bank = QUESTION_BANK.get(interview_type, QUESTION_BANK["behavioral"])
    available = [q for q in type_bank.get(difficulty, type_bank["medium"]) if q["question"] not in previous_questions]
    if len(available) < count:
        for d in ["easy", "medium", "hard"]:
            if d != difficulty:
                available.extend([q for q in type_bank.get(d, []) if q["question"] not in previous_questions])
    selected = random.sample(available, min(count, len(available)))
    return [{"question": q["question"], "category": q["category"], "difficulty": difficulty, "follow_up_hints": q.get("follow_up_hints", [])} for q in selected]
