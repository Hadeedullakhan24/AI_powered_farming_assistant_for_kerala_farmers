"""
backend/assistant/translation/detector.py
──────────────────────────────────────────
Language auto-detection utility supporting English, Malayalam, Hindi, Tamil,
Kannada, and Telugu.
"""

from __future__ import annotations

import logging
import re
from typing import Optional

logger = logging.getLogger("hexakrishi.assistant.translation")

SUPPORTED_LANGUAGES = {"en", "ml", "hi", "ta", "kn", "te"}


def detect_language(text: str, fallback: str = "en") -> str:
    """
    Detect the language of text using Unicode script range heuristic and langdetect library.

    Args:
        text: Input text string.
        fallback: Fallback language code if detection fails or is unsupported.

    Returns:
        2-letter language code ("en", "ml", "hi", "ta", "kn", "te").
    """
    if not text or not text.strip():
        return fallback

    # 1. Unicode Script Range Heuristic (Fast & 100% accurate for Indic scripts)
    script_counts = {
        "ml": len(re.findall(r"[\u0D00-\u0D7F]", text)),  # Malayalam
        "hi": len(re.findall(r"[\u0900-\u097F]", text)),  # Devanagari (Hindi)
        "ta": len(re.findall(r"[\u0B80-\u0BFF]", text)),  # Tamil
        "kn": len(re.findall(r"[\u0C80-\u0CFF]", text)),  # Kannada
        "te": len(re.findall(r"[\u0C00-\u0C7F]", text)),  # Telugu
    }

    max_script, max_count = max(script_counts.items(), key=lambda x: x[1])
    if max_count > 2:
        return max_script

    # 2. Try langdetect library if available
    try:
        from langdetect import detect  # type: ignore
        detected = detect(text)
        if detected in SUPPORTED_LANGUAGES:
            return detected
    except Exception:
        pass

    return fallback
