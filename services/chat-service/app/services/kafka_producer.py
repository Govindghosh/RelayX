import json
import asyncio
from typing import Any
from aiokafka import AIOKafkaProducer
from app.config import Settings

class KafkaProducerService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.producer: AIOKafkaProducer | None = None
        self._lock = asyncio.Lock()

    async def start(self):
        """Initialize and start the Kafka producer."""
        async with self._lock:
            if not self.producer:
                self.producer = AIOKafkaProducer(
                    bootstrap_servers=self.settings.kafka_bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v).encode("utf-8")
                )
                await self.producer.start()

    async def stop(self):
        """Stop the Kafka producer."""
        async with self._lock:
            if self.producer:
                await self.producer.stop()
                self.producer = None

    async def send_message(self, topic: str, message: dict[str, Any]):
        """Produce a message to a specific topic."""
        if not self.producer:
            await self.start()
        
        await self.producer.send_and_wait(topic, message)
