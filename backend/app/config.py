from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://ikea:devpassword@localhost:5432/ikea_monitor"
    sendgrid_api_key: str = ""
    from_email: str = ""
    to_email: str = ""
    scraper_cron: str = "0 8 * * *"
    request_delay_seconds: int = 3
    expo_access_token: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
