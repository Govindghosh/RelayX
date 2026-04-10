from fastapi import APIRouter, WebSocket

from app.controllers.websocket_controller import handle_websocket_session


def build_websocket_router(settings, connection_service, session_factory) -> APIRouter:
    router = APIRouter()

    @router.websocket("/ws")
    async def websocket_route(websocket: WebSocket) -> None:
        await handle_websocket_session(
            websocket, 
            settings, 
            connection_service, 
            session_factory,
            websocket.app.state.rate_limiter,
            websocket.app.state.kafka_producer
        )

    return router
