# IQMeridian

IQMeridian cognitive assessment platform.

## Monorepo boundaries

- `apps/web` — all browser-facing product interfaces
- `apps/api` — all core backend APIs and orchestration
- `packages/types` — shared request/response contracts and domain types
- `packages/config` — environment parsing and app config helpers
- `packages/ui` — shared frontend UI primitives
- `packages/eslint-config` — shared linting rules
- `packages/tsconfig` — shared TypeScript base configuration
- `infrastructure/` — deployment and service definitions
- `docker/` — Dockerfiles and compose files
- `.github/` — CI workflows and repository automation
- `docs/` — internal documentation