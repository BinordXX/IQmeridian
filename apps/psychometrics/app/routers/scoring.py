from __future__ import annotations

from fastapi import APIRouter

from app.schemas.scoring import ScoringRequest, ScoringResponse
from app.services.baseline_scoring import build_baseline_scoring_response


router = APIRouter(prefix="/v1/scoring", tags=["scoring"])


@router.post("/score-session", response_model=ScoringResponse)
def score_session(request: ScoringRequest) -> ScoringResponse:
    return build_baseline_scoring_response(request)