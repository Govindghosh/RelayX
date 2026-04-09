from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RelayX Chat Service"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@postgres:5432/relayx"
    jwt_secret_key: str = Field(default="relayx-access-secret", min_length=16)
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
