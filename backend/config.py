import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

BACKEND_DIR = Path(__file__).resolve().parent
DB_FILE = (BACKEND_DIR / "aces_db.sqlite").as_posix()
DEFAULT_DB_ASYNC = f"sqlite+aiosqlite:///{DB_FILE}"
DEFAULT_DB_SYNC = f"sqlite:///{DB_FILE}"
ENV_PATH = (BACKEND_DIR / ".env").as_posix()


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = DEFAULT_DB_ASYNC
    DATABASE_URL_SYNC: str = DEFAULT_DB_SYNC

    # JWT
    SECRET_KEY: str = "change-this-to-a-secure-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "https://aces-forum.onrender.com",
        "https://aces.example.com",
    ]

    # App
    APP_NAME: str = "ACES Event Management API"
    DEBUG: bool = False
    API_PREFIX: str = ""

    # Email / SMTP
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    ACES_OFFICIAL_EMAIL: str = ""

    class Config:
        env_file = (ENV_PATH, ".env")
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
