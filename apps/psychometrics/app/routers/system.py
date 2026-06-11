from fastapi import APIRouter

from app.core.config import settings
from app.schemas.capabilities import CapabilitiesResponse
from app.schemas.health import HealthResponse, VersionResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
        environment=settings.environment,
    )


@router.get("/version", response_model=VersionResponse)
def version() -> VersionResponse:
    return VersionResponse(
        service=settings.service_name,
        version=settings.service_version,
    )


@router.get("/capabilities", response_model=CapabilitiesResponse)
def capabilities() -> CapabilitiesResponse:
    return CapabilitiesResponse(
        service=settings.service_name,
        version=settings.service_version,
        responsibilities=[
            "Calculate item difficulty metrics.",
            "Calculate item discrimination metrics.",
            "Analyse omission patterns.",
            "Analyse response-time patterns.",
            "Analyse distractor behaviour.",
            "Analyse score distributions.",
            "Calculate reliability indicators when sample size is sufficient.",
            "Generate psychometric flags for researcher review.",
            "Return structured psychometric outputs to the NestJS API.",
        ],
        non_responsibilities=[
            "Candidate authentication.",
            "Employer authentication.",
            "Campaign creation.",
            "Assessment delivery.",
            "Invitation handling.",
            "Primary scoring during live assessment completion.",
            "Report permission enforcement.",
            "Employer dashboard access control.",
            "Candidate or consumer-facing report delivery.",
            "Direct public access.",
        ],
        intended_consumers=[
            "NestJS internal psychometrics orchestration module.",
            "Platform-admin internal tooling.",
            "Researcher internal tooling.",
        ],
        data_principles=[
            "Use session IDs and participant categories instead of unnecessary personal identifiers.",
            "Analyse assessment behaviour rather than personal identity.",
            "Treat outputs as pilot evidence, not final validation.",
            "Keep automated flags reviewable by researchers.",
            "Preserve form, scoring, and report version traceability.",
        ],
    )