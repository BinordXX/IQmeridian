from pydantic import BaseModel


class CapabilitiesResponse(BaseModel):
    service: str
    version: str
    responsibilities: list[str]
    non_responsibilities: list[str]
    intended_consumers: list[str]
    data_principles: list[str]