from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Base, Settings, build_session_factory, get_settings
from app.middleware.auth_middleware import build_current_user_dependency, build_db_dependency
from app.routes.auth_routes import build_auth_router
from app.routes.health_routes import build_health_router
from app.routes.user_routes import build_user_router


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine, session_factory = build_session_factory(settings.resolved_database_url)
    db_dependency = build_db_dependency(session_factory)
    current_user_dependency = build_current_user_dependency(settings, db_dependency)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.engine = engine
        app.state.session_factory = session_factory
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

    app.include_router(build_health_router())
    app.include_router(build_auth_router(db_dependency, settings), prefix="/api/v1/auth")
    app.include_router(build_user_router(db_dependency, current_user_dependency), prefix="/api/v1/auth")
    app.include_router(build_user_router(db_dependency, current_user_dependency), prefix="/api/v1")

    # Instrumentation for Phase 4
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
