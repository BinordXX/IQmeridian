from fastapi import FastAPI

from app.core.config import settings
from app.routers.scoring import router as scoring_router
from app.routers.system import router as system_router


app = FastAPI(
    title="IQMeridian Psychometrics Service",
    version=settings.service_version,
    description=(
        "Internal psychometric analysis service for IQMeridian assessment data. "
        "This service is not intended for public user access."
    ),
)

app.include_router(system_router)
app.include_router(scoring_router)