from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Campus360 API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./campus360.db"
    jwt_secret: str = "development-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    backend_cors_origins: str = "http://localhost:3000"

    # Configurable overdue thresholds in hours
    overdue_hours_critical: int = 4
    overdue_hours_high: int = 24
    overdue_hours_medium: int = 72
    overdue_hours_low: int = 168

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.backend_cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
