"""
backend/assistant/speech/manager.py
────────────────────────────────────
Speech Orchestrator unifying Speech-to-Text and Text-to-Speech operations.
"""

from __future__ import annotations

import logging
from typing import Tuple, Optional

from backend.assistant.speech.whisper import get_whisper_manager
from backend.assistant.speech.tts import get_tts_manager

logger = logging.getLogger("hexakrishi.assistant.speech.manager")


class SpeechOrchestrator:
    """
    Unified manager orchestrating STT and TTS services.
    """

    def __init__(self) -> None:
        self.whisper_manager = get_whisper_manager()
        self.tts_manager = get_tts_manager()

    def transcribe_audio(
        self, audio_bytes: bytes, filename: str = "audio.webm", lang: str = "en"
    ) -> Tuple[str, str]:
        return self.whisper_manager.transcribe(audio_bytes, filename=filename, lang=lang)

    def synthesize_speech(self, text: str, lang: str = "en") -> bytes:
        return self.tts_manager.synthesize(text, lang=lang)


_orchestrator_instance: Optional[SpeechOrchestrator] = None


def get_speech_orchestrator() -> SpeechOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = SpeechOrchestrator()
    return _orchestrator_instance
