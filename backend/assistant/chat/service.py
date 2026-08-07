"""
backend/assistant/chat/service.py
──────────────────────────────────
Hybrid Chat Service for HexaKrishi AI Assistant.

Combines RAG (FAISS document retrieval) with Groq LLM fallback for seamless,
accurate answers across ALL crops, pests, diseases, weather, and agricultural questions.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

from backend.assistant.services.groq_client import get_groq_client
from backend.assistant.chat.rag import get_rag_retriever
from backend.assistant.translation.detector import detect_language
from backend.assistant.prompts.templates import (
    LANGUAGE_NAMES,
    ASSISTANT_SYSTEM_PROMPT,
    RAG_SYSTEM_PROMPT,
    HYBRID_FALLBACK_PROMPT,
)
from backend.assistant.memory.store import get_memory_store
from backend.assistant.utils import timed_call

logger = logging.getLogger("hexakrishi.assistant.chat")

GROQ_MODEL = "llama-3.3-70b-versatile"


class HybridChatService:
    """
    Hybrid RAG + LLM Chat Assistant Service.
    """

    def __init__(self) -> None:
        self.memory_store = get_memory_store()

    def generate_response(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        lang: str = "en",
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process user chat message and generate response.

        Flow:
        1. Auto-detect language if specified as 'auto' or adjust for query language.
        2. Check RAG vector store for context match.
        3. If RAG match found (FAISS distance threshold met), build RAG prompt.
        4. If no match (or score > distance threshold), build Hybrid LLM fallback prompt (handles any crop!).
        5. Invoke Groq LLM to generate response in user's target language.
        6. Update session memory.

        Returns:
            Dict with keys:
                - reply: str
                - lang: str
                - source: "rag" | "llm"
                - sources: list of source dicts (if rag)
                - elapsed_ms: float
        """
        with timed_call("HybridChatService.generate_response") as tb:
            # 1. Determine Language
            target_lang = lang if lang and lang != "auto" else detect_language(message, fallback="en")
            target_lang_name = LANGUAGE_NAMES.get(target_lang, "English")

            # 2. Manage Session Memory & Context History
            session_mem = self.memory_store.get_or_create(session_id) if session_id else None
            
            # Format explicit passed history or server session memory
            formatted_history = ""
            if conversation_history:
                history_lines = []
                for item in conversation_history[-6:]:
                    role = "User" if item.get("role") == "user" else "Assistant"
                    history_lines.append(f"{role}: {item.get('content', '')}")
                formatted_history = "\n".join(history_lines)
            elif session_mem:
                formatted_history = session_mem.get_formatted_history()

            # 3. RAG Retrieval Attempt
            rag_retriever = get_rag_retriever()
            context_text, sources, best_score = None, [], 1.5

            if rag_retriever and rag_retriever.is_available():
                context_text, sources, best_score = rag_retriever.retrieve(message, top_k=3)

            # Check if RAG context is confident (FAISS L2 distance threshold e.g. < 1.1)
            is_rag_confident = context_text is not None and len(context_text.strip()) > 50 and best_score < 1.15

            # 4. Construct Prompt
            if is_rag_confident:
                source_type = "rag"
                system_prompt = RAG_SYSTEM_PROMPT.format(
                    target_language=target_lang_name,
                    context=context_text,
                )
            else:
                source_type = "llm"
                sources = []
                system_prompt = ASSISTANT_SYSTEM_PROMPT.format(
                    target_language=target_lang_name
                )

            # Build messages for LLM
            messages = [{"role": "system", "content": system_prompt}]

            if formatted_history:
                messages.append({
                    "role": "system",
                    "content": f"Previous Conversation History:\n{formatted_history}"
                })

            messages.append({"role": "user", "content": message})

            # 5. Call Groq LLM
            client = get_groq_client()
            try:
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=messages,
                    temperature=0.4,
                    max_tokens=1024,
                )
                reply = response.choices[0].message.content.strip()
            except Exception as exc:
                logger.error("[HybridChatService] Groq call failed: %s", exc)
                reply = f"⚠️ I encountered an issue generating a response. Please try again. ({exc})"

            # 6. Save turn in session memory if active
            if session_mem:
                session_mem.add_user_message(message)
                session_mem.add_ai_message(reply)

        return {
            "reply": reply,
            "lang": target_lang,
            "source": source_type,
            "sources": sources,
            "elapsed_ms": tb.elapsed_ms,
        }


# Singleton service instance
_chat_service_instance: Optional[HybridChatService] = None


def get_chat_service() -> HybridChatService:
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = HybridChatService()
    return _chat_service_instance
