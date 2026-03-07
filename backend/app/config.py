from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/llm_arena"
    llm_api_base_url: str = "https://new-api.muserquantity.cn/v1"
    llm_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Auth – configure via ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET env vars
    admin_username: str = "admin"
    admin_password: str = ""  # REQUIRED: set ADMIN_PASSWORD in .env
    jwt_secret: str = ""  # REQUIRED: set JWT_SECRET in .env
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    @field_validator("admin_password")
    @classmethod
    def validate_admin_password(cls, v: str) -> str:
        if not v:
            raise ValueError("ADMIN_PASSWORD must be set in .env")
        return v

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if not v:
            raise ValueError("JWT_SECRET must be set in .env")
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
