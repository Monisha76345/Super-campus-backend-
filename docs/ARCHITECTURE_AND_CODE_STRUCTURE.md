# Supercampus Backend – Architecture & Code Structure

> **Document Version:** 1.0.0
> **Standard:** IEBA v2 backend (Clean Architecture, campus-scoped databases)
> **Client:** Supercampus mobile app (`supercampus_frontend`)

This document is the code-structure map. Layer rules, NEVER / ALWAYS, and naming live in `docs/PROJECT_GUIDE.md`. The canonical spec is `prompt/prompt.txt`.

Application source is not in the repo yet. The tree below is the required layout. Each folder under `src/` is reserved for the module named on it.

---

## 1. Tech stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Framework | NestJS | HTTP API |
| Language | TypeScript | Strict typing |
| ORM | TypeORM | Entities, repositories, subscribers |
| Database | MySQL 8 | One database per campus |
| Cache | Redis 7 | Cache and in-app notification lists |
| Storage | MinIO | Uploads (images, QR assets, documents) |
| Auth | JWT + Passport | Access and refresh tokens, role guards |
| Docs | Swagger | OpenAPI at `/api/docs` |

Local process port: **3001**. Prefix: **`/api/v1`**.

---

## 2. Repository layout

```text
supercampus_backend/
├── .cursor/rules/project-prompt.mdc   # always-on pointer to the project prompt
├── .env                                # local values (not committed)
├── .env.example                        # committed template
├── docker-compose.yml                  # MySQL, Redis, MinIO
├── docs/
│   ├── ARCHITECTURE_AND_CODE_STRUCTURE.md
│   └── PROJECT_GUIDE.md
├── prompt/
│   ├── prompt.txt                      # source of truth
│   └── README.md
├── scripts/mysql-init/                 # first-boot campus databases
└── src/
    ├── config/
    ├── core/
    └── modules/
```

---

## 3. `src/` blueprint

```text
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   └── storage.config.ts
├── core/
│   ├── auth/          # login, JWT strategy, JwtAuthGuard, RolesGuard
│   ├── tenant/        # resolve campus from JWT or X-Tenant-Id
│   ├── database/      # TenantConnectionManager, DbClientService, @Transactional
│   ├── audit/         # field-level subscriber, history API
│   ├── redis/
│   ├── storage/       # MinIO
│   ├── common/        # ApiResponseDto, PaginationMetaDto, filters
│   └── models/        # Base, BaseLegacy, BaseCamelCaseLegacy
└── modules/
    ├── user/
    ├── campus/
    ├── community/
    ├── food/
    ├── outpass/
    ├── sports/
    ├── marketplace/
    ├── project/
    └── internship/
```

---

## 4. Layer flow

```text
Controller  →  Service  →  DataService  →  Repository  →  MySQL
```

| Layer | Owns | Must not |
| :--- | :--- | :--- |
| Controller | HTTP, DTO validation, Swagger, `ApiResponseDto` | Business rules, Repository, DataService |
| Service | Business rules, transactions, calls to other modules’ Services | Direct Repository access |
| DataService | EntityManager for this campus, this module’s Repository | Business rules, other modules |
| Repository | Queries and saves | Services, other repositories, business rules |
| Entity | Table mapping | Business rules |

Another module’s data is reached only through that module’s **Service**.

---

## 5. Feature folder (every business module)

```text
src/modules/outpass/
├── controller/outpass.controller.ts
├── service/outpass.service.ts
├── service/outpass-data.service.ts
├── repository/outpass.repository.ts
├── entity/outpass.model.ts
├── dto/request/create-outpass.req.dto.ts
├── dto/request/update-outpass.req.dto.ts
├── dto/response/outpass.res.dto.ts
├── mapper/outpass.mapper.ts
└── outpass.module.ts
```

Replace `outpass` with the module name. Register that module’s entities in `onModuleInit()`.

---

## 6. Planned modules and the mobile app

| Module | Mobile surface | Responsibility |
| :--- | :--- | :--- |
| `user` | Login, profile | Account, session user, role |
| `campus` | Campus selector (“NMIT campus”) | Campus directory; `global` DB |
| `community` | Trending on SuperCampus | Posts and campus feed |
| `food` | Food for you / Food & Bites | Cafes and menus |
| `outpass` | Gate Pass | Outpass requests and QR |
| `sports` | Arena & Turf, sports booking | Courts and slot bookings |
| `marketplace` | Marketplace | Campus listings |
| `project` | Collab Lab | Team finding |
| `internship` | Internships for you | Internship cards |

Roles on the token: `SUPER_ADMIN`, `CAMPUS_ADMIN`, `FACULTY`, `STUDENT`. The app’s `admin` role is `CAMPUS_ADMIN`.

---

## 7. Campus databases

Namespace mode (default):

| Namespace | Database | Meaning |
| :--- | :--- | :--- |
| `global` | `supercampus_global` | Platform and campus directory |
| `nmit` | `supercampus_nmit` | NMIT campus data |

Request campus comes from the JWT claim `tenantId` or the header `X-Tenant-Id`.

Prefix mode (optional): `DB_DATABASE_PREFIX=campus_db_` and no `NAMESPACES`. Campus `nmit` then uses `campus_db_nmit`.

---

## 8. HTTP contract

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errorCode": null
}
```

Lists put `{ "data": [], "meta": {} }` inside `data`. Query: `page` (default 1), `limit` (default 20, max 100).

| Endpoint | Auth |
| :--- | :--- |
| `POST /api/v1/auth/login` | Public. Body: `email`, `password`, optional `tenantId` |
| Other `/api/v1/**` | `Authorization: Bearer <token>` |
| `GET /api/v1/audit-history?entityName=&entityId=` | Auth required |

Swagger: `http://localhost:3001/api/docs` (`npm run start:dev`). It documents Auth and Document Uploader.

---

## 9. Local infrastructure

| Service | Container | Host port |
| :--- | :--- | :--- |
| MySQL 8.1 | `supercampus-mysql` | `3310` |
| Redis 7 | `supercampus-redis` | `6381` |
| MinIO API | `supercampus-minio` | `9010` |
| MinIO console | `supercampus-minio` | `9011` |

User `supercampus` / password `supercampus_dev` (local only). Bucket `supercampus-storage`. Root password `supercampus_root`.

`scripts/mysql-init/01-create-databases.sql` creates `supercampus_nmit` the first time the MySQL volume is created. `supercampus_global` is created by the container `MYSQL_DATABASE` setting.

These ports stay clear of the IEBA containers (`dev-mysql` on 3307, Redis on 6379, MinIO on 9000).
