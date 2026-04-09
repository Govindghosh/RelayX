from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings
from app.locales import en
from app.utils.token_utils import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def build_db_dependency(session_factory, get_db):
    def db_dependency():
        yield from get_db(session_factory)

    return db_dependency


def build_current_user_id_dependency(settings: Settings):
    def current_user_id_dependency(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    ) -> str:
        if credentials is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.MISSING_ACCESS_TOKEN)

        payload = decode_access_token(credentials.credentials, settings.jwt_secret_key)
        return payload["sub"]

    return current_user_id_dependency


def resolve_websocket_user_id(token: str | None, settings: Settings) -> str:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=en.MISSING_ACCESS_TOKEN)

    payload = decode_access_token(token, settings.jwt_secret_key)
    return payload["sub"]
