from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status

from app.constants import ALGORITHM
from app.locales import en


def create_access_token(subject: str, secret_key: str) -> str:
    payload = {"sub": subject, "type": "access", "exp": datetime.now(UTC) + timedelta(minutes=30)}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str, secret_key: str) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=en.INVALID_OR_EXPIRED_TOKEN,
    )

    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise credentials_error from exc

    if payload.get("type") != "access" or not payload.get("sub"):
        raise credentials_error

    return payload
