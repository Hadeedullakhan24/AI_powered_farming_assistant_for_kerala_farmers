from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.groq_services import get_chat_response


router = APIRouter(tags=["AI Assistant"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)
    conversation_history: list[ChatMessage] = Field(default_factory=list)


@router.post("/assistant/chat")
def assistant_chat(request: ChatRequest):
    return get_chat_response(
        message=request.message,
        conversation_history=[item.model_dump() for item in request.conversation_history],
    )
