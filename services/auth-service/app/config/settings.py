from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def discover_env_files() -> tuple[str, ...]:
    env_files: list[str] = []
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.exists():
            env_files.append(str(candidate))

    env_files.append(".env")
    return tuple(dict.fromkeys(env_files))


class Settings(BaseSettings):
    app_name: str = "RelayX Auth Service"
    environment: str = "development"
    database_url: str | None = None
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "relayx"
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    jwt_secret_key: str = Field(default="relayx-access-secret-key-relayx", min_length=16)
    jwt_refresh_secret_key: str = Field(default="relayx-refresh-secret-key-relayx", min_length=16)
    secret_expiry: str = "15m"
    refresh_expiry: str = "7d"
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=discover_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url

        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
