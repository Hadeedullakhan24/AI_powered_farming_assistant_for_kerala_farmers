"""
backend/assistant/routes.py
────────────────────────────
Unified FastAPI Router for the HexaKrishi AI Assistant module.

Consolidates all assistant, chatbot, voice, health, and status endpoints while
maintaining 100% backward compatibility with all frontend API contracts.
"""

from __future__ import annotations

import io
import logging
from typing import List, Optional

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.assistant.chat.service import get_chat_service
from backend.assistant.chat.rag import get_rag_retriever
from backend.assistant.speech.manager import get_speech_orchestrator
from backend.assistant.services.health import get_assistant_health
from backend.schemas.chatbot_schema import ChatRequest as ChatbotRequest, ChatResponse as ChatbotResponse

logger = logging.getLogger("hexakrishi.assistant.routes")

router = APIRouter(tags=["AI Assistant Core"])


# ── Pydantic Request Models ───────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    lang: str = Field(default="en", description="BCP-47 / ISO language code for response")


# ── Assistant Chat Endpoints ─────────────────────────────────────────────────

@router.post("/api/assistant/chat")
def assistant_chat(
    request: AssistantChatRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    """
    Main AI Assistant Chat Endpoint.

    Executes Hybrid RAG + LLM fallback pipeline.
    Supports session memory via optional X-Session-ID header.
    """
    try:
        service = get_chat_service()
        history_dicts = [item.model_dump() for item in request.conversation_history]
        result = service.generate_response(
            message=request.message,
            conversation_history=history_dicts,
            lang=request.lang,
            session_id=x_session_id,
        )
        return result
    except Exception as exc:
        logger.error("[AssistantRoute] Chat error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/chat", response_model=ChatbotResponse)
async def chatbot_legacy_chat(request: ChatbotRequest):
    """
    Legacy FAISS Chatbot Endpoint (/api/chat).

    Preserved for direct RAG knowledge base search interface.
    """
    try:
        rag = get_rag_retriever()
        if not rag or not rag.is_available():
            # Fallback via Hybrid Service if FAISS not directly loaded
            service = get_chat_service()
            res = service.generate_response(message=request.message, lang="en")
            return {
                "answer": res["reply"],
                "sources": res.get("sources", [])
            }
        
        result = rag.ask_rag_direct(request.message)
        return result
    except Exception as exc:
        logger.error("[AssistantRoute] Legacy /api/chat error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ── Voice Endpoints ───────────────────────────────────────────────────────────

@router.post("/api/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (webm, wav, ogg, mp3, m4a)"),
    lang: str = Form(default="en", description="Expected language code (en, ml, hi, ta, kn, te)"),
):
    """
    Transcribe uploaded audio using Whisper STT.

    Returns: { "text": "...", "detected_language": "..." }
    """
    try:
        orchestrator = get_speech_orchestrator()
        audio_bytes = await audio.read()
        text, detected_lang = orchestrator.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=audio.filename or "audio.webm",
            lang=lang,
        )
        return {"text": text, "detected_language": detected_lang}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error("[AssistantRoute] Transcribe error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")


@router.post("/api/speak")
async def speak_text(
    text: str = Form(..., description="Text to convert to speech"),
    lang: str = Form(default="en", description="Language code (en, ml, hi, ta, kn, te)"),
):
    """
    Convert text to speech using MMS-TTS.

    Returns audio/wav streaming response.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    try:
        orchestrator = get_speech_orchestrator()
        wav_bytes = orchestrator.synthesize_speech(text=text, lang=lang)
        return StreamingResponse(
            io.BytesIO(wav_bytes),
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=speech.wav"},
        )
    except Exception as exc:
        logger.error("[AssistantRoute] Speak error: %s", exc)
        raise HTTPException(status_code=500, detail=f"TTS failed: {exc}")


# ── Health & Performance Endpoints ───────────────────────────────────────────

@router.get("/api/assistant/health")
def assistant_health():
    """
    Returns health status of all assistant modules (Groq, RAG, Whisper, TTS).
    """
    return get_assistant_health()


@router.get("/api/assistant/status")
def assistant_status():
    """
    Returns active session counts and operational status.
    """
    from backend.assistant.memory.store import get_memory_store
    mem_store = get_memory_store()
    return {
        "status": "operational",
        "active_sessions": mem_store.active_session_count(),
    }
