from fastapi import APIRouter, HTTPException

from backend.models.chatbot.chatbot import FarmingChatbot
from backend.schemas.chatbot_schema import ChatRequest, ChatResponse

router = APIRouter(
    prefix="/api",
    tags=["AI Chatbot"]
)

# Load chatbot only once
chatbot = FarmingChatbot()


@router.post(
    "/chat",
    response_model=ChatResponse
)
async def chat(request: ChatRequest):

    try:

        result = chatbot.ask(request.message)

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )