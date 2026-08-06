"""
Voice API endpoints for HexaKrishi AI.

/api/transcribe  – Speech-to-text using faster-whisper (Whisper medium model).
/api/speak       – Text-to-speech using Meta MMS-TTS via Hugging Face transformers.

NOTE: Whisper medium (~1.5 GB) gives moderate accuracy for Malayalam/Tamil.
      Upgrade `MODEL_SIZE` to "large-v3" (~3 GB) for significantly better
      accuracy, especially for Malayalam, Tamil, Kannada, and Telugu.

Models are loaded once at startup (transcribe) or lazily on first use per
language (TTS), so individual requests stay fast after warmup.
"""

from __future__ import annotations

import io
import logging
import os
import tempfile
from functools import lru_cache
from typing import Optional

import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

logger = logging.getLogger("hexakrishi.voice")

router = APIRouter(prefix="/api", tags=["Voice"])

# ── Language code mappings ───────────────────────────────────────────────────

# App lang code → Whisper ISO language code
WHISPER_LANG_MAP: dict[str, str] = {
    "en": "en",
    "ml": "ml",
    "hi": "hi",
    "ta": "ta",
    "kn": "kn",
    "te": "te",
}

# App lang code → Hugging Face MMS-TTS model ID
MMS_MODEL_MAP: dict[str, str] = {
    "en": "facebook/mms-tts-eng",
    "ml": "facebook/mms-tts-mal",
    "hi": "facebook/mms-tts-hin",
    "ta": "facebook/mms-tts-tam",
    "kn": "facebook/mms-tts-kan",
    "te": "facebook/mms-tts-tel",
}

# ── Whisper model (loaded once at module import) ─────────────────────────────

_whisper_model = None
# Set WHISPER_MODEL_SIZE env var to "large-v3" for better accuracy.
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "medium")
# Set ENABLE_WHISPER=true in .env to enable server-side Whisper STT.
# By default it is OFF because the browser Web Speech API is used instead (instant, zero latency).
ENABLE_WHISPER = os.getenv("ENABLE_WHISPER", "false").lower() == "true"


def _get_whisper():
    if not ENABLE_WHISPER:
        raise RuntimeError(
            "Server-side Whisper STT is disabled. "
            "Set ENABLE_WHISPER=true in .env to enable it. "
            "The browser Web Speech API is used by default (instant, no download needed)."
        )
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel  # type: ignore
            logger.info("[Voice] Loading Whisper '%s' model...", WHISPER_MODEL_SIZE)
            _whisper_model = WhisperModel(
                WHISPER_MODEL_SIZE,
                device="cpu",
                compute_type="int8",
            )
            logger.info("[Voice] Whisper model loaded.")
        except Exception as exc:
            logger.error("[Voice] Failed to load Whisper: %s", exc)
            raise
    return _whisper_model


# ── TTS model cache (lazy per-language) ─────────────────────────────────────

_tts_cache: dict[str, tuple] = {}  # lang_code → (model, tokenizer)


def _get_tts(lang: str):
    """Load and cache MMS-TTS model for the given language on first call."""
    if lang not in _tts_cache:
        model_id = MMS_MODEL_MAP.get(lang, MMS_MODEL_MAP["en"])
        try:
            from transformers import VitsModel, AutoTokenizer  # type: ignore
            logger.info("[Voice] Loading TTS model '%s'...", model_id)
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            model = VitsModel.from_pretrained(model_id)
            model.eval()
            _tts_cache[lang] = (model, tokenizer)
            logger.info("[Voice] TTS model '%s' loaded.", model_id)
        except Exception as exc:
            logger.error("[Voice] Failed to load TTS model '%s': %s", model_id, exc)
            raise
    return _tts_cache[lang]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _numpy_to_wav(audio_array: np.ndarray, sample_rate: int) -> bytes:
    """Convert a float32 numpy array to WAV bytes without scipy dependency."""
    import wave, struct
    # Normalise and convert to int16
    peak = np.abs(audio_array).max()
    if peak > 0:
        audio_array = audio_array / peak
    samples_int16 = (audio_array * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(samples_int16.tobytes())
    return buf.getvalue()


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (webm, wav, ogg, mp3, m4a)"),
    lang: str = Form(default="en", description="Expected language code (en, ml, hi, ta, kn, te)"),
):
    """
    Transcribe uploaded audio using faster-whisper.

    Returns:
        { "text": "...", "detected_language": "..." }
    """
    whisper_lang = WHISPER_LANG_MAP.get(lang, "en")

    try:
        model = _get_whisper()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Speech recognition model is not available. Check server logs.",
        )

    # Save upload to a temp file (faster-whisper needs a file path)
    audio_bytes = await audio.read()
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=whisper_lang,
            beam_size=5,
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {"text": text, "detected_language": info.language}
    except Exception as exc:
        logger.error("[Voice] Transcription failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@router.post("/speak")
async def speak_text(
    text: str = Form(..., description="Text to convert to speech"),
    lang: str = Form(default="en", description="Language code (en, ml, hi, ta, kn, te)"),
):
    """
    Convert text to speech using Meta MMS-TTS.

    Returns a WAV audio stream.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    try:
        import torch  # type: ignore
        model, tokenizer = _get_tts(lang)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Text-to-speech model is not available. Check server logs.",
        )

    try:
        import torch  # noqa: F811
        inputs = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = model(**inputs)
        # output.waveform is shape [1, samples]
        waveform = output.waveform.squeeze().numpy()
        sample_rate = model.config.sampling_rate
        wav_bytes = _numpy_to_wav(waveform, sample_rate)
        return StreamingResponse(
            io.BytesIO(wav_bytes),
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=speech.wav"},
        )
    except Exception as exc:
        logger.error("[Voice] TTS failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"TTS failed: {exc}")
