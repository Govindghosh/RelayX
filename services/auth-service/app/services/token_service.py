from datetime import UTC, datetime

import jwt
from fastapi import HTTPException, status

from app.constants import ALGORITHM
from app.locales import en
from app.utils.duration import parse_duration


def create_access_token(subject: str, secret_key: str, expiry_value: str) -> str:
    payload = {"sub": subject, "type": "access", "exp": datetime.now(UTC) + parse_duration(expiry_value)}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def create_refresh_token(subject: str, secret_key: str, expiry_value: str) -> str:
    payload = {"sub": subject, "type": "refresh", "exp": datetime.now(UTC) + parse_duration(expiry_value)}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(token: str, secret_key: str, expected_type: str) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=en.INVALID_OR_EXPIRED_TOKEN,
    )

    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise credentials_error from exc

    if payload.get("type") != expected_type or not payload.get("sub"):
        raise credentials_error

    return payload
