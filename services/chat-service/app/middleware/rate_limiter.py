import time
import redis.asyncio as redis
from fastapi import HTTPException, status, WebSocket

class RateLimiter:
    def __init__(self, redis_client: redis.Redis, limit: int = 10, window: int = 60):
        """
        :param redis_client: The initialized Redis client
        :param limit: Max number of allowed messages in the window
        :param window: Window size in seconds
        """
        self.redis = redis_client
        self.limit = limit
        self.window = window

    async def check_rate_limit(self, user_id: str) -> bool:
        """
        Checks if the user has exceeded their rate limit using a sliding window.
        Returns True if allowed, False otherwise.
        """
        key = f"rate_limit:ws:{user_id}"
        now = time.time()
        
        async with self.redis.pipeline(transaction=True) as pipe:
            # Remove old entries outside the window
            pipe.zremrangebyscore(key, 0, now - self.window)
            # Add current timestamp
            pipe.zadd(key, {str(now): now})
            # Count entries in the window
            pipe.zcard(key)
            # Set expiry to auto-cleanup the key
            pipe.expire(key, self.window)
            
            # Execute
            results = await pipe.execute()
            count = results[2]
            
        return count <= self.limit

async def websocket_rate_limit_check(websocket: WebSocket, user_id: str, rate_limiter: RateLimiter):
    allowed = await rate_limiter.check_rate_limit(user_id)
    if not allowed:
        # In WebSockets, we can either send an error or close the connection
        # For this design, we'll send an error event
        await websocket.send_json({
            "type": "error",
            "error": "Rate limit exceeded. Please wait a moment."
        })
        return False
    return True
