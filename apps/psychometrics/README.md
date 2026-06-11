# IQMeridian Psychometrics Service

Internal Python service for psychometric analysis of IQMeridian assessment data.

## Role in the IQMeridian architecture

Next.js remains the frontend.

NestJS remains the main product backend and orchestration layer.

PostgreSQL remains the source of assessment, session, response, score, report, and psychometric result data.

The Python psychometrics service is an internal analysis engine. It is not a public-facing service.

## Responsibilities

The service will calculate:

- item difficulty
- item discrimination
- omission patterns
- response-time patterns
- distractor behaviour
- score distributions
- reliability indicators when sample size is sufficient
- psychometric flags for researcher review

## Non-responsibilities

The service must not handle:

- candidate authentication
- employer authentication
- campaign creation
- assessment delivery
- invitation handling
- primary live scoring
- report permission enforcement
- employer dashboard access control
- direct candidate or consumer access

## Intended consumers

The intended consumers are:

- the NestJS internal psychometrics orchestration module
- platform-admin internal tooling
- researcher internal tooling

## Data principles

The service should use session IDs and participant categories instead of unnecessary personal identifiers.

The service analyses assessment behaviour, not personal identity.

Outputs should be treated as pilot evidence, not final validation.

Automated flags should remain reviewable by researchers.

All analysis must preserve form, scoring, and report version traceability.
