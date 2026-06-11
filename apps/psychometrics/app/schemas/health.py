from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class VersionResponse(BaseModel):
    service: str
    version: str