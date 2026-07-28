from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Finance Tracker"
    API_V1_STR: str = "/api/v1"

    # Base path of the application (root of the workspace)
    # config.py is at backend/app/core/config.py
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    BACKUP_DIR: Path = BASE_DIR / "backups"
    DATABASE_NAME: str = "finance.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def DATABASE_URL(self) -> str:
        """Dynamically build the SQLite connection URL, ensuring directories exist."""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        db_path = self.DATA_DIR / self.DATABASE_NAME
        return f"sqlite:///{db_path.as_posix()}"


settings = Settings()
