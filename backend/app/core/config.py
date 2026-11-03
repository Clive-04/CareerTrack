from typing import Literal

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DATABASE_URL: str

    JWT_SECRET_KEY: SecretStr
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    JWT_ACCESS_TOKEN_MINUTES: int = Field(default=60, ge=5, le=1440)
    JWT_ISSUER: str = "careertrack-api"
    JWT_AUDIENCE: str = "careertrack-web"
    GEMINI_API_KEY: SecretStr = SecretStr("")
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: int = Field(default=120, ge=10, le=180)
    FRONTEND_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,testserver"
    FORCE_HTTPS: bool = False

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, value: SecretStr) -> SecretStr:
        secret = value.get_secret_value()
        if len(secret) < 32:
            raise ValueError("JWT_SECRET_KEY must contain at least 32 characters")
        lowered = secret.lower()
        if "change-this" in lowered or "replace-with" in lowered:
            raise ValueError("Replace the development JWT_SECRET_KEY")
        return value

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.ENVIRONMENT != "production":
            return self

        origins = self.frontend_origins
        if not origins or any(origin.startswith("http://") for origin in origins):
            raise ValueError("Production FRONTEND_ORIGINS must use HTTPS")
        if not self.FORCE_HTTPS:
            raise ValueError("FORCE_HTTPS must be enabled in production")
        if "*" in self.allowed_hosts or all(host in {"localhost", "127.0.0.1", "testserver"} for host in self.allowed_hosts):
            raise ValueError("Production ALLOWED_HOSTS must contain the deployed API hostname")
        return self

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_hosts(self) -> list[str]:
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

settings = Settings()
