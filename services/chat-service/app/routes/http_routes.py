from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.constants import MESSAGE_TAG
from app.controllers.message_controller import get_messages
from app.validators import MessageResponse


def build_http_router(db_dependency, current_user_id_dependency) -> APIRouter:
    router = APIRouter(tags=[MESSAGE_TAG])

    @router.get("/messages/{peer_id}", response_model=list[MessageResponse])
    def get_messages_route(
        peer_id: str,
        database_session: Annotated[Session, Depends(db_dependency)],
        current_user_id: str = Depends(current_user_id_dependency),
    ) -> list[MessageResponse]:
        return get_messages(database_session, current_user_id, peer_id)

    return router
