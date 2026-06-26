from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import UTC, datetime

from app.schemas.scoring import (
    CONTRACT_VERSION,
    ConfidenceInterval90,
    DomainScore,
    OverallScore,
    ScoreAuditTrace,
    ScoringMode,
    ScoringRequest,
    ScoringResponse,
)

from app.services.baseline_scoring import build_baseline_scoring_response


THETA_MIN = -4.0
THETA_MAX = 4.0
THETA_STEP = 0.02
CONFIDENCE_Z_90 = 1.6448536269514722
MIN_INFORMATION_FOR_SE = 1e-6


@dataclass(frozen=True)
class IrtObservation:
    item_id: str
    domain: str
    label: str
    response_value: float
    discrimination: float
    difficulty: float
    guessing: float


@dataclass(frozen=True)
class IrtEstimate:
    theta: float | None
    standard_error: float | None
    test_information: float | None
    reliability: float | None
    confidence_interval_90: ConfidenceInterval90


def build_irt_scoring_response(request: ScoringRequest) -> ScoringResponse:
    baseline = build_baseline_scoring_response(request)

    observations = _build_observations(request)

    if not observations:
        baseline.audit.model_version = "irt-provisional.0.2.0"
        baseline.audit.scoring_mode_used = request.requested_scoring_mode
        baseline.audit.generated_at = datetime.now(UTC)
        baseline.audit.warnings.append(
            "IRT scoring was requested, but no calibrated scorable observations "
            "were available. Baseline scoring was returned."
        )
        return baseline

    overall_estimate = _estimate_theta(observations)
    domain_scores = _build_domain_irt_scores(
        request=request,
        baseline_domains=baseline.domains,
        observations=observations,
    )

    baseline.overall = _build_overall_irt_score(
        baseline_overall=baseline.overall,
        estimate=overall_estimate,
    )
    baseline.domains = domain_scores
    baseline.audit = ScoreAuditTrace(
        modelVersion="irt-provisional.0.2.0",
        contractVersion=CONTRACT_VERSION,
        calibrationVersion=_resolve_calibration_version(request),
        scoringModeUsed=_resolve_scoring_mode_used(request.requested_scoring_mode),
        generatedAt=datetime.now(UTC),
        inputHash=baseline.audit.input_hash,
        warnings=[
            *baseline.audit.warnings,
            (
                "IRT v2 is provisional. Accuracy depends on calibrated item "
                "difficulty, discrimination, and guessing parameters. Current "
                "outputs must not be marketed as norm-certified IQ scores."
            ),
        ],
    )

    return baseline


def _build_observations(request: ScoringRequest) -> list[IrtObservation]:
    response_by_item_id = {response.item_id: response for response in request.responses}
    domain_labels = {
        domain.domain: domain.label for domain in request.assessment.domains
    }

    observations: list[IrtObservation] = []

    for item in request.items:
        response = response_by_item_id.get(item.item_id)

        if response is None:
            response_value = 0.0
        elif response.status in {"NOT_PRESENTED"}:
            continue
        elif item.max_score <= 0:
            continue
        else:
            response_value = _clamp(response.raw_score / item.max_score, 0.0, 1.0)

        difficulty = item.calibration.difficulty
        discrimination = item.calibration.discrimination

        if difficulty is None or discrimination is None:
            continue

        guessing = item.calibration.guessing
        if guessing is None:
            guessing = 0.0

        observations.append(
            IrtObservation(
                item_id=item.item_id,
                domain=item.domain,
                label=domain_labels.get(item.domain, item.domain),
                response_value=response_value,
                discrimination=_clamp(discrimination, 0.2, 3.0),
                difficulty=_clamp(difficulty, -4.0, 4.0),
                guessing=_clamp(guessing, 0.0, 0.35),
            )
        )

    return observations


def _build_domain_irt_scores(
    request: ScoringRequest,
    baseline_domains: list[DomainScore],
    observations: list[IrtObservation],
) -> list[DomainScore]:
    observations_by_domain: dict[str, list[IrtObservation]] = {}

    for observation in observations:
        observations_by_domain.setdefault(observation.domain, []).append(observation)

    baseline_by_domain = {score.domain: score for score in baseline_domains}
    domain_scores: list[DomainScore] = []

    for domain_score in baseline_domains:
        domain_observations = observations_by_domain.get(domain_score.domain, [])

        if not domain_observations:
            domain_score.interpretation = (
                f"{domain_score.label} has baseline raw-score information, but "
                "no calibrated IRT item parameters were available for this domain."
            )
            domain_scores.append(domain_score)
            continue

        estimate = _estimate_theta(domain_observations)

        domain_scores.append(
            DomainScore(
                domain=domain_score.domain,
                label=domain_score.label,
                rawScore=domain_score.raw_score,
                maxRawScore=domain_score.max_raw_score,
                accuracy=domain_score.accuracy,
                theta=_round_or_none(estimate.theta),
                standardScore=_standard_score_from_theta(estimate.theta),
                percentile=_percentile_from_theta(estimate.theta),
                scoreBand=_score_band_from_standard_score(
                    _standard_score_from_theta(estimate.theta)
                ),
                standardError=_round_or_none(estimate.standard_error),
                confidenceInterval90=estimate.confidence_interval_90,
                testInformation=_round_or_none(estimate.test_information),
                reliability=_round_or_none(estimate.reliability),
                interpretation=_domain_interpretation(
                    label=domain_score.label,
                    estimate=estimate,
                    item_count=len(domain_observations),
                ),
            )
        )

    for domain, domain_observations in observations_by_domain.items():
        if domain in baseline_by_domain:
            continue

        estimate = _estimate_theta(domain_observations)

        domain_scores.append(
            DomainScore(
                domain=domain,
                label=domain_observations[0].label,
                rawScore=sum(observation.response_value for observation in domain_observations),
                maxRawScore=float(len(domain_observations)),
                accuracy=sum(observation.response_value for observation in domain_observations)
                / len(domain_observations),
                theta=_round_or_none(estimate.theta),
                standardScore=_standard_score_from_theta(estimate.theta),
                percentile=_percentile_from_theta(estimate.theta),
                scoreBand=_score_band_from_standard_score(
                    _standard_score_from_theta(estimate.theta)
                ),
                standardError=_round_or_none(estimate.standard_error),
                confidenceInterval90=estimate.confidence_interval_90,
                testInformation=_round_or_none(estimate.test_information),
                reliability=_round_or_none(estimate.reliability),
                interpretation=_domain_interpretation(
                    label=domain_observations[0].label,
                    estimate=estimate,
                    item_count=len(domain_observations),
                ),
            )
        )

    return sorted(domain_scores, key=lambda score: score.domain)


def _build_overall_irt_score(
    baseline_overall: OverallScore,
    estimate: IrtEstimate,
) -> OverallScore:
    standard_score = _standard_score_from_theta(estimate.theta)

    return OverallScore(
        domain=baseline_overall.domain,
        label=baseline_overall.label,
        rawScore=baseline_overall.raw_score,
        maxRawScore=baseline_overall.max_raw_score,
        accuracy=baseline_overall.accuracy,
        theta=_round_or_none(estimate.theta),
        standardScore=standard_score,
        percentile=_percentile_from_theta(estimate.theta),
        scoreBand=_score_band_from_standard_score(standard_score),
        standardError=_round_or_none(estimate.standard_error),
        confidenceInterval90=estimate.confidence_interval_90,
        testInformation=_round_or_none(estimate.test_information),
        reliability=_round_or_none(estimate.reliability),
        interpretation=_overall_interpretation(estimate),
    )


def _estimate_theta(observations: list[IrtObservation]) -> IrtEstimate:
    if not observations:
        return IrtEstimate(
            theta=None,
            standard_error=None,
            test_information=None,
            reliability=None,
            confidence_interval_90=ConfidenceInterval90(lower=None, upper=None),
        )

    best_theta = THETA_MIN
    best_log_likelihood = -math.inf

    current_theta = THETA_MIN
    while current_theta <= THETA_MAX:
        log_likelihood = _log_likelihood(theta=current_theta, observations=observations)

        if log_likelihood > best_log_likelihood:
            best_log_likelihood = log_likelihood
            best_theta = current_theta

        current_theta += THETA_STEP

    test_information = _test_information(theta=best_theta, observations=observations)

    if test_information <= MIN_INFORMATION_FOR_SE:
        standard_error = None
        reliability = None
        confidence_interval = ConfidenceInterval90(lower=None, upper=None)
    else:
        standard_error = 1 / math.sqrt(test_information)
        reliability = test_information / (test_information + 1)
        confidence_interval = ConfidenceInterval90(
            lower=round(best_theta - (CONFIDENCE_Z_90 * standard_error), 3),
            upper=round(best_theta + (CONFIDENCE_Z_90 * standard_error), 3),
        )

    return IrtEstimate(
        theta=best_theta,
        standard_error=standard_error,
        test_information=test_information,
        reliability=reliability,
        confidence_interval_90=confidence_interval,
    )


def _log_likelihood(theta: float, observations: list[IrtObservation]) -> float:
    total = 0.0

    for observation in observations:
        probability = _irt_probability(
            theta=theta,
            discrimination=observation.discrimination,
            difficulty=observation.difficulty,
            guessing=observation.guessing,
        )

        probability = _clamp(probability, 1e-9, 1 - 1e-9)

        total += (
            observation.response_value * math.log(probability)
            + (1 - observation.response_value) * math.log(1 - probability)
        )

    return total


def _test_information(theta: float, observations: list[IrtObservation]) -> float:
    total_information = 0.0

    for observation in observations:
        logistic_value = _logistic(
            observation.discrimination * (theta - observation.difficulty)
        )

        probability = observation.guessing + (
            (1 - observation.guessing) * logistic_value
        )
        probability = _clamp(probability, 1e-9, 1 - 1e-9)

        derivative = (
            (1 - observation.guessing)
            * observation.discrimination
            * logistic_value
            * (1 - logistic_value)
        )

        total_information += (derivative * derivative) / (
            probability * (1 - probability)
        )

    return total_information


def _irt_probability(
    theta: float,
    discrimination: float,
    difficulty: float,
    guessing: float,
) -> float:
    return guessing + (
        (1 - guessing) * _logistic(discrimination * (theta - difficulty))
    )


def _logistic(value: float) -> float:
    if value >= 0:
        z = math.exp(-value)
        return 1 / (1 + z)

    z = math.exp(value)
    return z / (1 + z)


def _standard_score_from_theta(theta: float | None) -> float | None:
    if theta is None:
        return None

    return round(100 + (15 * theta), 1)


def _percentile_from_theta(theta: float | None) -> float | None:
    if theta is None:
        return None

    percentile = 100 * (0.5 * (1 + math.erf(theta / math.sqrt(2))))

    return round(_clamp(percentile, 0.1, 99.9), 1)


def _score_band_from_standard_score(standard_score: float | None) -> str:
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


def _overall_interpretation(estimate: IrtEstimate) -> str:
    if estimate.theta is None:
        return (
            "The advanced scoring engine could not estimate an IRT ability "
            "parameter because calibrated item-response observations were not "
            "available."
        )

    return (
        "This profile uses provisional IRT-style ability estimation. The result "
        "combines calibrated item difficulty, item discrimination, guessing "
        "parameters where available, response correctness, test information, "
        "standard error, and a 90% confidence interval. Norm-certified IQ "
        "interpretation requires a validated calibration and norming sample."
    )


def _domain_interpretation(
    label: str,
    estimate: IrtEstimate,
    item_count: int,
) -> str:
    if estimate.theta is None:
        return (
            f"{label} could not receive an IRT-style domain estimate because "
            "calibrated item-response observations were not available."
        )

    return (
        f"{label} uses provisional IRT-style scoring across {item_count} "
        "calibrated item observations. Domain confidence should be interpreted "
        "using the standard error, confidence interval, and test information."
    )


def _resolve_scoring_mode_used(requested_mode: ScoringMode) -> ScoringMode:
    if requested_mode == "BASELINE_CLASSICAL":
        return "IRT_2PL_PROVISIONAL"

    return requested_mode


def _resolve_calibration_version(request: ScoringRequest) -> str | None:
    versions = {
        item.calibration.calibration_version
        for item in request.items
        if item.calibration.calibration_version is not None
    }

    if not versions:
        return None

    return ",".join(sorted(versions))


def _round_or_none(value: float | None) -> float | None:
    if value is None:
        return None

    return round(value, 3)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))