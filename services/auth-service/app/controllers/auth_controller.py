from fastapi import Response, Request
from sqlalchemy.orm import Session

from app.config import Settings
from app.services.auth_service import authenticate_user, build_token_response, refresh_access_token, signup_user, revoke_refresh_token
from app.validators import AccessTokenResponse, LoginRequest, RefreshRequest, SignupRequest, TokenResponse


def set_refresh_cookie(response: Response, refresh_token: str, settings: Settings):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # Set to False for local HTTP development
        samesite="lax",
        max_age=60 * 60 * 24 * 30 # 30 days
    )


def signup(payload: SignupRequest, database_session: Session, settings: Settings, response: Response) -> TokenResponse:
    user = signup_user(database_session, payload)
    token_data, refresh_token = build_token_response(user, database_session, settings)
    set_refresh_cookie(response, refresh_token, settings)
    return token_data


def login(payload: LoginRequest, database_session: Session, settings: Settings, response: Response) -> TokenResponse:
    user = authenticate_user(database_session, payload)
    token_data, refresh_token = build_token_response(user, database_session, settings)
    set_refresh_cookie(response, refresh_token, settings)
    return token_data


def refresh(request: Request, database_session: Session, settings: Settings) -> AccessTokenResponse:
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Fallback to body for compatibility or testing
        pass # Raise error if strictly cookie only
    return refresh_access_token(database_session, refresh_token, settings)


def logout(request: Request, response: Response, database_session: Session, settings: Settings):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        revoke_refresh_token(database_session, refresh_token, settings)
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
