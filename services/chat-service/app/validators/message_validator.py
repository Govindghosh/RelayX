from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageInput(BaseModel):
    receiver_id: str = Field(min_length=1, max_length=36)
    content: str = Field(min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: datetime


class WebSocketEvent(BaseModel):
    type: str
    message: MessageResponse | None = None
    error: str | None = None
