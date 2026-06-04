# IQMeridian

IQMeridian is a cognitive assessment platform being built as a TypeScript-first monorepo.

## Tech stack

- Next.js for the frontend
- NestJS for the backend API
- PostgreSQL for structured data
- Redis for transient state and caching
- MinIO for local S3-compatible object storage
- Prisma for database access and migrations
- pnpm workspaces + Turborepo for monorepo management
- GitHub Actions for CI

## Repository structure

- `apps/web` — browser-facing product interfaces
- `apps/api` — backend APIs and orchestration
- `packages/types` — shared request/response contracts and domain types
- `packages/config` — shared configuration helpers
- `packages/ui` — shared frontend UI primitives
- `packages/eslint-config` — shared linting rules
- `packages/tsconfig` — shared TypeScript configuration
- `docker/` — Docker Compose and container-related files
- `.github/` — GitHub Actions workflows
- `docs/` — project documentation

## Required tools

Install these before running the project:

- Git
- Node.js
- pnpm
- Docker Desktop

## Install dependencies

From the repository root:

```bash
pnpm install
```
