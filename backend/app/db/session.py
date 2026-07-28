from typing import Generator
from sqlalchemy import event
from sqlmodel import Session, create_engine
from app.core.config import settings

# check_same_thread=False is safe for single-file SQLite databases in FastAPI
# because we ensure a single session per request.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record) -> None:
    """Enforces SQLite foreign keys, enables WAL mode, and sets synchronous=NORMAL for optimal persistence & performance."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency for injecting SQLModel database sessions."""
    with Session(engine) as session:
        yield session
