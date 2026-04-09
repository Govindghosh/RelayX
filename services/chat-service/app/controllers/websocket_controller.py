from fastapi import HTTPException, WebSocket, WebSocketDisconnect, status

from app.locales import en
from app.middleware.auth_middleware import resolve_websocket_user_id
from app.services.chat_service import persist_message
from app.validators import MessageInput, WebSocketEvent


async def handle_websocket_session(websocket: WebSocket, settings, connection_service, session_factory) -> None:
    token = websocket.query_params.get("token")

    try:
        current_user_id = resolve_websocket_user_id(token, settings)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await connection_service.connect(current_user_id, websocket)

    try:
        while True:
            incoming_payload = await websocket.receive_json()

            try:
                message_input = MessageInput.model_validate(incoming_payload)
            except Exception:
                await websocket.send_json(WebSocketEvent(type="error", error=en.INVALID_MESSAGE_PAYLOAD).model_dump())
                continue

            clean_content = message_input.content.strip()
            if not clean_content:
                await websocket.send_json(WebSocketEvent(type="error", error=en.MESSAGE_CONTENT_EMPTY).model_dump())
                continue

            database_session = session_factory()
            try:
                message = persist_message(database_session, current_user_id, message_input.receiver_id, clean_content)
            finally:
                database_session.close()

            response_payload = WebSocketEvent(type="message", message=message).model_dump(mode="json")
            await connection_service.send_to_user(current_user_id, response_payload)
            if message.receiver_id != current_user_id:
                await connection_service.send_to_user(message.receiver_id, response_payload)
    except WebSocketDisconnect:
        await connection_service.disconnect(current_user_id, websocket)
    except Exception:
        await connection_service.disconnect(current_user_id, websocket)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
