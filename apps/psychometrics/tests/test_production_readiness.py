
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import app


client = TestClient(app)


def test_liveness_endpoint_is_accessible_without_token():
    response = client.get("/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_existing_health_endpoint_remains_protected():
    response = client.get("/health")

    assert response.status_code == 401


def test_production_rejects_development_credentials():
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            environment="production",
            internal_service_token="dev-psychometrics-token",
            internal_api_url="http://localhost:3001",
        )


def test_production_accepts_secure_service_configuration():
    configuration = Settings(
        _env_file=None,
        environment="production",
        internal_service_token="a" * 64,
        internal_api_url="http://api.internal:3001",
    )

    assert configuration.is_production is True
