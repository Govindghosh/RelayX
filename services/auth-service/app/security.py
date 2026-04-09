from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import HTTPException, status


ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(subject: str, secret_key: str, expires_minutes: int) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "type": "access", "exp": expires_at}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def create_refresh_token(subject: str, secret_key: str, expires_days: int) -> str:
    expires_at = datetime.now(UTC) + timedelta(days=expires_days)
    payload = {"sub": subject, "type": "refresh", "exp": expires_at}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(token: str, secret_key: str, expected_type: str) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise credentials_error from exc

    if payload.get("type") != expected_type or not payload.get("sub"):
        raise credentials_error

    return payload
