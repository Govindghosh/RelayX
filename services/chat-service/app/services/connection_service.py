import asyncio
import json
from collections import defaultdict
from typing import Any

import redis.asyncio as redis
from fastapi import WebSocket

from app.config import Settings


class ConnectionService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._pubsub_tasks: dict[str, asyncio.Task] = {}
        self._redis_client: redis.Redis | None = None
        self._lock = asyncio.Lock()

    async def init_redis(self) -> None:
        """Initialize the Redis client."""
        if not self._redis_client:
            self._redis_client = redis.Redis(
                host=self.settings.redis_host,
                port=self.settings.redis_port,
                decode_responses=True
            )

    async def close(self) -> None:
        """Cleanup resources."""
        async with self._lock:
            for task in self._pubsub_tasks.values():
                task.cancel()
            
            if self._redis_client:
                await self._redis_client.close()

    def _get_channel_name(self, user_id: str) -> str:
        return f"relayx:user:{user_id}"

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].append(websocket)
            
            # Start pubsub listener for this user if not already running on this instance
            if user_id not in self._pubsub_tasks:
                self._pubsub_tasks[user_id] = asyncio.create_task(self._listen_user_channel(user_id))

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if user_id in self._connections:
                self._connections[user_id] = [c for c in self._connections[user_id] if c != websocket]
                if not self._connections[user_id]:
                    self._connections.pop(user_id)
                    # Stop pubsub listener if no more local connections for this user
                    task = self._pubsub_tasks.pop(user_id, None)
                    if task:
                        task.cancel()

    async def send_to_user(self, user_id: str, payload: dict[str, Any]) -> None:
        """Publish message to Redis; any instance hosting this user will deliver it."""
        if self._redis_client:
            channel = self._get_channel_name(user_id)
            await self._redis_client.publish(channel, json.dumps(payload))
        else:
            # Fallback for local-only if Redis is not initialized
            await self._deliver_locally(user_id, payload)

    async def _listen_user_channel(self, user_id: str) -> None:
        """Background task that listens to Redis for a specific user's messages."""
        if not self._redis_client:
            return

        pubsub = self._redis_client.pubsub()
        channel = self._get_channel_name(user_id)
        await pubsub.subscribe(channel)

        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    payload = json.loads(message["data"])
                    await self._deliver_locally(user_id, payload)
        except asyncio.CancelledError:
            await pubsub.unsubscribe(channel)
        finally:
            await pubsub.close()

    async def _deliver_locally(self, user_id: str, payload: dict[str, Any]) -> None:
        """Deliver message to all local WebSockets for a specific user."""
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
