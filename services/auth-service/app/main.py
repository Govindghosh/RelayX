from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import Base, build_session_factory, get_db
from app.models import User
from app.schemas import AccessTokenResponse, LoginRequest, RefreshRequest, SignupRequest, TokenResponse, UserResponse
from app.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password


bearer_scheme = HTTPBearer(auto_error=False)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine, session_factory = build_session_factory(settings.database_url)

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

    def db_dependency():
        yield from get_db(session_factory)

    def current_user_dependency(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
        db: Annotated[Session, Depends(db_dependency)],
    ) -> User:
        if credentials is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

        payload = decode_token(credentials.credentials, settings.jwt_secret_key, "access")
        user = db.get(User, payload["sub"])
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
    def signup(payload: SignupRequest, db: Annotated[Session, Depends(db_dependency)]) -> TokenResponse:
        existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return build_token_response(user, settings)

    @app.post("/login", response_model=TokenResponse)
    def login(payload: LoginRequest, db: Annotated[Session, Depends(db_dependency)]) -> TokenResponse:
        user = db.query(User).filter(User.email == payload.email.lower()).first()
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        return build_token_response(user, settings)

    @app.post("/refresh", response_model=AccessTokenResponse)
    def refresh(payload: RefreshRequest, db: Annotated[Session, Depends(db_dependency)]) -> AccessTokenResponse:
        token_payload = decode_token(payload.refresh_token, settings.jwt_refresh_secret_key, "refresh")
        user = db.get(User, token_payload["sub"])
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return AccessTokenResponse(
            access_token=create_access_token(user.id, settings.jwt_secret_key, settings.access_token_expire_minutes)
        )

    @app.get("/me", response_model=UserResponse)
    def me(current_user: Annotated[User, Depends(current_user_dependency)]) -> UserResponse:
        return UserResponse.model_validate(current_user)

    @app.get("/users", response_model=list[UserResponse])
    def list_users(
        current_user: Annotated[User, Depends(current_user_dependency)],
        db: Annotated[Session, Depends(db_dependency)],
    ) -> list[UserResponse]:
        users = (
            db.query(User)
            .filter(User.id != current_user.id)
            .order_by(User.created_at.asc(), User.email.asc())
            .all()
        )
        return [UserResponse.model_validate(user) for user in users]

    return app


def build_token_response(user: User, settings: Settings) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, settings.jwt_secret_key, settings.access_token_expire_minutes),
        refresh_token=create_refresh_token(user.id, settings.jwt_refresh_secret_key, settings.refresh_token_expire_days),
        user=UserResponse.model_validate(user),
    )


app = create_app()
