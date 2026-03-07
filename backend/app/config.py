from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/llm_arena"
    llm_api_base_url: str = "https://new-api.muserquantity.cn/v1"
    llm_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
