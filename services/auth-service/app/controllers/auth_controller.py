from sqlalchemy.orm import Session

from app.config import Settings
from app.services.auth_service import authenticate_user, build_token_response, refresh_access_token, signup_user
from app.validators import AccessTokenResponse, LoginRequest, RefreshRequest, SignupRequest, TokenResponse


def signup(payload: SignupRequest, database_session: Session, settings: Settings) -> TokenResponse:
    user = signup_user(database_session, payload)
    return build_token_response(user, settings)


def login(payload: LoginRequest, database_session: Session, settings: Settings) -> TokenResponse:
    user = authenticate_user(database_session, payload)
    return build_token_response(user, settings)


def refresh(payload: RefreshRequest, database_session: Session, settings: Settings) -> AccessTokenResponse:
    return refresh_access_token(database_session, payload, settings)
