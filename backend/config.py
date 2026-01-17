from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, computed_field
from typing import List
import os

class Settings(BaseSettings):
    # Database configuration
    DATABASE_URL: str = "sqlite:///./nexchamps.db"

    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = ["http://localhost", "http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()