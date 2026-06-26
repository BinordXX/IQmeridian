from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from datetime import UTC, datetime
from statistics import median

from app.schemas.scoring import (
    CONTRACT_VERSION,
    ConfidenceInterval90,
    DomainScore,
    OverallScore,
    ScoreAuditTrace,
    ScoringMode,
    ScoringRequest,
    ScoringResponse,
    TimingProfile,
    ValidityFlag,
)


RAPID_GUESSING_THRESHOLD_MS = 3_000
MIN_RESPONSE_TIME_COVERAGE = 0.7


def build_baseline_scoring_response(request: ScoringRequest) -> ScoringResponse:
    items_by_id = {item.item_id: item for item in request.items}
    latest_responses = {
        response.item_id: response
        for response in request.responses
        if response.item_id in items_by_id
    }

    max_raw_score = sum(item.max_score for item in request.items)
    raw_score = sum(response.raw_score for response in latest_responses.values())

    accuracy = _safe_divide(raw_score, max_raw_score)

    domain_scores = _build_domain_scores(request, latest_responses)
    timing_profile = _build_timing_profile(request, accuracy)
    validity_flags = _build_validity_flags(request, timing_profile, latest_responses)

    scoring_status = _resolve_scoring_status(
        request=request,
        max_raw_score=max_raw_score,
        validity_flags=validity_flags,
        latest_response_count=len(latest_responses),
    )

    warnings: list[str] = []

    if request.requested_scoring_mode != "BASELINE_CLASSICAL":
        warnings.append(
            "Requested scoring mode was downgraded to BASELINE_CLASSICAL. "
            "Advanced IRT and multidimensional scoring are not active in v1."
        )

    if scoring_status != "SCORED":
        warnings.append(
            "Baseline score is partial or limited because the submitted session "
            "does not contain a complete, fully valid response set."
        )

    return ScoringResponse(
        contractVersion=CONTRACT_VERSION,
        sessionId=request.session.session_id,
        scoringStatus=scoring_status,
        overall=OverallScore(
            domain="OVERALL",
            label="Overall cognitive profile",
            rawScore=raw_score,
            maxRawScore=max_raw_score,
            accuracy=accuracy,
            theta=None,
            standardScore=None,
            percentile=None,
            scoreBand=_score_band_from_accuracy(accuracy),
            testInformation=None,
            standardError=None,
            confidenceInterval90=ConfidenceInterval90(lower=None, upper=None),
            reliability=None,
            interpretation=_overall_interpretation(accuracy, scoring_status),
        ),
        domains=domain_scores,
        timingProfile=timing_profile,
        validityFlags=validity_flags,
        audit=ScoreAuditTrace(
            modelVersion="baseline-classical.0.1.0",
            contractVersion=CONTRACT_VERSION,
            calibrationVersion=None,
            scoringModeUsed="BASELINE_CLASSICAL",
            generatedAt=datetime.now(UTC),
            inputHash=_hash_request(request),
            warnings=warnings,
        ),
    )


def _build_domain_scores(
    request: ScoringRequest,
    latest_responses: dict[str, object],
) -> list[DomainScore]:
    domain_labels = {
        domain.domain: domain.label for domain in request.assessment.domains
    }

    domain_max_scores: dict[str, float] = defaultdict(float)
    domain_raw_scores: dict[str, float] = defaultdict(float)

    for item in request.items:
        domain_max_scores[item.domain] += item.max_score

    for response in latest_responses.values():
        item = next(
            (
                presented_item
                for presented_item in request.items
                if presented_item.item_id == response.item_id
            ),
            None,
        )

        if item is None:
            continue

        domain_raw_scores[item.domain] += response.raw_score

    all_domains = sorted(set(domain_labels) | set(domain_max_scores))

    return [
        DomainScore(
            domain=domain,
            label=domain_labels.get(domain, domain),
            rawScore=domain_raw_scores.get(domain, 0.0),
            maxRawScore=domain_max_scores.get(domain, 0.0),
            accuracy=_safe_divide(
                domain_raw_scores.get(domain, 0.0),
                domain_max_scores.get(domain, 0.0),
            ),
            theta=None,
            standardScore=None,
            percentile=None,
            scoreBand=_score_band_from_accuracy(
                _safe_divide(
                    domain_raw_scores.get(domain, 0.0),
                    domain_max_scores.get(domain, 0.0),
                )
            ),
            standardError=None,
            confidenceInterval90=ConfidenceInterval90(lower=None, upper=None),
            reliability=None,
            testInformation=None,
            interpretation=_domain_interpretation(
                label=domain_labels.get(domain, domain),
                accuracy=_safe_divide(
                    domain_raw_scores.get(domain, 0.0),
                    domain_max_scores.get(domain, 0.0),
                ),
            ),
        )
        for domain in all_domains
    ]


def _build_timing_profile(
    request: ScoringRequest,
    accuracy: float | None,
) -> TimingProfile:
    response_times = [
        response.response_time_ms
        for response in request.responses
        if response.response_time_ms is not None and response.response_time_ms >= 0
    ]

    total_response_time_ms = request.validity_input.total_response_time_ms

    if total_response_time_ms is None and response_times:
        total_response_time_ms = sum(response_times)

    median_response_time_ms = request.validity_input.median_response_time_ms

    if median_response_time_ms is None and response_times:
        median_response_time_ms = int(median(response_times))

    expected_duration_ms = None
    if request.assessment.expected_duration_seconds is not None:
        expected_duration_ms = request.assessment.expected_duration_seconds * 1_000

    speed_index = None
    if (
        expected_duration_ms is not None
        and total_response_time_ms is not None
        and total_response_time_ms > 0
    ):
        speed_index = expected_duration_ms / total_response_time_ms

    calculated_rapid_guessing_rate = _calculate_rapid_guessing_rate(request)
    rapid_guessing_rate = max(
        request.validity_input.rapid_guessing_rate,
        calculated_rapid_guessing_rate,
    )

    calculated_omission_rate = _calculate_omission_rate(request)
    omission_rate = max(request.validity_input.omission_rate, calculated_omission_rate)

    return TimingProfile(
        totalResponseTimeMs=total_response_time_ms,
        medianResponseTimeMs=median_response_time_ms,
        speedIndex=speed_index,
        speedAccuracyTradeoff=_speed_accuracy_tradeoff(
            speed_index=speed_index,
            accuracy=accuracy,
            rapid_guessing_rate=rapid_guessing_rate,
        ),
        rapidGuessingRate=rapid_guessing_rate,
        omissionRate=omission_rate,
    )


def _build_validity_flags(
    request: ScoringRequest,
    timing_profile: TimingProfile,
    latest_responses: dict[str, object],
) -> list[ValidityFlag]:
    flags: list[ValidityFlag] = []

    if not request.items:
        flags.append(
            ValidityFlag(
                code="NO_PRESENTED_ITEMS",
                label="No presented items",
                severity="HIGH",
                description=(
                    "The scoring request contains no presented items, so a "
                    "meaningful score cannot be computed."
                ),
                evidence={"itemCount": 0},
            )
        )

    if len(latest_responses) < len(request.items):
        flags.append(
            ValidityFlag(
                code="INCOMPLETE_RESPONSE_SET",
                label="Incomplete response set",
                severity="MEDIUM",
                description=(
                    "The number of usable responses is lower than the number "
                    "of presented items."
                ),
                evidence={
                    "presentedItems": len(request.items),
                    "usableResponses": len(latest_responses),
                },
            )
        )

    if timing_profile.omission_rate >= 0.3:
        flags.append(
            ValidityFlag(
                code="HIGH_OMISSION_RATE",
                label="High omission rate",
                severity="HIGH",
                description=(
                    "A large proportion of presented items were omitted, "
                    "skipped, timed out, or left without usable responses."
                ),
                evidence={"omissionRate": timing_profile.omission_rate},
            )
        )
    elif timing_profile.omission_rate >= 0.1:
        flags.append(
            ValidityFlag(
                code="ELEVATED_OMISSION_RATE",
                label="Elevated omission rate",
                severity="MEDIUM",
                description=(
                    "The session contains a moderate level of omitted or "
                    "unanswered items."
                ),
                evidence={"omissionRate": timing_profile.omission_rate},
            )
        )

    if timing_profile.rapid_guessing_rate >= 0.25:
        flags.append(
            ValidityFlag(
                code="RAPID_GUESSING_ELEVATED",
                label="Elevated rapid guessing",
                severity="HIGH",
                description=(
                    "A substantial proportion of responses were submitted below "
                    "the baseline rapid-guessing threshold."
                ),
                evidence={
                    "rapidGuessingRate": timing_profile.rapid_guessing_rate,
                    "thresholdMs": RAPID_GUESSING_THRESHOLD_MS,
                },
            )
        )
    elif timing_profile.rapid_guessing_rate >= 0.1:
        flags.append(
            ValidityFlag(
                code="RAPID_GUESSING_PRESENT",
                label="Rapid guessing present",
                severity="MEDIUM",
                description=(
                    "Some responses were submitted unusually quickly for a "
                    "cognitive assessment context."
                ),
                evidence={
                    "rapidGuessingRate": timing_profile.rapid_guessing_rate,
                    "thresholdMs": RAPID_GUESSING_THRESHOLD_MS,
                },
            )
        )

    response_time_coverage = _response_time_coverage(request)
    if request.responses and response_time_coverage < MIN_RESPONSE_TIME_COVERAGE:
        flags.append(
            ValidityFlag(
                code="LOW_RESPONSE_TIME_COVERAGE",
                label="Low response-time coverage",
                severity="LOW",
                description=(
                    "Response-time data is missing for a meaningful proportion "
                    "of submitted responses."
                ),
                evidence={"responseTimeCoverage": response_time_coverage},
            )
        )

    for suspicious_flag in request.validity_input.suspicious_session_flags:
        flags.append(
            ValidityFlag(
                code="UPSTREAM_SUSPICIOUS_SESSION_FLAG",
                label="Upstream suspicious-session flag",
                severity="MEDIUM",
                description=(
                    "The platform supplied a suspicious-session flag generated "
                    "before psychometric scoring."
                ),
                evidence={"flag": suspicious_flag},
            )
        )

    return flags


def _resolve_scoring_status(
    request: ScoringRequest,
    max_raw_score: float,
    validity_flags: list[ValidityFlag],
    latest_response_count: int,
) -> str:
    if max_raw_score <= 0 or not request.items:
        return "INSUFFICIENT_DATA"

    high_severity_codes = {
        flag.code for flag in validity_flags if flag.severity == "HIGH"
    }

    if "NO_PRESENTED_ITEMS" in high_severity_codes:
        return "INSUFFICIENT_DATA"

    if latest_response_count < len(request.items) or high_severity_codes:
        return "PARTIAL"

    return "SCORED"


def _score_band_from_accuracy(accuracy: float | None) -> str:
    if accuracy is None:
        return "UNAVAILABLE"

    if accuracy < 0.2:
        return "VERY_LOW"
    if accuracy < 0.35:
        return "LOW"
    if accuracy < 0.5:
        return "LOW_AVERAGE"
    if accuracy < 0.7:
        return "AVERAGE"
    if accuracy < 0.85:
        return "HIGH_AVERAGE"
    if accuracy < 0.95:
        return "HIGH"

    return "VERY_HIGH"


def _overall_interpretation(accuracy: float | None, scoring_status: str) -> str:
    if accuracy is None:
        return (
            "A baseline score could not be interpreted because the request did "
            "not contain scorable item data."
        )

    if scoring_status == "PARTIAL":
        return (
            "This is a deterministic baseline profile. Interpretation is limited "
            "because the response set or validity signals indicate partial "
            "scoring conditions."
        )

    return (
        "This is a deterministic baseline profile based on raw score, presented "
        "item coverage, domain accuracy, response timing, omissions, and basic "
        "validity checks. Advanced IRT, norming, and multidimensional estimates "
        "are not yet active."
    )


def _domain_interpretation(label: str, accuracy: float | None) -> str:
    if accuracy is None:
        return f"{label} could not be interpreted because no scorable item data was available."

    return (
        f"{label} baseline performance is represented as domain accuracy only. "
        "Advanced calibrated domain estimates will be added in later scoring versions."
    )


def _calculate_omission_rate(request: ScoringRequest) -> float:
    if not request.items:
        return 0.0

    responses_by_item = {response.item_id: response for response in request.responses}

    omitted_count = 0
    for item in request.items:
        response = responses_by_item.get(item.item_id)

        if response is None:
            omitted_count += 1
            continue

        if response.status in {"OMITTED", "SKIPPED", "TIMED_OUT", "NOT_PRESENTED"}:
            omitted_count += 1

    return omitted_count / len(request.items)


def _calculate_rapid_guessing_rate(request: ScoringRequest) -> float:
    if not request.items:
        return 0.0

    rapid_count = 0
    for response in request.responses:
        if response.response_time_ms is None:
            continue

        if response.response_time_ms < RAPID_GUESSING_THRESHOLD_MS:
            rapid_count += 1

    return rapid_count / len(request.items)


def _response_time_coverage(request: ScoringRequest) -> float:
    if not request.responses:
        return 0.0

    responses_with_time = sum(
        1
        for response in request.responses
        if response.response_time_ms is not None and response.response_time_ms >= 0
    )

    return responses_with_time / len(request.responses)


def _speed_accuracy_tradeoff(
    speed_index: float | None,
    accuracy: float | None,
    rapid_guessing_rate: float,
) -> str | None:
    if speed_index is None or accuracy is None:
        return None

    if rapid_guessing_rate >= 0.25 and accuracy < 0.5:
        return "RAPID_LOW_ACCURACY"

    if speed_index >= 1.5 and accuracy >= 0.7:
        return "FAST_ACCURATE"

    if speed_index >= 1.5 and accuracy < 0.7:
        return "FAST_ERROR_PRONE"

    if speed_index <= 0.65 and accuracy >= 0.7:
        return "SLOW_ACCURATE"

    if speed_index <= 0.65 and accuracy < 0.7:
        return "SLOW_LOW_ACCURACY"

    return "BALANCED"


def _safe_divide(numerator: float, denominator: float) -> float | None:
    if denominator <= 0:
        return None

    return numerator / denominator


def _hash_request(request: ScoringRequest) -> str:
    payload = request.model_dump(mode="json", by_alias=True)
    serialized_payload = json.dumps(payload, sort_keys=True, separators=(",", ":"))

    return hashlib.sha256(serialized_payload.encode("utf-8")).hexdigest()