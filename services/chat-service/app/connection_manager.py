import asyncio
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].append(websocket)

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if user_id not in self._connections:
                return

            self._connections[user_id] = [connection for connection in self._connections[user_id] if connection != websocket]
            if not self._connections[user_id]:
                self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, payload: dict) -> None:
        async with self._lock:
            connections = list(self._connections.get(user_id, []))

        stale_connections: list[WebSocket] = []
        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            await self.disconnect(user_id, connection)
