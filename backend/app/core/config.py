from pydantic_settings import BaseSettings
from typing import List, Optional
import json
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse


class Settings(BaseSettings):
    DATABASE_URL: str

    @property
    def async_database_url(self) -> str:
        """Strip params asyncpg doesn't support (sslmode, channel_binding)."""
        parsed = urlparse(self.DATABASE_URL)
        params = parse_qs(parsed.query, keep_blank_values=True)
        params.pop("channel_binding", None)
        params.pop("sslmode", None)
        clean_query = urlencode({k: v[0] for k, v in params.items()})
        return urlunparse(parsed._replace(query=clean_query))
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    CORS_ORIGINS: str = '["http://localhost:3000","https://astemari-ivory.vercel.app"]'

    # SMTP / Email settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Astemari"
    SMTP_FROM_EMAIL: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        val = self.CORS_ORIGINS.strip()
        if not val:
            return ["http://localhost:3000"]
        # Support both JSON array and comma-separated strings
        if val.startswith("["):
            return json.loads(val)
        return [v.strip() for v in val.split(",") if v.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
