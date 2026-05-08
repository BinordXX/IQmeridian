# Environment strategy

## Root
- `.env.example` documents all required variables.

## Frontend
- `apps/web/.env.local` contains local web variables.
- Only `NEXT_PUBLIC_*` variables are exposed to the browser.

## Backend
- `apps/api/.env` contains backend-only variables.

## Rules
- Never commit real secrets.
- Keep variable names uppercase.
- Use `NEXT_PUBLIC_*` only for browser-safe values.