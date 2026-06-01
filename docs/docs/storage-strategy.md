# IQMeridian Storage Strategy

## Structured data

PostgreSQL is the source of truth for structured application data, including:

- users
- organisations
- campaigns
- sessions
- responses
- scores
- reports metadata
- audit logs

## Object storage

S3-compatible object storage is used for file assets, including:

- report PDFs
- item images
- exported files
- archived data packages

## Development

Development uses MinIO as the local S3-compatible object storage service.

## Rule

Structured metadata lives in PostgreSQL.
File objects live in object storage.
