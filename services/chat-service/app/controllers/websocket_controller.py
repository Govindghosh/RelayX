import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, WebSocket, WebSocketDisconnect, status

from app.locales import en
from app.middleware.auth_middleware import resolve_websocket_user_id
from app.middleware.rate_limiter import websocket_rate_limit_check
from app.validators import MessageInput, WebSocketEvent, MessageResponse


async def handle_websocket_session(
    websocket: WebSocket, 
    settings, 
    connection_service, 
    session_factory,
    rate_limiter,
    kafka_producer
) -> None:
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
            
            # Phase 2: Apply Rate Limiting
            if not await websocket_rate_limit_check(websocket, current_user_id, rate_limiter):
                continue

            try:
                message_input = MessageInput.model_validate(incoming_payload)
            except Exception:
                await websocket.send_json(WebSocketEvent(type="error", error=en.INVALID_MESSAGE_PAYLOAD).model_dump())
                continue

            clean_content = message_input.content.strip()
            if not clean_content:
                await websocket.send_json(WebSocketEvent(type="error", error=en.MESSAGE_CONTENT_EMPTY).model_dump())
                continue

            # Phase 3: Kafka Async Pipeline
            # We generate the ID and timestamp now to ensure the UI gets immediate confirmation
            message_data = {
                "id": str(uuid.uuid4()),
                "sender_id": current_user_id,
                "receiver_id": message_input.receiver_id,
                "content": clean_content,
                "created_at": datetime.now(UTC).isoformat()
            }

            # Ship to Kafka
            await kafka_producer.send_message("messages-topic", message_data)

            # Broadcast to connected clients (any server instance)
            response_payload = WebSocketEvent(
                type="message", 
                message=MessageResponse(**message_data)
            ).model_dump(mode="json")
            
            await connection_service.send_to_user(current_user_id, response_payload)
            if message_data["receiver_id"] != current_user_id:
                await connection_service.send_to_user(message_data["receiver_id"], response_payload)
    except WebSocketDisconnect:
        await connection_service.disconnect(current_user_id, websocket)
    except Exception:
        await connection_service.disconnect(current_user_id, websocket)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
