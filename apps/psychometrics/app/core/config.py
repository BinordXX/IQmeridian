from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "IQMeridian Psychometrics Service"
    service_version: str = "0.1.0"
    environment: str = "development"
    port: int = 8001
    internal_service_token: str = "dev-psychometrics-token"

    data_access_mode: str = "nestjs_orchestrated"
    internal_api_url: str = "http://localhost:3001"
    output_mode: str = "return_to_nestjs"

    model_config = SettingsConfigDict(
        env_prefix="PSYCHOMETRICS_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()