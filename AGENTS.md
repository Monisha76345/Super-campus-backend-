# Supercampus Backend

NestJS API for the Supercampus mobile app. Architecture matches the IEBA v2 backend: Clean Architecture, one MySQL database per campus, and Controller → Service → DataService → Repository.

Swagger (`/api/docs`) and the document uploader are implemented. Other campus modules are still empty folders. Do not add application code unless a feature is requested.

## Read before changing anything

1. [`prompt/prompt.txt`](prompt/prompt.txt) — canonical spec (Cursor loads this through `.cursor/rules/project-prompt.mdc`)
2. [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md) — layer rules and NEVER / ALWAYS
3. [`docs/ARCHITECTURE_AND_CODE_STRUCTURE.md`](docs/ARCHITECTURE_AND_CODE_STRUCTURE.md) — folder map and campus databases

## Local env

Infrastructure is `docker-compose.yml` (MySQL `3310`, Redis `6381`, MinIO `9010`). App settings are `.env` (template: `.env.example`). API port **3001**, prefix `/api/v1`.

```bash
docker compose up -d
```

## Layer rule

Controllers call services. Services call the same module’s data service, or another module’s service. Repositories are not used across modules and are not used from controllers.
