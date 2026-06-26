from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


CONTRACT_VERSION = "2026-06-25.v1"

ScoringMode = Literal[
    "BASELINE_CLASSICAL",
    "IRT_2PL_PROVISIONAL",
    "IRT_3PL_PROVISIONAL",
    "MULTIDIMENSIONAL_PROVISIONAL",
    "HYBRID_RESEARCH",
]

SessionSource = Literal[
    "CONSUMER_SELF_SERVICE",
    "EMPLOYER_CAMPAIGN",
    "INVITATION",
    "PILOT",
    "INTERNAL_RESEARCH",
]

ItemResponseStatus = Literal[
    "ANSWERED",
    "OMITTED",
    "SKIPPED",
    "TIMED_OUT",
    "NOT_PRESENTED",
]

ResponseCorrectness = Literal[
    "CORRECT",
    "INCORRECT",
    "PARTIAL",
    "UNSCORED",
    "UNKNOWN",
]

ValiditySeverity = Literal["INFO", "LOW", "MEDIUM", "HIGH"]

ScoreBand = Literal[
    "VERY_LOW",
    "LOW",
    "LOW_AVERAGE",
    "AVERAGE",
    "HIGH_AVERAGE",
    "HIGH",
    "VERY_HIGH",
    "UNAVAILABLE",
]


class SessionContext(BaseModel):
    session_id: str = Field(alias="sessionId")
    user_id: str | None = Field(default=None, alias="userId")
    candidate_id: str | None = Field(default=None, alias="candidateId")
    invitation_id: str | None = Field(default=None, alias="invitationId")
    campaign_id: str | None = Field(default=None, alias="campaignId")
    organisation_id: str | None = Field(default=None, alias="organisationId")
    assessment_form_id: str = Field(alias="assessmentFormId")
    source: SessionSource
    started_at: datetime | None = Field(default=None, alias="startedAt")
    completed_at: datetime | None = Field(default=None, alias="completedAt")
    submitted_at: datetime | None = Field(default=None, alias="submittedAt")
    locale: str | None = None
    timezone: str | None = None


class AssessmentDomainContext(BaseModel):
    domain: str
    label: str
    expected_item_count: int | None = Field(default=None, alias="expectedItemCount")
    expected_duration_seconds: int | None = Field(
        default=None,
        alias="expectedDurationSeconds",
    )


class AssessmentContext(BaseModel):
    assessment_form_id: str = Field(alias="assessmentFormId")
    assessment_form_name: str = Field(alias="assessmentFormName")
    assessment_version: str | None = Field(default=None, alias="assessmentVersion")
    form_blueprint_version: str | None = Field(
        default=None,
        alias="formBlueprintVersion",
    )
    total_presented_items: int = Field(alias="totalPresentedItems")
    expected_duration_seconds: int | None = Field(
        default=None,
        alias="expectedDurationSeconds",
    )
    domains: list[AssessmentDomainContext]


class ItemCalibration(BaseModel):
    difficulty: float | None = None
    discrimination: float | None = None
    guessing: float | None = None
    slipping: float | None = None
    time_intensity: float | None = Field(default=None, alias="timeIntensity")
    calibration_sample_size: int | None = Field(
        default=None,
        alias="calibrationSampleSize",
    )
    calibration_version: str | None = Field(default=None, alias="calibrationVersion")


class PresentedItem(BaseModel):
    item_id: str = Field(alias="itemId")
    item_version: str | None = Field(default=None, alias="itemVersion")
    sequence_index: int = Field(alias="sequenceIndex")
    section_id: str | None = Field(default=None, alias="sectionId")
    domain: str
    subdomain: str | None = None
    item_type: str = Field(alias="itemType")
    max_score: float = Field(alias="maxScore")
    correct_option_id: str | None = Field(default=None, alias="correctOptionId")
    presented_at: datetime | None = Field(default=None, alias="presentedAt")
    calibration: ItemCalibration
    metadata: dict[str, Any] = Field(default_factory=dict)


class ItemResponse(BaseModel):
    item_id: str = Field(alias="itemId")
    selected_option_id: str | None = Field(default=None, alias="selectedOptionId")
    response_text: str | None = Field(default=None, alias="responseText")
    status: ItemResponseStatus
    correctness: ResponseCorrectness
    raw_score: float = Field(alias="rawScore")
    response_time_ms: int | None = Field(default=None, alias="responseTimeMs")
    first_interaction_time_ms: int | None = Field(
        default=None,
        alias="firstInteractionTimeMs",
    )
    revision_count: int = Field(default=0, alias="revisionCount")
    confidence_rating: float | None = Field(default=None, alias="confidenceRating")
    answered_at: datetime | None = Field(default=None, alias="answeredAt")


class TimingEvent(BaseModel):
    event_type: Literal[
        "SESSION_STARTED",
        "SECTION_STARTED",
        "ITEM_PRESENTED",
        "ITEM_ANSWERED",
        "SECTION_COMPLETED",
        "SESSION_SUBMITTED",
        "VISIBILITY_LOST",
        "VISIBILITY_GAINED",
    ] = Field(alias="eventType")
    item_id: str | None = Field(default=None, alias="itemId")
    section_id: str | None = Field(default=None, alias="sectionId")
    occurred_at: datetime = Field(alias="occurredAt")
    duration_ms: int | None = Field(default=None, alias="durationMs")
    metadata: dict[str, Any] = Field(default_factory=dict)


class ValidityInput(BaseModel):
    omission_rate: float = Field(alias="omissionRate")
    rapid_guessing_rate: float = Field(alias="rapidGuessingRate")
    median_response_time_ms: int | None = Field(
        default=None,
        alias="medianResponseTimeMs",
    )
    total_response_time_ms: int | None = Field(
        default=None,
        alias="totalResponseTimeMs",
    )
    suspicious_session_flags: list[str] = Field(
        default_factory=list,
        alias="suspiciousSessionFlags",
    )
    browser_or_device_signals: dict[str, Any] = Field(
        default_factory=dict,
        alias="browserOrDeviceSignals",
    )


class ScoringRequest(BaseModel):
    contract_version: Literal["2026-06-25.v1"] = Field(alias="contractVersion")
    requested_scoring_mode: ScoringMode = Field(alias="requestedScoringMode")
    requested_at: datetime = Field(alias="requestedAt")
    session: SessionContext
    assessment: AssessmentContext
    items: list[PresentedItem]
    responses: list[ItemResponse]
    timing_events: list[TimingEvent] = Field(alias="timingEvents")
    validity_input: ValidityInput = Field(alias="validityInput")


class ConfidenceInterval90(BaseModel):
    lower: float | None = None
    upper: float | None = None


class DomainScore(BaseModel):
    domain: str
    label: str
    raw_score: float = Field(alias="rawScore")
    max_raw_score: float = Field(alias="maxRawScore")
    accuracy: float | None = None
    theta: float | None = None
    standard_score: float | None = Field(default=None, alias="standardScore")
    percentile: float | None = None
    score_band: ScoreBand = Field(alias="scoreBand")
    standard_error: float | None = Field(default=None, alias="standardError")
    confidence_interval_90: ConfidenceInterval90 = Field(alias="confidenceInterval90")
    test_information: float | None = Field(default=None, alias="testInformation")
    reliability: float | None = None
    interpretation: str


class OverallScore(DomainScore):
    pass


class TimingProfile(BaseModel):
    total_response_time_ms: int | None = Field(default=None, alias="totalResponseTimeMs")
    median_response_time_ms: int | None = Field(
        default=None,
        alias="medianResponseTimeMs",
    )
    speed_index: float | None = Field(default=None, alias="speedIndex")
    speed_accuracy_tradeoff: str | None = Field(
        default=None,
        alias="speedAccuracyTradeoff",
    )
    rapid_guessing_rate: float = Field(alias="rapidGuessingRate")
    omission_rate: float = Field(alias="omissionRate")


class ValidityFlag(BaseModel):
    code: str
    label: str
    severity: ValiditySeverity
    description: str
    evidence: dict[str, Any] = Field(default_factory=dict)


class ScoreAuditTrace(BaseModel):
    model_version: str = Field(alias="modelVersion")
    contract_version: str = Field(alias="contractVersion")
    calibration_version: str | None = Field(default=None, alias="calibrationVersion")
    scoring_mode_used: ScoringMode = Field(alias="scoringModeUsed")
    generated_at: datetime = Field(alias="generatedAt")
    input_hash: str | None = Field(default=None, alias="inputHash")
    warnings: list[str] = Field(default_factory=list)


class ScoringResponse(BaseModel):
    contract_version: Literal["2026-06-25.v1"] = Field(alias="contractVersion")
    session_id: str = Field(alias="sessionId")
    scoring_status: Literal[
        "SCORED",
        "PARTIAL",
        "INSUFFICIENT_DATA",
        "FAILED",
    ] = Field(alias="scoringStatus")
    overall: OverallScore
    domains: list[DomainScore]
    timing_profile: TimingProfile = Field(alias="timingProfile")
    validity_flags: list[ValidityFlag] = Field(alias="validityFlags")
    audit: ScoreAuditTrace