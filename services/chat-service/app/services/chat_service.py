from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models import Message
from app.validators import MessageResponse


def list_conversation_messages(database_session: Session, current_user_id: str, peer_id: str) -> list[MessageResponse]:
    messages = (
        database_session.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user_id, Message.receiver_id == peer_id),
                and_(Message.sender_id == peer_id, Message.receiver_id == current_user_id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    return [MessageResponse.model_validate(message) for message in messages]


def persist_message(database_session: Session, sender_id: str, receiver_id: str, content: str) -> MessageResponse:
    message = Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
    database_session.add(message)
    database_session.commit()
    database_session.refresh(message)
    return MessageResponse.model_validate(message)
