"""
config.py — Konfigurasi aplikasi Topshop Kosmetik AI
Menggunakan Pydantic Settings v2 untuk manajemen environment variable
"""
from typing import List
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Kelas konfigurasi utama aplikasi.
    Semua nilai dibaca dari environment variable atau file .env.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # -------------------------------------------------------
    # Informasi Aplikasi
    # -------------------------------------------------------
    APP_NAME: str = "Topshop Kosmetik AI"
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    # -------------------------------------------------------
    # Database PostgreSQL
    # -------------------------------------------------------
    DATABASE_URL: str = (
        "postgresql+asyncpg://topshop:topshop_secret@localhost:5432/topshop_db"
    )

    # -------------------------------------------------------
    # JWT Authentication
    # -------------------------------------------------------
    JWT_SECRET_KEY: str = "change-this-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # -------------------------------------------------------
    # AI Provider
    # Pilihan: "alibaba" | "local"
    # -------------------------------------------------------
    AI_PROVIDER: str = "alibaba"
    ALIBABA_CLOUD_API_KEY: str = ""
    ALIBABA_CLOUD_BASE_URL: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    QWEN_MODEL: str = "qwen-plus"

    # -------------------------------------------------------
    # Google OAuth
    # -------------------------------------------------------
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # -------------------------------------------------------
    # SMTP Email
    # -------------------------------------------------------
    SMTP_HOST: str = "smtp.titan.email"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "mail@topshopbeauty.cloud"
    SMTP_FROM_NAME: str = "Topshop Kosmetik"

    # -------------------------------------------------------
    # Payment Gateway — Mayar
    # -------------------------------------------------------
    MAYAR_API_KEY: str = ""
    MAYAR_WEBHOOK_SECRET: str = ""

    # -------------------------------------------------------
    # Shipping — Biteship
    # -------------------------------------------------------
    BITESHIP_API_KEY: str = ""

    # -------------------------------------------------------
    # CORS
    # -------------------------------------------------------
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str) -> str:
        """Validator untuk memastikan ALLOWED_ORIGINS valid."""
        return v

    def get_allowed_origins_list(self) -> List[str]:
        """Kembalikan daftar origin yang diizinkan sebagai list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        """Cek apakah aplikasi berjalan dalam mode development."""
        return self.APP_ENV.lower() == "development"

    @property
    def is_production(self) -> bool:
        """Cek apakah aplikasi berjalan dalam mode production."""
        return self.APP_ENV.lower() == "production"


# Instance singleton settings — digunakan di seluruh aplikasi
settings = Settings()
