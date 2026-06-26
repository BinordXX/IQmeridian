from copy import deepcopy

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _payload() -> dict:
    return {
        "contractVersion": "2026-06-25.v1",
        "requestedScoringMode": "BASELINE_CLASSICAL",
        "requestedAt": "2026-06-25T12:00:00Z",
        "session": {
            "sessionId": "session-1",
            "userId": "user-1",
            "candidateId": None,
            "invitationId": None,
            "campaignId": None,
            "organisationId": None,
            "assessmentFormId": "form-1",
            "source": "CONSUMER_SELF_SERVICE",
            "startedAt": "2026-06-25T12:00:00Z",
            "completedAt": "2026-06-25T12:20:00Z",
            "submittedAt": "2026-06-25T12:20:10Z",
            "locale": "en",
            "timezone": "Africa/Lagos",
        },
        "assessment": {
            "assessmentFormId": "form-1",
            "assessmentFormName": "General Cognitive Ability v0.1",
            "assessmentVersion": "0.1",
            "formBlueprintVersion": "blueprint-1",
            "totalPresentedItems": 4,
            "expectedDurationSeconds": 1800,
            "domains": [
                {
                    "domain": "verbal_reasoning",
                    "label": "Verbal reasoning",
                    "expectedItemCount": 2,
                    "expectedDurationSeconds": 900,
                },
                {
                    "domain": "quantitative_reasoning",
                    "label": "Quantitative reasoning",
                    "expectedItemCount": 2,
                    "expectedDurationSeconds": 900,
                },
            ],
        },
        "items": [
            {
                "itemId": "item-1",
                "itemVersion": "1",
                "sequenceIndex": 1,
                "sectionId": "section-1",
                "domain": "verbal_reasoning",
                "subdomain": None,
                "itemType": "MULTIPLE_CHOICE",
                "maxScore": 1,
                "correctOptionId": "a",
                "presentedAt": "2026-06-25T12:01:00Z",
                "calibration": {
                    "difficulty": -0.8,
                    "discrimination": 1.2,
                    "guessing": 0.2,
                    "slipping": None,
                    "timeIntensity": None,
                    "calibrationSampleSize": 500,
                    "calibrationVersion": "calibration-v0",
                },
                "metadata": {},
            },
            {
                "itemId": "item-2",
                "itemVersion": "1",
                "sequenceIndex": 2,
                "sectionId": "section-1",
                "domain": "verbal_reasoning",
                "subdomain": None,
                "itemType": "MULTIPLE_CHOICE",
                "maxScore": 1,
                "correctOptionId": "b",
                "presentedAt": "2026-06-25T12:02:00Z",
                "calibration": {
                    "difficulty": 0.2,
                    "discrimination": 1.1,
                    "guessing": 0.2,
                    "slipping": None,
                    "timeIntensity": None,
                    "calibrationSampleSize": 500,
                    "calibrationVersion": "calibration-v0",
                },
                "metadata": {},
            },
            {
                "itemId": "item-3",
                "itemVersion": "1",
                "sequenceIndex": 3,
                "sectionId": "section-2",
                "domain": "quantitative_reasoning",
                "subdomain": None,
                "itemType": "MULTIPLE_CHOICE",
                "maxScore": 1,
                "correctOptionId": "c",
                "presentedAt": "2026-06-25T12:03:00Z",
                "calibration": {
                    "difficulty": 0.5,
                    "discrimination": 1.4,
                    "guessing": 0.2,
                    "slipping": None,
                    "timeIntensity": None,
                    "calibrationSampleSize": 500,
                    "calibrationVersion": "calibration-v0",
                },
                "metadata": {},
            },
            {
                "itemId": "item-4",
                "itemVersion": "1",
                "sequenceIndex": 4,
                "sectionId": "section-2",
                "domain": "quantitative_reasoning",
                "subdomain": None,
                "itemType": "MULTIPLE_CHOICE",
                "maxScore": 1,
                "correctOptionId": "d",
                "presentedAt": "2026-06-25T12:04:00Z",
                "calibration": {
                    "difficulty": 1.2,
                    "discrimination": 1.6,
                    "guessing": 0.2,
                    "slipping": None,
                    "timeIntensity": None,
                    "calibrationSampleSize": 500,
                    "calibrationVersion": "calibration-v0",
                },
                "metadata": {},
            },
        ],
        "responses": [
            {
                "itemId": "item-1",
                "selectedOptionId": "a",
                "responseText": None,
                "status": "ANSWERED",
                "correctness": "CORRECT",
                "rawScore": 1,
                "responseTimeMs": 8000,
                "firstInteractionTimeMs": 1200,
                "revisionCount": 0,
                "confidenceRating": None,
                "answeredAt": "2026-06-25T12:01:20Z",
            },
            {
                "itemId": "item-2",
                "selectedOptionId": "b",
                "responseText": None,
                "status": "ANSWERED",
                "correctness": "CORRECT",
                "rawScore": 1,
                "responseTimeMs": 9500,
                "firstInteractionTimeMs": 900,
                "revisionCount": 0,
                "confidenceRating": None,
                "answeredAt": "2026-06-25T12:02:15Z",
            },
            {
                "itemId": "item-3",
                "selectedOptionId": "c",
                "responseText": None,
                "status": "ANSWERED",
                "correctness": "CORRECT",
                "rawScore": 1,
                "responseTimeMs": 11000,
                "firstInteractionTimeMs": 1400,
                "revisionCount": 1,
                "confidenceRating": None,
                "answeredAt": "2026-06-25T12:03:30Z",
            },
            {
                "itemId": "item-4",
                "selectedOptionId": "a",
                "responseText": None,
                "status": "ANSWERED",
                "correctness": "INCORRECT",
                "rawScore": 0,
                "responseTimeMs": 13000,
                "firstInteractionTimeMs": 1800,
                "revisionCount": 0,
                "confidenceRating": None,
                "answeredAt": "2026-06-25T12:04:30Z",
            },
        ],
        "timingEvents": [],
        "validityInput": {
            "omissionRate": 0,
            "rapidGuessingRate": 0,
            "medianResponseTimeMs": None,
            "totalResponseTimeMs": None,
            "suspiciousSessionFlags": [],
            "browserOrDeviceSignals": {},
        },
    }


def test_score_session_returns_baseline_profile() -> None:
    response = client.post("/v1/scoring/score-session", json=_payload())

    assert response.status_code == 200

    body = response.json()

    assert body["contractVersion"] == "2026-06-25.v1"
    assert body["sessionId"] == "session-1"
    assert body["scoringStatus"] == "SCORED"
    assert body["overall"]["rawScore"] == 3
    assert body["overall"]["maxRawScore"] == 4
    assert body["overall"]["accuracy"] == 0.75
    assert body["overall"]["theta"] is None
    assert body["overall"]["standardScore"] is None
    assert body["overall"]["testInformation"] is None
    assert body["audit"]["scoringModeUsed"] == "BASELINE_CLASSICAL"


def test_score_session_returns_irt_profile_when_requested() -> None:
    payload = deepcopy(_payload())
    payload["requestedScoringMode"] = "IRT_3PL_PROVISIONAL"

    response = client.post("/v1/scoring/score-session", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["contractVersion"] == "2026-06-25.v1"
    assert body["sessionId"] == "session-1"
    assert body["scoringStatus"] == "SCORED"
    assert body["overall"]["rawScore"] == 3
    assert body["overall"]["maxRawScore"] == 4
    assert body["overall"]["theta"] is not None
    assert body["overall"]["standardScore"] is not None
    assert body["overall"]["percentile"] is not None
    assert body["overall"]["standardError"] is not None
    assert body["overall"]["confidenceInterval90"]["lower"] is not None
    assert body["overall"]["confidenceInterval90"]["upper"] is not None
    assert body["overall"]["testInformation"] is not None
    assert body["overall"]["reliability"] is not None
    assert body["audit"]["modelVersion"] == "irt-provisional.0.2.0"
    assert body["audit"]["scoringModeUsed"] == "IRT_3PL_PROVISIONAL"
    assert body["audit"]["calibrationVersion"] == "calibration-v0"

    domains = {domain["domain"]: domain for domain in body["domains"]}

    assert domains["verbal_reasoning"]["theta"] is not None
    assert domains["verbal_reasoning"]["testInformation"] is not None

    assert domains["quantitative_reasoning"]["theta"] is not None
    assert domains["quantitative_reasoning"]["testInformation"] is not None


def test_score_session_rejects_invalid_contract_version() -> None:
    payload = _payload()
    payload["contractVersion"] = "invalid-version"

    response = client.post("/v1/scoring/score-session", json=payload)

    assert response.status_code == 422