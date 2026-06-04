# IQMeridian Phase 6 Completion Checklist

## Completion Statement

Phase 6 is complete when the backend alone can support the MVP workflow without frontend dependence.

The backend must independently support:

- authentication and role checks
- organisation ownership
- campaign creation and access control
- assessment form and item retrieval
- invitation validation
- session lifecycle
- response persistence
- score computation
- report generation
- audit logging
- diagnostics
- development seed data

---

## Infrastructure Readiness

- [ ] Docker services are running:
  - PostgreSQL
  - Redis
  - MinIO
- [ ] API starts successfully on port `3001`
- [ ] Prisma migrations are applied
- [ ] Development seed data runs successfully
- [ ] `/diagnostics` returns `UP` or expected diagnostic status

Verification command:

```powershell
Invoke-RestMethod "http://localhost:3001/diagnostics"
Authentication and Role Checks
 dev-token maps to platform admin
 employer-token maps to employer admin
 candidate-token maps to candidate
 consumer-token maps to consumer
 protected endpoints reject unsupported roles
Organisation Ownership
 platform admin can retrieve organisations
 employer admin access is scoped to own organisation where applicable
 campaign access respects organisation ownership
Campaign Workflow
 campaign list is paginated
 campaign detail is retrievable
 campaign status transition rules work
 invalid campaign status returns structured 400
Assessment and Item Workflow
 active forms can be listed
 form detail includes sections and item mappings
 item bank list is paginated
 item detail is retrievable
 active item mappings are present
 invalid form/item payloads return structured 400
Invitation Workflow
 active campaign can produce invitations
 invitation validation works
 expired or non-pending invitation is rejected
 invalid invitation payload returns structured 400
Session Lifecycle
 candidate can create session from invitation
 consumer can create independent session
 session can be started
 session can be resumed
 session can be finalised
 closed sessions reject response writes
Response Persistence
 candidate/consumer can save item responses
 duplicate response writes update predictably
 invalid answer payload returns structured 400
 responses can be retrieved by authorised roles
 responses cannot be changed after session closure
Scoring
 completed session can be scored
 score record is stored
 score includes:
raw domain scores
max domain scores
overall raw score
overall composite
performance bands
scoring version metadata
 scoring is deterministic for the same response set
Reporting
 candidate report can be generated
 employer report can be generated
 reports can be retrieved by session and visibility
 report list is paginated
 invalid report visibility returns structured 400
 role-based report visibility rules are enforced
Audit Logging
 audit list is paginated
 audit logs include major workflow actions:
session creation
session start
response submission
score generation
report generation
campaign creation/status update
item activation/retirement
assessment changes
 audit logs are restricted to platform admin/researcher roles
Standard API Error Handling
 validation errors use standard error response shape
 forbidden access uses standard error response shape
 not-found errors use standard error response shape
 invalid state transitions use standard error response shape
Phase 6 Declaration

Phase 6 can be declared complete only when:

 all backend checks pass
 seed data is available
 independent domain tests pass
 cross-domain MVP workflow passes
 API contracts are documented
 CI passes on the feature branch
 the feature branch is ready for merge into main

```
