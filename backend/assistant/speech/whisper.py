"""
backend/assistant/speech/whisper.py
───────────────────────────────────
Whisper Speech-to-Text singleton model manager.

Loads faster-whisper model once upon startup or first invocation.
"""

from __future__ import annotations

import logging
import os
import tempfile
import threading
from typing import Optional, Tuple

logger = logging.getLogger("hexakrishi.assistant.speech.whisper")

WHISPER_LANG_MAP: dict[str, str] = {
    "en": "en",
    "ml": "ml",
    "hi": "hi",
    "ta": "ta",
    "kn": "kn",
    "te": "te",
}

_whisper_manager_instance: Optional["WhisperManager"] = None
_whisper_lock = threading.Lock()


class WhisperManager:
    """
    Singleton manager for Whisper STT model.
    """

    def __init__(self) -> None:
        self.model_size = os.getenv("WHISPER_MODEL_SIZE", "medium")
        self.enable_whisper = os.getenv("ENABLE_WHISPER", "false").lower() == "true"
        self._model = None
        self._lock = threading.Lock()

    def is_loaded(self) -> bool:
        return self._model is not None

    def load_model(self) -> None:

        if not self.enable_whisper:
            raise RuntimeError(
                "Server-side Whisper STT is disabled. Set ENABLE_WHISPER=true in .env to enable it."
            )
        if self._model is not None:
            return

        with self._lock:
            if self._model is not None:
                return
            try:
                from faster_whisper import WhisperModel  # type: ignore
                logger.info("[WhisperManager] Loading Whisper '%s' model on CPU...", self.model_size)
                self._model = WhisperModel(
                    self.model_size,
                    device="cpu",
                    compute_type="int8",
                )
                logger.info("[WhisperManager] Whisper model loaded successfully.")
            except Exception as exc:
                logger.error("[WhisperManager] Failed to load Whisper: %s", exc)
                raise

    def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm", lang: str = "en") -> Tuple[str, str]:
        """
        Transcribe audio bytes to text.

        Returns:
            Tuple of (transcribed_text, detected_language).
        """
        self.load_model()
        whisper_lang = WHISPER_LANG_MAP.get(lang, "en")

        suffix = os.path.splitext(filename or "audio.webm")[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            segments, info = self._model.transcribe(
                tmp_path,
                language=whisper_lang,
                beam_size=5,
            )
            text = " ".join(seg.text.strip() for seg in segments).strip()
            return text, info.language
        except Exception as exc:
            logger.error("[WhisperManager] Transcription error: %s", exc)
            raise
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def get_whisper_manager() -> WhisperManager:
    global _whisper_manager_instance
    if _whisper_manager_instance is not None:
        return _whisper_manager_instance

    with _whisper_lock:
        if _whisper_manager_instance is None:
            _whisper_manager_instance = WhisperManager()

    return _whisper_manager_instance
