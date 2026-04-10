from typing import Annotated
from fastapi import APIRouter, Depends, status, Response, Request
from sqlalchemy.orm import Session

from app.config import Settings
from app.constants import AUTH_TAG
from app.controllers.auth_controller import login, refresh, signup, logout
from app.validators import AccessTokenResponse, LoginRequest, RefreshRequest, SignupRequest, TokenResponse


def build_auth_router(db_dependency, settings: Settings) -> APIRouter:
    router = APIRouter(tags=[AUTH_TAG])

    @router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
    def signup_route(payload: SignupRequest, response: Response, database_session: Annotated[Session, Depends(db_dependency)]) -> TokenResponse:
        return signup(payload, database_session, settings, response)

    @router.post("/login", response_model=TokenResponse)
    def login_route(payload: LoginRequest, response: Response, database_session: Annotated[Session, Depends(db_dependency)]) -> TokenResponse:
        return login(payload, database_session, settings, response)

    @router.post("/refresh", response_model=AccessTokenResponse)
    def refresh_route(
        request: Request,
        database_session: Annotated[Session, Depends(db_dependency)],
    ) -> AccessTokenResponse:
        return refresh(request, database_session, settings)

    @router.post("/logout")
    def logout_route(
        request: Request,
        response: Response,
        database_session: Annotated[Session, Depends(db_dependency)],
    ):
        return logout(request, response, database_session, settings)

    return router
