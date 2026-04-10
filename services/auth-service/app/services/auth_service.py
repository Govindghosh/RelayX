from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.locales import en
from app.models import User, RefreshSession
from app.services.token_service import create_access_token, create_refresh_token, decode_token
from app.services.user_service import get_user_by_email, get_user_by_id
from app.utils.duration import parse_duration
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


def build_token_response(user: User, database_session: Session, settings: Settings) -> tuple[TokenResponse, str]:
    refresh_token = create_refresh_token(user.id, settings.jwt_refresh_secret_key, settings.refresh_expiry)
    
    # Store refresh token session in DB
    expiry = datetime.now(UTC) + parse_duration(settings.refresh_expiry)
    session = RefreshSession(
        user_id=user.id,
        token_hash=hash_password(refresh_token),
        expires_at=expiry
    )
    database_session.add(session)
    database_session.commit()
    
    response = TokenResponse(
        access_token=create_access_token(user.id, settings.jwt_secret_key, settings.secret_expiry),
        refresh_token="", # We will set this in a cookie instead of the response body
        user=UserResponse.model_validate(user),
    )
    return response, refresh_token


def refresh_access_token(database_session: Session, refresh_token: str, settings: Settings) -> AccessTokenResponse:
    token_payload = decode_token(refresh_token, settings.jwt_refresh_secret_key, "refresh")
    user_id = token_payload["sub"]
    
    # Find active session in DB
    sessions = database_session.query(RefreshSession).filter(RefreshSession.user_id == user_id).all()
    valid_session = None
    for session in sessions:
        if verify_password(refresh_token, session.token_hash):
            if session.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
                database_session.delete(session)
                database_session.commit()
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.INVALID_OR_EXPIRED_TOKEN)
            valid_session = session
            break
            
    if not valid_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.INVALID_OR_EXPIRED_TOKEN)

    user = get_user_by_id(database_session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.USER_NOT_FOUND)

    return AccessTokenResponse(
        access_token=create_access_token(user.id, settings.jwt_secret_key, settings.secret_expiry)
    )


def revoke_refresh_token(database_session: Session, refresh_token: str, settings: Settings):
    try:
        token_payload = decode_token(refresh_token, settings.jwt_refresh_secret_key, "refresh")
        user_id = token_payload["sub"]
        
        sessions = database_session.query(RefreshSession).filter(RefreshSession.user_id == user_id).all()
        for session in sessions:
            if verify_password(refresh_token, session.token_hash):
                database_session.delete(session)
                database_session.commit()
                break
    except Exception:
        pass # Ignore errors on logout
