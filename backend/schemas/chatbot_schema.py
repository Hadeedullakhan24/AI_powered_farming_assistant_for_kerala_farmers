from pydantic import BaseModel
from typing import List


class ChatRequest(BaseModel):
    message: str


class Source(BaseModel):
    source: str
    page: int | str
    category: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]