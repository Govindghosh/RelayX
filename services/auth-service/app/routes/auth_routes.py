from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.constants import AUTH_TAG
from app.controllers.auth_controller import login, refresh, signup
from app.validators import AccessTokenResponse, LoginRequest, RefreshRequest, SignupRequest, TokenResponse


def build_auth_router(db_dependency, settings: Settings) -> APIRouter:
    router = APIRouter(tags=[AUTH_TAG])

    @router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
    def signup_route(payload: SignupRequest, database_session: Annotated[Session, Depends(db_dependency)]) -> TokenResponse:
        return signup(payload, database_session, settings)

    @router.post("/login", response_model=TokenResponse)
    def login_route(payload: LoginRequest, database_session: Annotated[Session, Depends(db_dependency)]) -> TokenResponse:
        return login(payload, database_session, settings)

    @router.post("/refresh", response_model=AccessTokenResponse)
    def refresh_route(
        payload: RefreshRequest,
        database_session: Annotated[Session, Depends(db_dependency)],
    ) -> AccessTokenResponse:
        return refresh(payload, database_session, settings)

    return router
