from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "lovehate-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = "sqlite+aiosqlite:///./lovehate.db"
    DATABASE_URL_ASYNC: str = ""
    COINS_PER_GOOD: int = 5
    COINS_PER_GRUDGE: int = -3
    GRUDGE_EXPIRE_DAYS: int = 30
    TEMP_BASE_LINE: float = 36.5
    TEMP_PER_GOOD: float = 0.5
    TEMP_PER_GRUDGE: float = -1.0
    REDIS_URL: str = "redis://localhost:6379/0"
    SMS_PROVIDER: str = "mock"
    SMS_ACCESS_KEY: str = ""
    SMS_ACCESS_SECRET: str = ""
    SMS_SIGN_NAME: str = "LoveHate"
    SMS_TEMPLATE_CODE: str = ""

    class Config:
        env_file = ".env"

    def get_async_db_url(self) -> str:
        if self.DATABASE_URL_ASYNC:
            return self.DATABASE_URL_ASYNC
        if self.DATABASE_URL.startswith("postgresql"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        return self.DATABASE_URL


settings = Settings()
