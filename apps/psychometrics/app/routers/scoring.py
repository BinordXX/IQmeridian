from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.scoring import (
    CONTRACT_VERSION,
    ConfidenceInterval90,
    DomainScore,
    OverallScore,
    ScoreAuditTrace,
    ScoringRequest,
    ScoringResponse,
    TimingProfile,
)


router = APIRouter(prefix="/v1/scoring", tags=["scoring"])


@router.post("/score-session", response_model=ScoringResponse)
def score_session_contract_probe(request: ScoringRequest) -> ScoringResponse:
    max_raw_score = sum(item.max_score for item in request.items)
    raw_score = sum(response.raw_score for response in request.responses)

    accuracy = None
    if max_raw_score > 0:
        accuracy = raw_score / max_raw_score

    domain_max_scores: dict[str, float] = {}
    domain_raw_scores: dict[str, float] = {}
    domain_labels: dict[str, str] = {}

    for domain in request.assessment.domains:
        domain_labels[domain.domain] = domain.label

    for item in request.items:
        domain_max_scores[item.domain] = domain_max_scores.get(item.domain, 0.0) + item.max_score

    for response in request.responses:
        matched_item = next(
            (item for item in request.items if item.item_id == response.item_id),
            None,
        )

        if matched_item is None:
            continue

        domain_raw_scores[matched_item.domain] = (
            domain_raw_scores.get(matched_item.domain, 0.0) + response.raw_score
        )

    domains: list[DomainScore] = []
    for domain, max_score in domain_max_scores.items():
        domain_raw = domain_raw_scores.get(domain, 0.0)
        domain_accuracy = domain_raw / max_score if max_score > 0 else None

        domains.append(
            DomainScore(
                domain=domain,
                label=domain_labels.get(domain, domain),
                rawScore=domain_raw,
                maxRawScore=max_score,
                accuracy=domain_accuracy,
                theta=None,
                standardScore=None,
                percentile=None,
                scoreBand="UNAVAILABLE",
                standardError=None,
                confidenceInterval90=ConfidenceInterval90(lower=None, upper=None),
                reliability=None,
                interpretation=(
                    "Contract probe only. Advanced psychometric scoring has not "
                    "been applied yet."
                ),
            )
        )

    return ScoringResponse(
        contractVersion=CONTRACT_VERSION,
        sessionId=request.session.session_id,
        scoringStatus="PARTIAL",
        overall=OverallScore(
            domain="OVERALL",
            label="Overall cognitive profile",
            rawScore=raw_score,
            maxRawScore=max_raw_score,
            accuracy=accuracy,
            theta=None,
            standardScore=None,
            percentile=None,
            scoreBand="UNAVAILABLE",
            standardError=None,
            confidenceInterval90=ConfidenceInterval90(lower=None, upper=None),
            reliability=None,
            interpretation=(
                "Contract probe only. This response validates request/response "
                "shape before the advanced scoring engine is wired."
            ),
        ),
        domains=domains,
        timingProfile=TimingProfile(
            totalResponseTimeMs=request.validity_input.total_response_time_ms,
            medianResponseTimeMs=request.validity_input.median_response_time_ms,
            speedIndex=None,
            speedAccuracyTradeoff=None,
            rapidGuessingRate=request.validity_input.rapid_guessing_rate,
            omissionRate=request.validity_input.omission_rate,
        ),
        validityFlags=[],
        audit=ScoreAuditTrace(
            modelVersion="contract-probe.0.1.0",
            contractVersion=CONTRACT_VERSION,
            calibrationVersion=None,
            scoringModeUsed=request.requested_scoring_mode,
            generatedAt=datetime.now(UTC),
            inputHash=None,
            warnings=[
                "This endpoint validates the scoring contract only.",
                "Do not use this output as a production cognitive score.",
            ],
        ),
    )