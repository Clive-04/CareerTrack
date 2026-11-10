from typing import Literal

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DATABASE_URL: str
    DB_ECHO: bool = False

    JWT_SECRET_KEY: SecretStr
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    JWT_ACCESS_TOKEN_MINUTES: int = Field(default=60, ge=5, le=1440)
    JWT_ISSUER: str = "careertrack-api"
    JWT_AUDIENCE: str = "careertrack-web"
    AUTH_COOKIE_NAME: str = "careertrack_session"
    CSRF_COOKIE_NAME: str = "careertrack_csrf"
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    AUTH_COOKIE_DOMAIN: str = ""
    GEMINI_API_KEY: SecretStr = SecretStr("")
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: int = Field(default=120, ge=10, le=180)
    FRONTEND_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,testserver"
    FORCE_HTTPS: bool = False
    MAX_REQUEST_BYTES: int = Field(default=11 * 1024 * 1024, ge=1024, le=25 * 1024 * 1024)
    RESUME_STORAGE_BACKEND: Literal["local", "s3"] = "local"
    S3_ENDPOINT_URL: str = ""
    S3_REGION: str = ""
    S3_ACCESS_KEY_ID: SecretStr = SecretStr("")
    S3_SECRET_ACCESS_KEY: SecretStr = SecretStr("")
    S3_BUCKET: str = ""

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
        if self.AUTH_COOKIE_SAMESITE == "none" and not self.AUTH_COOKIE_SECURE:
            raise ValueError("SameSite=None cookies must be secure")
        if self.ENVIRONMENT != "production":
            self._validate_resume_storage()
            return self

        origins = self.frontend_origins
        if not origins or any(origin.startswith("http://") for origin in origins):
            raise ValueError("Production FRONTEND_ORIGINS must use HTTPS")
        if not self.FORCE_HTTPS:
            raise ValueError("FORCE_HTTPS must be enabled in production")
        if not self.AUTH_COOKIE_SECURE:
            raise ValueError("AUTH_COOKIE_SECURE must be enabled in production")
        if "*" in self.allowed_hosts or all(host in {"localhost", "127.0.0.1", "testserver"} for host in self.allowed_hosts):
            raise ValueError("Production ALLOWED_HOSTS must contain the deployed API hostname")
        self._validate_resume_storage()
        return self

    def _validate_resume_storage(self) -> None:
        if self.RESUME_STORAGE_BACKEND != "s3":
            return
        values = {
            "S3_ENDPOINT_URL": self.S3_ENDPOINT_URL,
            "S3_REGION": self.S3_REGION,
            "S3_ACCESS_KEY_ID": self.S3_ACCESS_KEY_ID.get_secret_value(),
            "S3_SECRET_ACCESS_KEY": self.S3_SECRET_ACCESS_KEY.get_secret_value(),
            "S3_BUCKET": self.S3_BUCKET,
        }
        missing = [name for name, value in values.items() if not value.strip()]
        if missing:
            raise ValueError(f"S3 resume storage requires: {', '.join(missing)}")
        if not self.S3_ENDPOINT_URL.startswith("https://"):
            raise ValueError("S3_ENDPOINT_URL must use HTTPS")

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
