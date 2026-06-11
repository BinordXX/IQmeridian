from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

AUTH_HEADERS = {"x-internal-service-token": "dev-psychometrics-token"}


def test_health_endpoint_returns_ok_with_internal_token() -> None:
    response = client.get("/health", headers=AUTH_HEADERS)

    assert response.status_code == 200
    payload = response.json()

    assert payload["status"] == "ok"
    assert payload["service"] == "IQMeridian Psychometrics Service"
    assert payload["version"] == "0.1.0"
    assert payload["environment"] == "development"


def test_version_endpoint_returns_service_version_with_internal_token() -> None:
    response = client.get("/version", headers=AUTH_HEADERS)

    assert response.status_code == 200
    payload = response.json()

    assert payload["service"] == "IQMeridian Psychometrics Service"
    assert payload["version"] == "0.1.0"


def test_capabilities_endpoint_defines_service_boundary_with_internal_token() -> None:
    response = client.get("/capabilities", headers=AUTH_HEADERS)

    assert response.status_code == 200
    payload = response.json()

    assert payload["service"] == "IQMeridian Psychometrics Service"

    assert "Calculate item difficulty metrics." in payload["responsibilities"]
    assert "Analyse response-time patterns." in payload["responsibilities"]
    assert "Generate psychometric flags for researcher review." in payload["responsibilities"]

    assert "Candidate authentication." in payload["non_responsibilities"]
    assert "Assessment delivery." in payload["non_responsibilities"]
    assert "Direct public access." in payload["non_responsibilities"]

    assert "NestJS internal psychometrics orchestration module." in payload["intended_consumers"]


def test_health_endpoint_rejects_missing_internal_token() -> None:
    response = client.get("/health")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing internal service token."


def test_health_endpoint_rejects_invalid_internal_token() -> None:
    response = client.get(
        "/health",
        headers={"x-internal-service-token": "wrong-token"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid internal service token."