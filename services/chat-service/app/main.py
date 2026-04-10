from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Base, Settings, build_session_factory, get_db, get_settings
from app.middleware.auth_middleware import build_current_user_id_dependency, build_db_dependency
from app.routes.health_routes import build_health_router
from app.routes.http_routes import build_http_router
from app.routes.websocket_routes import build_websocket_router
from app.services.connection_service import ConnectionService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine, session_factory = build_session_factory(settings.resolved_database_url)
    from app.services.kafka_producer import KafkaProducerService
    kafka_producer = KafkaProducerService(settings)
    
    connection_service = ConnectionService(settings)
    db_dependency = build_db_dependency(session_factory, get_db)
    current_user_id_dependency = build_current_user_id_dependency(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.engine = engine
        app.state.session_factory = session_factory
        app.state.connection_service = connection_service
        app.state.kafka_producer = kafka_producer
        
        # Initialize Redis and Kafka
        await connection_service.init_redis()
        await kafka_producer.start()
        
        # Add RateLimiter to state
        from app.middleware.rate_limiter import RateLimiter
        app.state.rate_limiter = RateLimiter(connection_service._redis_client)
        
        Base.metadata.create_all(bind=engine)
        yield
        
        # Cleanup
        await connection_service.close()
        await kafka_producer.stop()

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(build_health_router())
    app.include_router(build_http_router(db_dependency, current_user_id_dependency), prefix="/api/v1/chat")
    app.include_router(build_websocket_router(settings, connection_service, session_factory))

    # Instrumentation for Phase 4
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
