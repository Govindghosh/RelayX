from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import Settings, get_db
from app.locales import en
from app.models import User
from app.services.token_service import decode_token
from app.services.user_service import get_user_by_id


bearer_scheme = HTTPBearer(auto_error=False)


def build_db_dependency(session_factory):
    def db_dependency():
        yield from get_db(session_factory)

    return db_dependency


def build_current_user_dependency(settings: Settings, db_dependency):
    def current_user_dependency(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
        database_session: Annotated[Session, Depends(db_dependency)],
    ) -> User:
        if credentials is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.MISSING_ACCESS_TOKEN)

        payload = decode_token(credentials.credentials, settings.jwt_secret_key, "access")
        user = get_user_by_id(database_session, payload["sub"])
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.USER_NOT_FOUND)
        return user

    return current_user_dependency
