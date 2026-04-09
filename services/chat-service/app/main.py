from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.auth import decode_access_token
from app.config import Settings, get_settings
from app.connection_manager import ConnectionManager
from app.database import Base, build_session_factory, get_db
from app.models import Message
from app.schemas import MessageInput, MessageResponse, WebSocketEvent


bearer_scheme = HTTPBearer(auto_error=False)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine, session_factory = build_session_factory(settings.database_url)
    manager = ConnectionManager()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.engine = engine
        app.state.session_factory = session_factory
        app.state.connection_manager = manager
        Base.metadata.create_all(bind=engine)
        yield

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def db_dependency():
        yield from get_db(session_factory)

    def current_user_id_dependency(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    ) -> str:
        if credentials is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

        payload = decode_access_token(credentials.credentials, settings.jwt_secret_key)
        return payload["sub"]

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/messages/{peer_id}", response_model=list[MessageResponse])
    def get_messages(
        peer_id: str,
        current_user_id: Annotated[str, Depends(current_user_id_dependency)],
        db: Annotated[Session, Depends(db_dependency)],
    ) -> list[MessageResponse]:
        messages = (
            db.query(Message)
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

    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket) -> None:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        try:
            payload = decode_access_token(token, settings.jwt_secret_key)
        except HTTPException:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        current_user_id = payload["sub"]
        await manager.connect(current_user_id, websocket)

        try:
            while True:
                incoming_payload = await websocket.receive_json()

                try:
                    message_input = MessageInput.model_validate(incoming_payload)
                except Exception:
                    await websocket.send_json(WebSocketEvent(type="error", error="Invalid message payload").model_dump())
                    continue

                clean_content = message_input.content.strip()
                if not clean_content:
                    await websocket.send_json(WebSocketEvent(type="error", error="Message content cannot be empty").model_dump())
                    continue

                db = session_factory()
                try:
                    message = Message(
                        sender_id=current_user_id,
                        receiver_id=message_input.receiver_id,
                        content=clean_content,
                    )
                    db.add(message)
                    db.commit()
                    db.refresh(message)
                finally:
                    db.close()

                response_payload = WebSocketEvent(
                    type="message",
                    message=MessageResponse.model_validate(message),
                ).model_dump(mode="json")

                await manager.send_to_user(current_user_id, response_payload)
                if message.receiver_id != current_user_id:
                    await manager.send_to_user(message.receiver_id, response_payload)
        except WebSocketDisconnect:
            await manager.disconnect(current_user_id, websocket)
        except Exception:
            await manager.disconnect(current_user_id, websocket)
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

    return app


app = create_app()
