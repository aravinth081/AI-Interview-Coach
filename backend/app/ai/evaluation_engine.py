"""
AI Answer Evaluation Engine.
Uses LLM (OpenAI GPT-4o) for structured answer evaluation with prompt engineering.
Falls back to rule-based scoring when API is unavailable.
"""

import json
import logging
import re
from typing import Optional, List, Dict
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("interview_coach.ai.evaluation")

# Try to import OpenAI, fall back gracefully
try:
    from openai import AsyncOpenAI
    openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except ImportError:
    openai_client = None
    logger.warning("OpenAI package not installed. Using rule-based evaluation.")


# ============================================
# PROMPT TEMPLATES
# ============================================
EVALUATION_SYSTEM_PROMPT = """You are an expert interview coach with 20 years of experience at top tech companies (Google, Amazon, Meta, Apple, Netflix). You evaluate interview answers with precision and actionable feedback.

SCORING CRITERIA (0-10 scale):

**Content Score:**
- 0-2: No relevant content, off-topic
- 3-4: Mentions relevant concepts but lacks depth
- 5-6: Adequate answer with some structure
- 7-8: Strong answer with specific examples and clear structure (STAR method for behavioral)
- 9-10: Exceptional answer demonstrating deep expertise and unique insights

**Communication Score:**
- 0-2: Incoherent, very hard to follow
- 3-4: Basic communication, lacks structure
- 5-6: Clear but could be more concise/organized
- 7-8: Well-structured, engaging delivery
- 9-10: Compelling storytelling, perfect clarity and pacing

RULES:
- Be specific in feedback, not generic
- Reference actual parts of the answer
- Provide 2-3 concrete strengths
- Provide 2-3 specific improvements
- Generate a brief sample answer showing the ideal approach
- Score honestly - most candidates score 5-7

RESPOND IN STRICT JSON FORMAT ONLY."""

EVALUATION_USER_TEMPLATE = """Evaluate this interview response:

**Interview Type:** {interview_type}
**Target Role:** {target_role}
**Difficulty:** {difficulty}

**Question:** {question}

**Candidate's Answer:** {answer}

Respond with this exact JSON structure:
{{
    "content_score": <float 0-10>,
    "communication_score": <float 0-10>,
    "overall_score": <float 0-10>,
    "feedback": "<2-3 sentence summary of performance>",
    "strengths": ["<specific strength 1>", "<specific strength 2>"],
    "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
    "sample_answer": "<brief ideal answer approach in 3-4 sentences>"
}}"""


async def evaluate_answer(
    question: str,
    answer: str,
    interview_type: str = "behavioral",
    target_role: str = "Software Engineer",
    difficulty: str = "medium",
) -> Dict:
    """
    Evaluate an interview answer using LLM or fallback to rule-based scoring.
    Returns structured evaluation with scores and feedback.
    """
    
    # Try LLM evaluation first
    if openai_client and settings.OPENAI_API_KEY:
        try:
            return await _llm_evaluate(question, answer, interview_type, target_role, difficulty)
        except Exception as e:
            logger.error(f"LLM evaluation failed: {e}. Falling back to rule-based.")
    
    # Fallback to rule-based evaluation
    return _rule_based_evaluate(question, answer, interview_type)


async def _llm_evaluate(
    question: str,
    answer: str,
    interview_type: str,
    target_role: str,
    difficulty: str,
) -> Dict:
    """Evaluate using OpenAI GPT-4o with structured output."""
    
    model = settings.OPENAI_MODEL
    
    user_prompt = EVALUATION_USER_TEMPLATE.format(
        interview_type=interview_type,
        target_role=target_role or "General",
        difficulty=difficulty,
        question=question,
        answer=answer,
    )
    
    response = await openai_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    
    result = json.loads(response.choices[0].message.content)
    
    # Validate and clamp scores
    for key in ["content_score", "communication_score", "overall_score"]:
        result[key] = max(0, min(10, float(result.get(key, 5))))
    
    # Ensure required fields
    result.setdefault("feedback", "Evaluation completed.")
    result.setdefault("strengths", ["Good attempt"])
    result.setdefault("improvements", ["Practice more"])
    result.setdefault("sample_answer", "N/A")
    
    return result


def _rule_based_evaluate(question: str, answer: str, interview_type: str) -> Dict:
    """
    Rule-based evaluation fallback.
    Analyzes answer structure, length, keyword usage, and completeness.
    """
    
    if not answer or len(answer.strip()) < 10:
        return {
            "content_score": 1.0,
            "communication_score": 1.0,
            "overall_score": 1.0,
            "feedback": "The answer was too brief. Please provide a more detailed response.",
            "strengths": ["Attempted to answer the question"],
            "improvements": [
                "Provide more detail and specific examples",
                "Use the STAR method for behavioral questions",
                "Aim for at least 2-3 minutes of speaking time"
            ],
            "sample_answer": "A strong answer would include specific examples from your experience, quantifiable results, and a clear structure."
        }
    
    words = answer.split()
    word_count = len(words)
    sentence_count = len(re.split(r'[.!?]+', answer))
    avg_sentence_length = word_count / max(sentence_count, 1)
    
    # Content scoring
    content_score = 5.0
    
    # Length analysis
    if word_count < 30:
        content_score -= 2.0
    elif word_count < 100:
        content_score -= 0.5
    elif word_count > 150:
        content_score += 1.0
    elif word_count > 300:
        content_score += 1.5
    
    # Structure indicators (STAR method keywords)
    structure_keywords = {
        "situation": 0.5, "task": 0.5, "action": 0.5, "result": 0.5,
        "example": 0.3, "specifically": 0.3, "because": 0.2,
        "first": 0.2, "then": 0.2, "finally": 0.2,
        "achieved": 0.3, "improved": 0.3, "reduced": 0.3, "increased": 0.3,
        "team": 0.2, "project": 0.2, "challenge": 0.2,
    }
    
    answer_lower = answer.lower()
    for keyword, bonus in structure_keywords.items():
        if keyword in answer_lower:
            content_score += bonus
    
    # Quantitative indicators (numbers suggest specific results)
    numbers = re.findall(r'\d+%?', answer)
    if len(numbers) >= 2:
        content_score += 1.0
    elif len(numbers) >= 1:
        content_score += 0.5
    
    # Communication scoring
    communication_score = 5.0
    
    # Sentence variety
    if 10 <= avg_sentence_length <= 20:
        communication_score += 1.0
    elif avg_sentence_length > 30:
        communication_score -= 1.0
    
    # Transition words
    transitions = ["however", "moreover", "additionally", "furthermore", "consequently", "therefore"]
    transition_count = sum(1 for t in transitions if t in answer_lower)
    communication_score += min(transition_count * 0.3, 1.0)
    
    # Clamp scores
    content_score = max(1.0, min(10.0, content_score))
    communication_score = max(1.0, min(10.0, communication_score))
    overall_score = round((content_score * 0.6 + communication_score * 0.4), 1)
    
    # Generate feedback
    strengths = []
    improvements = []
    
    if word_count > 100:
        strengths.append("Provided a detailed response with good depth")
    if len(numbers) > 0:
        strengths.append("Included specific metrics and quantifiable results")
    if any(k in answer_lower for k in ["situation", "task", "action", "result"]):
        strengths.append("Used structured approach (STAR method elements)")
    if transition_count > 0:
        strengths.append("Good use of transition words for flow")
    
    if not strengths:
        strengths.append("Made an effort to address the question")
    
    if word_count < 100:
        improvements.append("Elaborate more with specific examples from your experience")
    if len(numbers) == 0:
        improvements.append("Include quantifiable results (percentages, numbers, metrics)")
    if not any(k in answer_lower for k in ["situation", "task", "action", "result"]):
        improvements.append("Structure your answer using the STAR method (Situation, Task, Action, Result)")
    if transition_count == 0:
        improvements.append("Use transition words to improve flow between ideas")
    
    feedback = f"Your answer scored {overall_score}/10 overall. "
    if overall_score >= 7:
        feedback += "Strong response with good structure and content."
    elif overall_score >= 5:
        feedback += "Decent response but could benefit from more specific examples and structured delivery."
    else:
        feedback += "The response needs more depth, structure, and concrete examples."
    
    return {
        "content_score": round(content_score, 1),
        "communication_score": round(communication_score, 1),
        "overall_score": round(overall_score, 1),
        "feedback": feedback,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "sample_answer": _generate_sample_answer_hint(question, interview_type),
    }


def _generate_sample_answer_hint(question: str, interview_type: str) -> str:
    """Generate a brief sample answer structure hint."""
    if interview_type == "behavioral":
        return (
            "A strong behavioral answer follows the STAR method: Start with the Situation "
            "(set the context), describe the Task (your specific responsibility), detail the "
            "Actions you took (be specific about YOUR contributions), and share the Results "
            "(use numbers and metrics when possible)."
        )
    elif interview_type == "technical":
        return (
            "A strong technical answer demonstrates: 1) Understanding of the problem, "
            "2) Knowledge of relevant concepts and trade-offs, 3) Practical experience "
            "with implementation, and 4) Awareness of edge cases and optimization."
        )
    elif interview_type == "system_design":
        return (
            "A strong system design answer covers: 1) Requirements clarification, "
            "2) High-level architecture, 3) Component deep-dive, 4) Data model, "
            "5) Scalability considerations, and 6) Trade-off analysis."
        )
    return (
        "Structure your answer clearly: state your main point, support it with "
        "specific examples, and conclude with the impact or lesson learned."
    )


async def generate_interview_summary(responses: List[Dict]) -> Dict:
    """
    Generate an overall interview summary from all responses.
    """
    if not responses:
        return {
            "overall_feedback": "No responses to evaluate.",
            "top_strengths": [],
            "key_improvements": [],
            "recommended_resources": [],
            "improvement_plan": ""
        }
    
    # Aggregate scores
    content_scores = [r.get("content_score", 0) for r in responses if r.get("content_score")]
    comm_scores = [r.get("communication_score", 0) for r in responses if r.get("communication_score")]
    overall_scores = [r.get("overall_score", 0) for r in responses if r.get("overall_score")]
    
    avg_content = sum(content_scores) / len(content_scores) if content_scores else 0
    avg_comm = sum(comm_scores) / len(comm_scores) if comm_scores else 0
    avg_overall = sum(overall_scores) / len(overall_scores) if overall_scores else 0
    
    # Collect all strengths and improvements
    all_strengths = []
    all_improvements = []
    for r in responses:
        all_strengths.extend(r.get("strengths", []))
        all_improvements.extend(r.get("improvements", []))
    
    # Deduplicate and rank
    strength_counts = {}
    for s in all_strengths:
        strength_counts[s] = strength_counts.get(s, 0) + 1
    top_strengths = sorted(strength_counts.keys(), key=lambda x: strength_counts[x], reverse=True)[:5]
    
    improvement_counts = {}
    for i in all_improvements:
        improvement_counts[i] = improvement_counts.get(i, 0) + 1
    key_improvements = sorted(improvement_counts.keys(), key=lambda x: improvement_counts[x], reverse=True)[:5]
    
    # Generate feedback
    if avg_overall >= 8:
        overall_feedback = f"Excellent performance! Your average score of {avg_overall:.1f}/10 shows strong interview skills. Focus on maintaining consistency and pushing into the 9+ range."
    elif avg_overall >= 6:
        overall_feedback = f"Good performance with an average of {avg_overall:.1f}/10. You have solid fundamentals but there's room for improvement in specific areas. Focus on the key improvements below."
    elif avg_overall >= 4:
        overall_feedback = f"Average performance at {avg_overall:.1f}/10. While you show potential, significant improvement is needed in both content depth and delivery. Regular practice is recommended."
    else:
        overall_feedback = f"Your score of {avg_overall:.1f}/10 indicates you need more preparation. Focus on understanding common interview patterns and practice structuring your answers."
    
    # Resource recommendations based on weaknesses
    resources = []
    if avg_content < 6:
        resources.append({"title": "Cracking the Coding Interview", "type": "book", "url": "https://www.crackingthecodinginterview.com/"})
    if avg_comm < 6:
        resources.append({"title": "TED Talks on Communication", "type": "video", "url": "https://www.ted.com/topics/communication"})
    if "STAR method" in " ".join(all_improvements):
        resources.append({"title": "STAR Method Guide", "type": "article", "url": "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique"})
    
    # Improvement plan
    plan_parts = [f"Based on your interview performance (avg: {avg_overall:.1f}/10), here's your personalized improvement plan:\n"]
    for idx, improvement in enumerate(key_improvements[:3], 1):
        plan_parts.append(f"{idx}. **{improvement}** — Practice this in your next 2-3 mock interviews.")
    plan_parts.append(f"\nTarget: Improve your overall score to {min(10, avg_overall + 2):.1f}/10 within the next 5 practice sessions.")
    
    return {
        "overall_feedback": overall_feedback,
        "top_strengths": top_strengths,
        "key_improvements": key_improvements,
        "recommended_resources": resources,
        "improvement_plan": "\n".join(plan_parts),
    }
