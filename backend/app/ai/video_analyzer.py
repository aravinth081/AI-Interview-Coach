"""
Video Analysis Module (server-side complement to client-side MediaPipe).
Processes emotion and eye-contact data sent from the browser.
In production, this can also run server-side inference with OpenCV.
"""

import logging
from typing import Dict, List, Optional

logger = logging.getLogger("interview_coach.ai.video")


def aggregate_video_analysis(frame_analyses: List[Dict]) -> Dict:
    """
    Aggregate per-frame video analysis results into a summary.
    Frame analyses come from the client-side MediaPipe face mesh.
    Each frame: {"emotion": str, "confidence": float, "eye_contact": bool}
    """
    if not frame_analyses:
        return {
            "dominant_emotion": "neutral",
            "emotion_distribution": {"neutral": 1.0},
            "eye_contact_percentage": 0.0,
            "confidence_score": 5.0,
        }

    # Aggregate emotions
    emotion_counts: Dict[str, int] = {}
    eye_contact_frames = 0
    total_frames = len(frame_analyses)

    for frame in frame_analyses:
        emotion = frame.get("emotion", "neutral")
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        if frame.get("eye_contact", False):
            eye_contact_frames += 1

    # Calculate distribution
    emotion_distribution = {k: round(v / total_frames, 3) for k, v in emotion_counts.items()}
    dominant_emotion = max(emotion_counts, key=emotion_counts.get)
    eye_contact_pct = round((eye_contact_frames / total_frames) * 100, 1)

    # Confidence scoring from video
    confidence = 6.0
    positive_emotions = {"confident", "happy", "engaged", "neutral"}
    negative_emotions = {"nervous", "anxious", "sad", "fearful", "angry"}

    positive_ratio = sum(emotion_distribution.get(e, 0) for e in positive_emotions)
    negative_ratio = sum(emotion_distribution.get(e, 0) for e in negative_emotions)

    confidence += positive_ratio * 2
    confidence -= negative_ratio * 3
    if eye_contact_pct > 70:
        confidence += 1.0
    elif eye_contact_pct < 30:
        confidence -= 1.5

    confidence = max(1.0, min(10.0, round(confidence, 1)))

    return {
        "dominant_emotion": dominant_emotion,
        "emotion_distribution": emotion_distribution,
        "eye_contact_percentage": eye_contact_pct,
        "confidence_score": confidence,
    }
