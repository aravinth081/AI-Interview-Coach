"""
Speech Intelligence Module.
Handles transcription, filler word detection, and speech confidence scoring.
"""

import re
import logging
from typing import Dict, List, Optional

logger = logging.getLogger("interview_coach.ai.speech")

FILLER_WORDS = {
    "en": ["um", "uh", "like", "you know", "basically", "actually", "literally",
           "sort of", "kind of", "i mean", "right", "so yeah", "er", "ah"],
}


def analyze_speech(transcript: str, duration_seconds: int = 0, language: str = "en") -> Dict:
    """Analyze speech patterns from transcript text."""
    if not transcript or not transcript.strip():
        return {"transcript": "", "words_per_minute": 0, "filler_word_count": 0,
                "filler_words": {}, "pause_count": 0, "longest_pause_seconds": 0,
                "confidence_score": 0}

    words = transcript.split()
    word_count = len(words)
    wpm = (word_count / max(duration_seconds, 1)) * 60 if duration_seconds > 0 else 0

    # Filler word detection
    fillers = FILLER_WORDS.get(language, FILLER_WORDS["en"])
    transcript_lower = transcript.lower()
    filler_counts = {}
    total_fillers = 0
    for filler in fillers:
        count = len(re.findall(r'\b' + re.escape(filler) + r'\b', transcript_lower))
        if count > 0:
            filler_counts[filler] = count
            total_fillers += count

    # Pause detection (represented by ... or long gaps)
    pauses = re.findall(r'\.{3,}|\[pause\]|\[silence\]', transcript_lower)
    pause_count = len(pauses)

    # Confidence scoring (0-10)
    confidence = 7.0
    filler_ratio = total_fillers / max(word_count, 1)
    if filler_ratio > 0.1:
        confidence -= 3.0
    elif filler_ratio > 0.05:
        confidence -= 1.5
    elif filler_ratio < 0.02:
        confidence += 1.0

    if wpm > 0:
        if 120 <= wpm <= 160:
            confidence += 1.0
        elif wpm < 80 or wpm > 200:
            confidence -= 1.5

    if pause_count > 5:
        confidence -= 1.0

    sentence_count = len(re.split(r'[.!?]+', transcript))
    if sentence_count >= 3 and word_count > 50:
        confidence += 0.5

    confidence = max(1.0, min(10.0, confidence))

    return {
        "transcript": transcript,
        "words_per_minute": round(wpm, 1),
        "filler_word_count": total_fillers,
        "filler_words": filler_counts,
        "pause_count": pause_count,
        "longest_pause_seconds": 0,
        "confidence_score": round(confidence, 1),
    }
