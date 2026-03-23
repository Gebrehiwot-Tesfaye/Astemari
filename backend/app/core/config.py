from pydantic_settings import BaseSettings
from typing import List, Optional
import json


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    CORS_ORIGINS: str = '["http://localhost:3000"]'

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
