from __future__ import annotations

import math
from typing import Any


IQ_SCALE_MEAN = 100
IQ_SCALE_SD = 15
CONFIDENCE_Z_90 = 1.6448536269514722

SCORING_ENGINE_VERSION = "iqmeridian-cognitive-intelligence-engine.0.1.0"
SCORING_MODEL_FAMILY = "HYBRID_PSYCHOMETRIC"
BASELINE_SCORING_MODEL_VERSION = "hybrid-psychometric-iq.0.1.0"
IRT_SCORING_MODEL_VERSION = "irt-provisional.0.2.0"
FEATURE_SET_VERSION = "iqmeridian-feature-set.0.1.0"

DEFAULT_SCORING_SIGNALS_USED = [
    "total_raw_score",
    "total_possible_score",
    "overall_accuracy",
    "correct_response_count",
    "incorrect_response_count",
    "partial_response_count",
    "omitted_response_count",
    "skipped_response_count",
    "timed_out_response_count",
    "not_presented_response_count",
    "answered_item_count",
    "attempted_item_ratio",
    "completion_status",
    "assessment_source",
    "assessment_version",
    "form_blueprint_version",
    "domain_count",
    "domain_raw_scores",
    "domain_max_scores",
    "domain_accuracy_scores",
    "highest_domain_accuracy",
    "lowest_domain_accuracy",
    "domain_accuracy_spread",
    "domain_balance_index",
    "item_count",
    "section_count",
    "item_family_metadata_available",
    "subdomain_metadata_available",
    "calibrated_item_count",
    "calibrated_item_ratio",
    "mean_item_difficulty",
    "mean_item_discrimination",
    "mean_guessing_parameter",
    "mean_slipping_parameter",
    "mean_time_intensity",
    "calibration_sample_size_available_count",
    "calibration_version",
    "total_response_time_ms",
    "median_response_time_ms",
    "mean_response_time_ms",
    "minimum_response_time_ms",
    "maximum_response_time_ms",
    "response_time_spread_ms",
    "response_time_coverage",
    "speed_index",
    "speed_accuracy_tradeoff",
    "rapid_guessing_rate",
    "first_interaction_time_available_count",
    "mean_first_interaction_time_ms",
    "revision_count_total",
    "revision_count_mean",
    "confidence_rating_available_count",
    "mean_confidence_rating",
    "omission_rate",
    "upstream_omission_rate",
    "upstream_rapid_guessing_rate",
    "suspicious_session_flag_count",
    "browser_or_device_signal_count",
    "visibility_loss_event_count",
    "validity_flag_count",
    "high_severity_validity_flag_count",
    "medium_severity_validity_flag_count",
    "low_severity_validity_flag_count",
    "theta_estimate",
    "iq_score",
    "iq_percentile",
    "standard_error",
    "confidence_interval_90",
    "test_information",
    "reliability",
    "leaderboard_eligibility",
    "model_version",
    "feature_set_version",
]


def estimate_theta_from_accuracy(
    *,
    accuracy: float | None,
    timing_profile: Any,
    validity_flags: list[Any],
    domain_accuracy_spread: float | None = None,
) -> float | None:
    if accuracy is None:
        return None

    clipped_accuracy = _clamp(accuracy, 0.02, 0.98)
    base_theta = math.log(clipped_accuracy / (1 - clipped_accuracy)) / 1.702

    omission_rate = float(getattr(timing_profile, "omission_rate", 0.0) or 0.0)
    rapid_guessing_rate = float(
        getattr(timing_profile, "rapid_guessing_rate", 0.0) or 0.0
    )
    speed_accuracy_tradeoff = getattr(timing_profile, "speed_accuracy_tradeoff", None)

    omission_penalty = omission_rate * 0.85
    rapid_guessing_penalty = rapid_guessing_rate * 0.7
    validity_penalty = _validity_penalty(validity_flags)
    spread_penalty = (domain_accuracy_spread or 0.0) * 0.25
    speed_adjustment = _speed_adjustment(speed_accuracy_tradeoff, accuracy)

    theta = (
        base_theta
        - omission_penalty
        - rapid_guessing_penalty
        - validity_penalty
        - spread_penalty
        + speed_adjustment
    )

    return round(_clamp(theta, -4.0, 4.0), 3)


def theta_to_iq_score(theta: float | None) -> float | None:
    if theta is None:
        return None

    return round(IQ_SCALE_MEAN + (IQ_SCALE_SD * theta), 1)


def percentile_from_theta(theta: float | None) -> float | None:
    if theta is None:
        return None

    percentile = 100 * (0.5 * (1 + math.erf(theta / math.sqrt(2))))

    return round(_clamp(percentile, 0.1, 99.9), 1)


def estimate_test_information(
    *,
    item_count: int,
    accuracy: float | None,
    validity_flags: list[Any],
) -> float | None:
    if item_count <= 0 or accuracy is None:
        return None

    clipped_accuracy = _clamp(accuracy, 0.05, 0.95)
    variance_factor = max(clipped_accuracy * (1 - clipped_accuracy), 0.05) / 0.25
    validity_factor = 1 - min(_validity_penalty(validity_flags), 0.65)
    information = item_count * 0.35 * variance_factor * validity_factor

    return round(max(information, 0.01), 3)


def standard_error_from_test_information(
    test_information: float | None,
) -> float | None:
    if test_information is None or test_information <= 0:
        return None

    return round(1 / math.sqrt(test_information), 3)


def reliability_from_test_information(test_information: float | None) -> float | None:
    if test_information is None or test_information <= 0:
        return None

    return round(test_information / (test_information + 1), 3)


def theta_confidence_interval_90(
    *,
    theta: float | None,
    standard_error: float | None,
) -> tuple[float | None, float | None]:
    if theta is None or standard_error is None:
        return (None, None)

    return (
        round(theta - (CONFIDENCE_Z_90 * standard_error), 3),
        round(theta + (CONFIDENCE_Z_90 * standard_error), 3),
    )


def iq_confidence_interval_90_from_theta_interval(
    lower: float | None,
    upper: float | None,
) -> tuple[float | None, float | None]:
    return (theta_to_iq_score(lower), theta_to_iq_score(upper))


def score_band_from_standard_score(standard_score: float | None) -> str:
    if standard_score is None:
        return "UNAVAILABLE"

    if standard_score < 70:
        return "VERY_LOW"
    if standard_score < 80:
        return "LOW"
    if standard_score < 90:
        return "LOW_AVERAGE"
    if standard_score < 110:
        return "AVERAGE"
    if standard_score < 120:
        return "HIGH_AVERAGE"
    if standard_score < 130:
        return "HIGH"

    return "VERY_HIGH"


def domain_accuracy_spread_from_scores(domains: list[Any]) -> float | None:
    accuracies = [
        float(domain.accuracy)
        for domain in domains
        if getattr(domain, "accuracy", None) is not None
    ]

    if len(accuracies) < 2:
        return None

    return round(max(accuracies) - min(accuracies), 4)


def build_feature_vector(
    *,
    request: Any,
    timing_profile: Any,
    validity_flags: list[Any],
    raw_score: float,
    max_raw_score: float,
    accuracy: float | None,
    theta: float | None,
    standard_score: float | None,
    percentile: float | None,
    domains: list[Any],
) -> dict[str, str | int | float | bool | None]:
    responses = list(request.responses)
    items = list(request.items)

    response_times = [
        response.response_time_ms
        for response in responses
        if response.response_time_ms is not None and response.response_time_ms >= 0
    ]

    first_interaction_times = [
        response.first_interaction_time_ms
        for response in responses
        if response.first_interaction_time_ms is not None
        and response.first_interaction_time_ms >= 0
    ]

    confidence_ratings = [
        response.confidence_rating
        for response in responses
        if response.confidence_rating is not None
    ]

    difficulties = [
        item.calibration.difficulty
        for item in items
        if item.calibration.difficulty is not None
    ]
    discriminations = [
        item.calibration.discrimination
        for item in items
        if item.calibration.discrimination is not None
    ]
    guessing_values = [
        item.calibration.guessing
        for item in items
        if item.calibration.guessing is not None
    ]
    slipping_values = [
        item.calibration.slipping
        for item in items
        if item.calibration.slipping is not None
    ]
    time_intensities = [
        item.calibration.time_intensity
        for item in items
        if item.calibration.time_intensity is not None
    ]

    status_counts = _count_by_attr(responses, "status")
    correctness_counts = _count_by_attr(responses, "correctness")
    severity_counts = _count_by_attr(validity_flags, "severity")

    calibrated_item_count = sum(
        1
        for item in items
        if item.calibration.difficulty is not None
        and item.calibration.discrimination is not None
    )

    domains_with_accuracy = [
        domain
        for domain in domains
        if getattr(domain, "accuracy", None) is not None
    ]

    domain_accuracies = [
        float(domain.accuracy) for domain in domains_with_accuracy
    ]

    section_ids = {
        item.section_id for item in items if getattr(item, "section_id", None)
    }

    calibration_versions = {
        item.calibration.calibration_version
        for item in items
        if item.calibration.calibration_version is not None
    }

    visibility_loss_event_count = sum(
        1
        for event in request.timing_events
        if event.event_type == "VISIBILITY_LOST"
    )

    response_time_coverage = (
        len(response_times) / len(responses) if responses else 0.0
    )

    attempted_item_ratio = len(responses) / len(items) if items else 0.0

    return {
        "total_raw_score": raw_score,
        "total_possible_score": max_raw_score,
        "overall_accuracy": accuracy,
        "correct_response_count": correctness_counts.get("CORRECT", 0),
        "incorrect_response_count": correctness_counts.get("INCORRECT", 0),
        "partial_response_count": correctness_counts.get("PARTIAL", 0),
        "unscored_response_count": correctness_counts.get("UNSCORED", 0),
        "unknown_correctness_count": correctness_counts.get("UNKNOWN", 0),
        "answered_response_count": status_counts.get("ANSWERED", 0),
        "omitted_response_count": status_counts.get("OMITTED", 0),
        "skipped_response_count": status_counts.get("SKIPPED", 0),
        "timed_out_response_count": status_counts.get("TIMED_OUT", 0),
        "not_presented_response_count": status_counts.get("NOT_PRESENTED", 0),
        "attempted_item_ratio": round(attempted_item_ratio, 4),
        "assessment_source": request.session.source,
        "assessment_version": request.assessment.assessment_version,
        "form_blueprint_version": request.assessment.form_blueprint_version,
        "item_count": len(items),
        "section_count": len(section_ids),
        "domain_count": len(domains),
        "domain_accuracy_spread": domain_accuracy_spread_from_scores(domains),
        "highest_domain_accuracy": max(domain_accuracies) if domain_accuracies else None,
        "lowest_domain_accuracy": min(domain_accuracies) if domain_accuracies else None,
        "domain_balance_index": domain_accuracy_spread_from_scores(domains),
        "calibrated_item_count": calibrated_item_count,
        "calibrated_item_ratio": round(calibrated_item_count / len(items), 4)
        if items
        else 0.0,
        "mean_item_difficulty": _mean(difficulties),
        "mean_item_discrimination": _mean(discriminations),
        "mean_guessing_parameter": _mean(guessing_values),
        "mean_slipping_parameter": _mean(slipping_values),
        "mean_time_intensity": _mean(time_intensities),
        "calibration_sample_size_available_count": sum(
            1 for item in items if item.calibration.calibration_sample_size is not None
        ),
        "calibration_version_count": len(calibration_versions),
        "total_response_time_ms": timing_profile.total_response_time_ms,
        "median_response_time_ms": timing_profile.median_response_time_ms,
        "mean_response_time_ms": _mean(response_times),
        "minimum_response_time_ms": min(response_times) if response_times else None,
        "maximum_response_time_ms": max(response_times) if response_times else None,
        "response_time_spread_ms": (
            max(response_times) - min(response_times) if response_times else None
        ),
        "response_time_coverage": round(response_time_coverage, 4),
        "speed_index": timing_profile.speed_index,
        "speed_accuracy_tradeoff": timing_profile.speed_accuracy_tradeoff,
        "rapid_guessing_rate": timing_profile.rapid_guessing_rate,
        "first_interaction_time_available_count": len(first_interaction_times),
        "mean_first_interaction_time_ms": _mean(first_interaction_times),
        "revision_count_total": sum(response.revision_count for response in responses),
        "revision_count_mean": _mean([response.revision_count for response in responses]),
        "confidence_rating_available_count": len(confidence_ratings),
        "mean_confidence_rating": _mean(confidence_ratings),
        "omission_rate": timing_profile.omission_rate,
        "upstream_omission_rate": request.validity_input.omission_rate,
        "upstream_rapid_guessing_rate": request.validity_input.rapid_guessing_rate,
        "suspicious_session_flag_count": len(
            request.validity_input.suspicious_session_flags
        ),
        "browser_or_device_signal_count": len(
            request.validity_input.browser_or_device_signals
        ),
        "visibility_loss_event_count": visibility_loss_event_count,
        "validity_flag_count": len(validity_flags),
        "high_severity_validity_flag_count": severity_counts.get("HIGH", 0),
        "medium_severity_validity_flag_count": severity_counts.get("MEDIUM", 0),
        "low_severity_validity_flag_count": severity_counts.get("LOW", 0),
        "theta_estimate": theta,
        "iq_score": standard_score,
        "iq_percentile": percentile,
        "feature_set_version": FEATURE_SET_VERSION,
        "ml_ready": True,
    }


def build_feature_summary(
    *,
    feature_vector: dict[str, str | int | float | bool | None],
    scoring_signals_used: list[str] | None = None,
) -> dict[str, Any]:
    signals = scoring_signals_used or DEFAULT_SCORING_SIGNALS_USED
    missing_signal_count = sum(1 for value in feature_vector.values() if value is None)

    return {
        "featureSetVersion": FEATURE_SET_VERSION,
        "signalCount": len(signals),
        "signalGroups": [
            "accuracy",
            "domain_performance",
            "item_calibration",
            "timing",
            "omission",
            "behavioural_validity",
            "confidence",
            "reliability",
            "leaderboard_governance",
            "ml_readiness",
        ],
        "deterministicSignalsUsed": 18,
        "calibrationSignalsUsed": 12,
        "behaviouralSignalsUsed": 18,
        "validitySignalsUsed": 12,
        "missingSignalCount": missing_signal_count,
        "mlReady": True,
    }


def resolve_leaderboard_eligibility(
    *,
    scoring_status: str,
    validity_flags: list[Any],
    iq_score: float | None,
) -> tuple[bool, list[str]]:
    reasons: list[str] = []

    if scoring_status != "SCORED":
        reasons.append("score_not_fully_scored")

    if iq_score is None:
        reasons.append("iq_score_unavailable")

    high_severity_flags = [
        flag.code for flag in validity_flags if flag.severity == "HIGH"
    ]

    if high_severity_flags:
        reasons.append("high_validity_flag_present")

    disqualifying_codes = {
        "NO_PRESENTED_ITEMS",
        "INCOMPLETE_RESPONSE_SET",
        "HIGH_OMISSION_RATE",
        "ELEVATED_OMISSION_RATE",
        "RAPID_GUESSING_ELEVATED",
        "UPSTREAM_SUSPICIOUS_SESSION_FLAG",
    }

    matched_codes = sorted(
        {flag.code for flag in validity_flags if flag.code in disqualifying_codes}
    )

    for code in matched_codes:
        reasons.append(f"validity_flag_{code.lower()}")

    return (len(reasons) == 0, reasons)


def _validity_penalty(validity_flags: list[Any]) -> float:
    penalty = 0.0

    for flag in validity_flags:
        severity = getattr(flag, "severity", None)

        if severity == "HIGH":
            penalty += 0.35
        elif severity == "MEDIUM":
            penalty += 0.15
        elif severity == "LOW":
            penalty += 0.05

    return min(penalty, 1.25)


def _speed_adjustment(
    speed_accuracy_tradeoff: str | None,
    accuracy: float,
) -> float:
    if speed_accuracy_tradeoff == "FAST_ACCURATE" and accuracy >= 0.7:
        return 0.06

    if speed_accuracy_tradeoff == "SLOW_ACCURATE" and accuracy >= 0.7:
        return 0.02

    if speed_accuracy_tradeoff == "FAST_ERROR_PRONE":
        return -0.12

    if speed_accuracy_tradeoff == "RAPID_LOW_ACCURACY":
        return -0.2

    if speed_accuracy_tradeoff == "SLOW_LOW_ACCURACY":
        return -0.06

    return 0.0


def _count_by_attr(items: list[Any], attr: str) -> dict[str, int]:
    counts: dict[str, int] = {}

    for item in items:
        value = getattr(item, attr, None)
        if value is None:
            continue

        counts[str(value)] = counts.get(str(value), 0) + 1

    return counts


def _mean(values: list[float | int]) -> float | None:
    if not values:
        return None

    return round(sum(values) / len(values), 4)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))