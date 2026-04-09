from sqlalchemy.orm import Session

from app.services.chat_service import list_conversation_messages
from app.validators import MessageResponse


def get_messages(database_session: Session, current_user_id: str, peer_id: str) -> list[MessageResponse]:
    return list_conversation_messages(database_session, current_user_id, peer_id)
