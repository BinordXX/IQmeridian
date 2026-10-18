
from urllib.parse import urlsplit

from pydantic import model_validator
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

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() in {
            "production",
            "prod",
        }

    @model_validator(mode="after")
    def validate_production_configuration(self) -> "Settings":
        if not self.is_production:
            return self

        token = self.internal_service_token.strip()

        if (
            len(token) < 32
            or token == "dev-psychometrics-token"
        ):
            raise ValueError(
                "Production requires a secure "
                "PSYCHOMETRICS_INTERNAL_SERVICE_TOKEN "
                "of at least 32 characters."
            )

        api_url = self.internal_api_url.strip()

        try:
            parsed = urlsplit(api_url)
            hostname = (parsed.hostname or "").lower().rstrip(".")
        except ValueError as exc:
            raise ValueError(
                "Invalid production psychometrics internal API URL."
            ) from exc

        forbidden_hosts = {
            "",
            "localhost",
            "127.0.0.1",
            "::1",
            "0.0.0.0",
        }

        if (
            parsed.scheme not in {"http", "https"}
            or hostname in forbidden_hosts
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise ValueError(
                "Production requires a valid, non-localhost "
                "PSYCHOMETRICS_INTERNAL_API_URL."
            )

        return self


settings = Settings()
