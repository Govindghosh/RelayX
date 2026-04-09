from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.locales import en
from app.models import User
from app.services.token_service import create_access_token, create_refresh_token, decode_token
from app.services.user_service import get_user_by_email, get_user_by_id
from app.utils.password import hash_password, verify_password
from app.validators import AccessTokenResponse, LoginRequest, RefreshRequest, SignupRequest, TokenResponse, UserResponse


def signup_user(database_session: Session, payload: SignupRequest) -> User:
    existing_user = get_user_by_email(database_session, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=en.EMAIL_ALREADY_REGISTERED)

    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
    database_session.add(user)
    database_session.commit()
    database_session.refresh(user)
    return user


def authenticate_user(database_session: Session, payload: LoginRequest) -> User:
    user = get_user_by_email(database_session, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.INVALID_EMAIL_OR_PASSWORD)

    return user


def build_token_response(user: User, settings: Settings) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, settings.jwt_secret_key, settings.secret_expiry),
        refresh_token=create_refresh_token(user.id, settings.jwt_refresh_secret_key, settings.refresh_expiry),
        user=UserResponse.model_validate(user),
    )


def refresh_access_token(database_session: Session, payload: RefreshRequest, settings: Settings) -> AccessTokenResponse:
    token_payload = decode_token(payload.refresh_token, settings.jwt_refresh_secret_key, "refresh")
    user = get_user_by_id(database_session, token_payload["sub"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.USER_NOT_FOUND)

    return AccessTokenResponse(
        access_token=create_access_token(user.id, settings.jwt_secret_key, settings.secret_expiry)
    )
