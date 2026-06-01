# IQMeridian Phase 6 Backend API Contract

## Status

Phase 6 backend API contracts are locked for MVP frontend integration.

This document defines the stable backend route surface after implementation of authentication/role checks, organisations, campaigns, assessment forms, item bank, invitations, sessions, responses, scoring, reports, audit logging, DTO validation, pagination, diagnostics, and development seed data.

Frontend work should build against these contracts unless a critical backend defect is discovered.

---

## Authentication Model

The current development backend uses `DevAuthGuard` with bearer tokens.

Expected development tokens:

- `Bearer dev-token` — platform admin
- `Bearer employer-token` — employer admin
- `Bearer candidate-token` — candidate
- `Bearer consumer-token` — consumer

Production authentication may later replace `DevAuthGuard`, but the route-level role behaviours should remain stable.

---

## Standard Error Shape

All API errors should return the global error response shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation or domain error message",
  "path": "/example/path",
  "method": "POST",
  "timestamp": "2026-05-31T00:00:00.000Z"
}

Validation errors may return message as an array of strings.

Pagination Shape

Paginated endpoints return:

{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pageCount": 0
  }
}

Pagination query parameters:

page: number, minimum 1
limit: number, minimum 1, maximum 100
Diagnostics
GET /diagnostics

Purpose: verifies infrastructure and domain readiness.

Response includes:

database status
Redis TCP status
environment indicators
active form count
active item count
active mapped item count
scoring readiness

Expected status values:

UP
DEGRADED
DOWN
Users
GET /users/me

Roles: authenticated user.

Returns the current development user and organisation relation where applicable.

PATCH /users/me

Roles: authenticated user.

Body:

{
  "name": "Dev Admin"
}
GET /users/organisation/:organisationId?page=1&limit=10

Roles: PLATFORM_ADMIN.

Returns paginated users for an organisation.

Organisations
POST /organisations

Roles: PLATFORM_ADMIN.

Body:

{
  "name": "Example Organisation"
}
GET /organisations

Roles: PLATFORM_ADMIN.

Returns organisations with related users and campaigns.

GET /organisations/:id

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN.

PATCH /organisations/:id

Roles: PLATFORM_ADMIN.

Body:

{
  "name": "Updated Organisation"
}
POST /organisations/:id/employer-admins

Roles: PLATFORM_ADMIN.

Body:

{
  "userId": "dev-employer-admin"
}
Campaigns
POST /campaigns

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN.

Body:

{
  "name": "Demo Campaign",
  "organisationId": "dev-employer-org",
  "assessmentFormId": "dev-form-mvp-1"
}

Optional:

{
  "ownerId": "dev-employer-admin"
}
GET /campaigns?page=1&limit=10

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN.

Optional filters:

status
organisationId
assessmentFormId
ownerId

Employer admins only see campaigns attached to their organisation.

GET /campaigns/:id

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN.

PATCH /campaigns/:id/status

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN.

Body:

{
  "status": "ACTIVE"
}

Supported statuses depend on Prisma CampaignStatus.

Assessment Forms

Base path:

/assessments/forms
POST /assessments/forms

Roles: PLATFORM_ADMIN, RESEARCHER.

Body:

{
  "name": "IQMeridian MVP Cognitive Assessment",
  "version": 1,
  "isActive": true,
  "sections": [
    {
      "type": "ABSTRACT",
      "domain": "ABSTRACT_REASONING",
      "title": "Abstract Reasoning",
      "timeLimitSec": 600,
      "orderIndex": 1
    }
  ]
}
GET /assessments/forms/active?page=1&limit=10

Roles: PLATFORM_ADMIN, RESEARCHER, EMPLOYER_ADMIN.

Optional filter:

name
GET /assessments/forms/:id

Roles: PLATFORM_ADMIN, RESEARCHER, EMPLOYER_ADMIN.

PATCH /assessments/forms/:id/active

Roles: PLATFORM_ADMIN, RESEARCHER.

Body:

{
  "isActive": true
}
POST /assessments/forms/:id/versions

Roles: PLATFORM_ADMIN, RESEARCHER.

Creates a new inactive form version.

POST /assessments/forms/:formId/sections

Roles: PLATFORM_ADMIN, RESEARCHER.

Body:

{
  "type": "NUMERICAL",
  "domain": "NUMERICAL_REASONING",
  "title": "Numerical Reasoning",
  "timeLimitSec": 600,
  "orderIndex": 2
}
GET /assessments/forms/:formId/sections

Roles: PLATFORM_ADMIN, RESEARCHER, EMPLOYER_ADMIN.

POST /assessments/forms/:formId/items

Roles: PLATFORM_ADMIN, RESEARCHER.

Body:

{
  "sectionId": "dev-section-abstract-1",
  "itemId": "dev-item-abstract-1",
  "orderIndex": 1
}
PATCH /assessments/forms/form-items/:mappingId/status

Roles: PLATFORM_ADMIN, RESEARCHER.

Body:

{
  "status": "ACTIVE"
}
Item Bank
POST /item-bank

Roles: PLATFORM_ADMIN, RESEARCHER.

Body:

{
  "domain": "ABSTRACT_REASONING",
  "prompt": "Which option completes the pattern?",
  "itemType": "MULTIPLE_CHOICE",
  "options": ["circle", "triangle"],
  "correctAnswer": "circle",
  "difficulty": "EASY"
}
GET /item-bank?page=1&limit=10

Roles: PLATFORM_ADMIN, RESEARCHER.

Optional filters:

domain
status
formId
GET /item-bank/:id

Roles: PLATFORM_ADMIN, RESEARCHER.

PATCH /item-bank/:id

Roles: PLATFORM_ADMIN, RESEARCHER.

Only draft items can be edited.

POST /item-bank/:id/activate

Roles: PLATFORM_ADMIN, RESEARCHER.

POST /item-bank/:id/retire

Roles: PLATFORM_ADMIN, RESEARCHER.

Invitations
POST /invitations

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN.

Body:

{
  "campaignId": "dev-campaign-1",
  "email": "candidate.one@iqmeridian.dev",
  "candidateUserId": "dev-candidate-1",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
GET /invitations/validate/:token

Roles: PLATFORM_ADMIN, EMPLOYER_ADMIN, CANDIDATE.

Validates pending invitation status and expiry.

Sessions
GET /sessions?page=1&limit=10

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN.

Optional filters:

status
campaignId
assessmentFormId
userId

Role restrictions:

candidates and consumers see only own sessions
employer admins see sessions through campaigns attached to their organisation
platform admins can see broader records
POST /sessions/consumer

Roles: CONSUMER, PLATFORM_ADMIN.

Body:

{
  "assessmentFormId": "dev-form-mvp-1"
}
POST /sessions/invitation

Roles: CANDIDATE, PLATFORM_ADMIN.

Body:

{
  "invitationToken": "dev-invitation-token"
}
POST /sessions/:id/start

Roles: CANDIDATE, CONSUMER, PLATFORM_ADMIN.

POST /sessions/:id/resume

Roles: CANDIDATE, CONSUMER, PLATFORM_ADMIN.

POST /sessions/:id/finalise

Roles: CANDIDATE, CONSUMER, PLATFORM_ADMIN.

Responses
POST /responses/sessions/:sessionId/items/:itemId

Roles: CANDIDATE, CONSUMER, PLATFORM_ADMIN.

Body:

{
  "answer": "circle"
}

Rules:

response session must belong to the authenticated candidate/consumer unless platform admin
item must belong to assigned form
closed sessions cannot be changed
duplicate writes are handled through upsert/autosave logic
GET /responses/sessions/:sessionId

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN.

POST /responses/sessions/:sessionId/finalise

Roles: CANDIDATE, CONSUMER, PLATFORM_ADMIN.

Finalises response set and completes the session.

Scoring
POST /scoring/sessions/:sessionId

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN.

Scores a completed session.

Scoring output includes:

domain raw scores
domain max scores
overall raw score
overall max score
composite percentage
performance bands
scoring version metadata
GET /scoring/sessions/:sessionId

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN.

Retrieves existing score for a session.

Reports
GET /reports?page=1&limit=10

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN, RESEARCHER.

Optional filters:

visibility
sessionId
subjectUserId
scoreId

Role restrictions:

candidates and consumers see own reports
employer admins see employer reports for their campaigns
researchers see internal reports
platform admins have broader access
POST /reports/sessions/:sessionId/candidate

Roles: CANDIDATE, CONSUMER, PLATFORM_ADMIN.

Generates candidate-visible report.

POST /reports/sessions/:sessionId/employer

Roles: EMPLOYER_ADMIN, PLATFORM_ADMIN.

Generates employer-visible report.

GET /reports/:id

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN, RESEARCHER.

GET /reports/sessions/:sessionId/:visibility

Roles: CANDIDATE, CONSUMER, EMPLOYER_ADMIN, PLATFORM_ADMIN, RESEARCHER.

Audit Logs
GET /audit-logs?page=1&limit=10

Roles: PLATFORM_ADMIN, RESEARCHER.

Optional filters:

action
entityType
entityId
userId

Major audited actions include:

organisation creation/update
campaign creation/status update
invitation creation/expiry/acceptance
session creation/start/submission
response finalisation
score generation
report generation
item creation/update/activation/retirement
assessment form/section/mapping changes
user profile update
Development Seed IDs

Stable seed IDs:

dev-platform-admin
dev-employer-org
dev-employer-admin
dev-candidate-1
dev-consumer-1
dev-form-mvp-1
dev-section-abstract-1
dev-section-numerical-1
dev-item-abstract-1
dev-item-numerical-1
dev-mapping-abstract-1
dev-mapping-numerical-1
dev-campaign-1
dev-invitation-token
Contract Lock Rule

Frontend work should not change these routes or payloads directly.

Any future backend change must be handled through:

a versioned route,
a backward-compatible DTO extension, or
a documented contract revision.

```
