# Supercampus Backend

Campus API for the Supercampus mobile app. The engineering standard matches the IEBA v2 backend: NestJS, one MySQL database per campus, and a fixed module layout.

Swagger and document upload are implemented. The other campus modules are still folders only.

## Tech stack

- **Framework:** NestJS, TypeScript
- **Database:** MySQL 8, TypeORM (separate database per campus)
- **Cache:** Redis
- **Storage:** MinIO
- **Auth:** JWT
- **Docs:** Swagger (OpenAPI), once the app is implemented

## Docs

| File | What it is |
| --- | --- |
| `prompt/prompt.txt` | Source of truth for architecture and coding rules |
| `docs/PROJECT_GUIDE.md` | How those rules are applied in this repo |
| `docs/ARCHITECTURE_AND_CODE_STRUCTURE.md` | Folder map, modules, and HTTP contract |
| `AGENTS.md` | Short pointer for day-to-day work |

## Project structure

```
src/
├── core/                 # Infrastructure
│   ├── auth/
│   ├── tenant/
│   ├── database/
│   ├── audit/
│   ├── redis/
│   ├── storage/
│   ├── common/
│   └── models/
├── modules/              # Feature modules (folders reserved, no code yet)
│   ├── user/
│   ├── campus/
│   ├── community/
│   ├── food/
│   ├── outpass/
│   ├── sports/
│   ├── marketplace/
│   ├── project/
│   └── internship/
├── config/
├── app.module.ts         # added with the first feature
└── main.ts
```

Each business module, when built, uses:

- `controller/` — HTTP only, DTOs, calls the service
- `service/` — business logic, plus a data service
- `repository/` — data access only
- `entity/` — TypeORM model
- `dto/request/` and `dto/response/`
- `mapper/` — request DTO ↔ entity ↔ response DTO

## Database config

**Namespace mode (default)**

`ENVIRONMENT=LOCAL` and `NAMESPACES=global,nmit`:

- `global.LOCAL.DB_DATABASE=supercampus_global`
- `nmit.LOCAL.DB_DATABASE=supercampus_nmit`

The campus on the request (JWT or `X-Tenant-Id`) selects the database.

**Prefix mode**

Omit `ENVIRONMENT` / `NAMESPACES` and set `DB_DATABASE_PREFIX=campus_db_`. Then campus `nmit` uses database `campus_db_nmit`.

## Local setup

Ports are offset so this stack can run next to IEBA.

| Service | URL |
| --- | --- |
| MySQL | `127.0.0.1:3310` (user `supercampus`, password `supercampus_dev`) |
| Redis | `127.0.0.1:6381` |
| MinIO API | `http://127.0.0.1:9010` |
| MinIO console | `http://127.0.0.1:9011` (`minioadmin` / `minioadmin`) |

1. Start infrastructure:

```bash
docker compose up -d
```

2. Env is already written to `.env` for this machine. On a new machine, copy the template and fill it in:

```bash
cp .env.example .env
```

3. First boot creates `supercampus_global` (from Compose) and `supercampus_nmit` (from `scripts/mysql-init/01-create-databases.sql`). The SQL script runs only when the MySQL data volume is empty.

Start the API after `npm install`:

```bash
npm run start:dev
```

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`

Swagger lists **Auth** and **Document Uploader**. Use `POST /api/v1/auth/login` with the local email and password from `.env`, then Authorize with the returned Bearer token. Campus header: `X-Tenant-Id` (for example `nmit`). Upload stores the file in MinIO and a row in that campus database. MinIO must be running or the upload call fails. The docs page itself still loads if MinIO is down.

## Auth (planned)

- **Login:** `POST /api/v1/auth/login` with `{ "email", "password", "tenantId?" }`.
- **Protected routes:** `Authorization: Bearer <token>`.
- **Campus:** JWT `tenantId` or header `X-Tenant-Id`.
- **Roles:** `SUPER_ADMIN`, `CAMPUS_ADMIN`, `FACULTY`, `STUDENT`.

## Development rules

- Controllers: HTTP only. No business logic. No repository access.
- Services: business logic, transactions, same-module data service, and other modules’ services.
- Data services: the only layer that constructs this module’s repository.
- Repositories: queries only.
- APIs return response DTOs inside `ApiResponseDto`, never raw entities.
