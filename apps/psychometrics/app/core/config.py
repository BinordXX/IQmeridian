from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "IQMeridian Psychometrics Service"
    service_version: str = "0.1.0"
    environment: str = "development"
    internal_service_token: str = "dev-psychometrics-token"

    model_config = SettingsConfigDict(
        env_prefix="PSYCHOMETRICS_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()