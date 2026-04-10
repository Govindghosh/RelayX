import asyncio
import json
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

import aiokafka
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy.orm import Session

from app.config.database import build_session_factory
from app.config.settings import Settings
from app.models.message import Message

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("message-consumer")

async def consume_messages():
    settings = Settings()
    engine, session_factory = build_session_factory(settings.database_url)
    
    consumer = aiokafka.AIOKafkaConsumer(
        "messages-topic",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="relayx-message-group",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda v: json.loads(v.decode("utf-8"))
    )

    logger.info("Starting message consumer loop...")
    await consumer.start()
    
    try:
        async for msg in consumer:
            payload = msg.value
            logger.info(f"Consumed message: {payload['id']}")
            
            # Simple retry logic for DB persistence
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    db: Session = session_factory()
                    try:
                        # Convert ISO string back to datetime if needed
                        created_at = payload["created_at"]
                        if isinstance(created_at, str):
                            created_at = datetime.fromisoformat(created_at)

                        message = Message(
                            id=payload["id"],
                            sender_id=payload["sender_id"],
                            receiver_id=payload["receiver_id"],
                            content=payload["content"],
                            created_at=created_at
                        )
                        db.merge(message)
                        db.commit()
                        logger.info(f"Successfully saved message {payload['id']} to DB")
                        break
                    finally:
                        db.close()
                except Exception as e:
                    logger.error(f"Error saving message (attempt {attempt+1}/{max_retries}): {e}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2**attempt)
                    else:
                        logger.critical(f"Failed to save message {payload['id']} after {max_retries} attempts!")
    except Exception as e:
        logger.error(f"Consumer loop error: {e}")
    finally:
        await consumer.stop()
        logger.info("Consumer stopped.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start consumer as a background task
    task = asyncio.create_task(consume_messages())
    yield
    task.cancel()
    try:
        await task
    except (asyncio.CancelledError, Exception) as e:
        logger.info(f"Consumer task terminated: {e}")

app = FastAPI(title="RelayX Message Consumer", lifespan=lifespan)

# Instrumentation for Phase 4
Instrumentator().instrument(app).expose(app)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "message-consumer"}
