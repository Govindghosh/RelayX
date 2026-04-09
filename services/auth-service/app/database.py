from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool


Base = declarative_base()


def build_engine(database_url: str):
    if database_url.startswith("sqlite"):
        return create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    return create_engine(database_url, pool_pre_ping=True)


def build_session_factory(database_url: str):
    engine = build_engine(database_url)
    return engine, sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


def get_db(session_factory) -> Generator[Session, None, None]:
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
