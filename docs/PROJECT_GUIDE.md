# Supercampus Backend – Project Guide

This document describes the **codebase structure**, **architecture rules**, and **conventions** for this project. It follows the same standard as the IEBA v2 backend. All developers must follow these rules so the codebase stays consistent.

The repository is **scaffold-only**: docs, local env, and empty module folders. Application code is added when a feature is requested.

---

## Source of truth: `prompt/prompt.txt`

The **canonical specification** is **`prompt/prompt.txt`**. It defines:

- Clean Architecture and strict separation of concerns
- Tech stack (NestJS, TypeScript, TypeORM, MySQL, Redis, MinIO, JWT, Swagger)
- Layer rules (Controller → Service → DataService → Repository → Database)
- DTO, mapper, base-entity, pagination, API response, and audit standards
- Multi-campus database architecture and tenant context
- Transaction management, JWT auth, RBAC, logging and error handling
- Naming conventions and DEVELOPMENT RULES (NEVER / ALWAYS)

**This guide** aligns with the prompt and documents how we implement it:

- We add a **DataService** layer (Service → DataService → Repository) for campus-scoped data access. The flow “Service → Repository” is satisfied by “Service → DataService → Repository”. No business logic in Repository. Controller never touches Repository or DataService.
- **Cross-module:** services may call other services only. No cross-module use of Repository or DataService.

When in doubt, follow **`prompt/prompt.txt`** first, then this guide.

The folder map is also written in `docs/ARCHITECTURE_AND_CODE_STRUCTURE.md`.

---

## 1. Project overview

- **Purpose:** NestJS API for the Supercampus mobile app (campus feed, food, gate pass, sports, marketplace, collab lab, internships).
- **Tech stack:** NestJS, TypeScript, TypeORM, MySQL 8, Redis, MinIO, JWT, Swagger.
- **Key requirements:** One MySQL database per campus, tenant-aware connections, field-level audit logging, clean separation of concerns, service-to-service communication across modules.

Local API port is **3001**. Infrastructure ports are offset from the IEBA dev stack (MySQL `3310`, Redis `6381`, MinIO `9010`).

---

## 2. Codebase structure

```
src/
├── app.module.ts
├── main.ts
├── config/                    # database, jwt, redis, storage
├── core/                      # platform / infrastructure
│   ├── auth/                  # JWT, login, guards
│   ├── tenant/                # campus resolution, TenantContextService
│   ├── database/              # DbClientService, TenantConnectionManager, @Transactional
│   ├── audit/                 # audit subscriber, audit service, audit history API
│   ├── redis/
│   ├── storage/               # MinIO
│   ├── common/                # ApiResponseDto, PaginationMetaDto, filters, decorators
│   └── models/                # base.model.ts (Base, BaseLegacy, BaseCamelCaseLegacy)
└── modules/                   # business features
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

These folders exist. TypeScript files are added with the feature that needs them.

---

## 3. Feature module structure (mandatory)

Each business module must follow this layout:

```
modules/<module-name>/
├── controller/
│   └── <module>.controller.ts
├── service/
│   ├── <module>.service.ts           # business logic, orchestration
│   └── <module>-data.service.ts      # data access only, talks to repository
├── repository/
│   └── <module>.repository.ts
├── entity/
│   └── <module>.model.ts
├── dto/
│   ├── request/
│   │   ├── create-<module>.req.dto.ts
│   │   ├── update-<module>.req.dto.ts
│   │   └── <module>-list-query.dto.ts
│   └── response/
│       └── <module>.res.dto.ts
├── mapper/
│   └── <module>.mapper.ts
└── <module>.module.ts
```

- **Entity registration:** In `<module>.module.ts`, use `registerEntities([...])` in `onModuleInit()` for every entity owned by this module.

---

## 4. Architecture layers and dependency flow

### 4.1 Within a module

```
Controller  →  Service  →  DataService  →  Repository  →  Database
```

| Layer | Responsibility |
|-------------|----------------|
| **Controller** | HTTP only. Calls **Service** only. Uses DTOs and Swagger. No business logic, no repository. |
| **Service** | Business logic and orchestration. Calls **same-module DataService** only. For another domain, calls **that module’s Service**. Uses `TenantContextService` for namespace. May use `@Transactional()`. Returns DTOs. |
| **DataService** | Data access for this module only. Gets `EntityManager` via `DbClientService.getEntityManager(namespace)` and instantiates **same-module Repository**. No business logic. |
| **Repository** | TypeORM only. Accepts `EntityManager` in the constructor. No business logic. No calls to other repositories or services. |

### 4.2 Cross-module: use Service, never Repository

When **module A** needs data that belongs to **module B**:

- **Do:** Call **B’s Service**.
- **Do not:** Call B’s Repository, B’s DataService, or query B’s tables from A.

Example:

- **Outpass** needs the student’s profile.
- **Correct:** `OutpassService` injects `UserService` and calls `userService` for that profile.
- **Wrong:** Outpass repository querying the user table.

Module B **exports** its Service. Module A **imports** module B.

---

## 5. Naming conventions

| Artifact | Convention | Example |
|----------------|-------------------------|---------|
| Entity | PascalCase, `.model.ts` | `user.model.ts`, `User` |
| Request DTO | `CreateXxxReqDto`, `UpdateXxxReqDto`, `XxxListQueryDto` | `create-user.req.dto.ts` |
| Response DTO | `XxxResDto`, `XxxListResponseDto` | `user.res.dto.ts` |
| Repository | `XxxRepository` | `UserRepository` |
| DataService | `XxxDataService` | `UserDataService` |
| Service | `XxxService` | `UserService` |
| Controller | `XxxController` | `UserController` |
| Mapper | `XxxMapper` | `UserMapper` |

---

## 6. API response format and pagination

### 6.1 Standard response wrapper

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errorCode": null
}
```

- Use `ApiResponseDto.success(result, "Success")` in controllers.
- Use `ApiResponseDto.error(message, errorCode, data)` for errors.

### 6.2 List endpoints

- Shape inside `data`: `{ data: ItemDto[], meta: PaginationMetaDto }`.
- Use `PaginationMetaDto.from(totalItems, currentPage, itemsPerPage, itemCount)`.
- Query params: `page` (default 1), `limit` (default 20, max 100).

---

## 7. Multi-campus and tenant context

- **One MySQL database per campus.**
- **Namespace mode (this repo):** `ENVIRONMENT=LOCAL` and `NAMESPACES=global,nmit`.
  - `global.LOCAL.DB_DATABASE=supercampus_global`
  - `nmit.LOCAL.DB_DATABASE=supercampus_nmit`
- **Prefix mode:** omit `ENVIRONMENT` / `NAMESPACES` and set `DB_DATABASE_PREFIX=campus_db_`. Then `nmit` → `campus_db_nmit`.
- Campus id comes from the JWT or `X-Tenant-Id` and is stored in **TenantContextService**.
- **DataService and Repository** do not resolve the campus. The **Service** reads `namespace = this.tenantContext.getTenantId()` and passes it to DataService.
- **DbClientService.getEntityManager(namespace)** returns the TypeORM `EntityManager` for that campus DataSource.

`global` holds platform data (campus directory). Each campus code is its own database.

---

## 8. Base entities

- Tables with only `created_at`, `created_by`, `updated_at`, `updated_by`: use **BaseLegacy** (snake_case) or **BaseCamelCaseLegacy** (camelCase). Do not add `deleted_at` / `deleted_by` in the entity if the table does not have those columns.
- Tables that already have full audit and soft delete: use **Base** (or the matching camelCase base).
- Do not invent columns. Add a column in an entity only together with a migration applied to the campus databases.

---

## 9. DTOs and mappers

- **Request DTOs:** `class-validator` and `class-transformer`.
- **Response DTOs:** the exact shape returned to the client. Do not expose internal-only fields.
- **Mappers:** ReqDTO → Entity and Entity → ResDTO. Controllers and services do not map by hand.

---

## 10. Transactions

- Transactions are **campus-aware** and start in the **Service** layer.
- Use `@Transactional()` on the service method that must run in one transaction.
- Repository calls in that transaction share the same manager.

---

## 11. Authentication and guards

- Protected APIs use `JwtAuthGuard`.
- Public routes are marked `@Public`.
- `JwtAuthGuard` must run the JWT strategy so `request.user` is set. Do not return `true` early on protected routes.
- Roles: `SUPER_ADMIN`, `CAMPUS_ADMIN`, `FACULTY`, `STUDENT`.
- Mobile `admin` maps to `CAMPUS_ADMIN`.
- Login: `POST /api/v1/auth/login` with `{ "email", "password", "tenantId?" }`.
- Protected calls send `Authorization: Bearer <token>`.

---

## 12. Logging and error handling

- Use NestJS `Logger`: `private readonly logger = new Logger(ClassName.name)`.
- Levels: `error`, `warn`, `log`, `debug`. Include userId, namespace, entityId. Do not log passwords or tokens.
- Re-throw known HTTP exceptions as-is. For unexpected errors, log message and stack, then re-throw or wrap as 500. Do not swallow errors.

---

## 13. Rules summary – NEVER / ALWAYS

**NEVER:**

- Access **Repository** or **DataService** from a **Controller**.
- Access **another module’s Repository or DataService**. Use that module’s **Service**.
- Put business logic in Controller or Repository.
- Return entities directly from APIs.
- Add database columns in entities that are not in the schema.

**ALWAYS:**

- Use **Service** for orchestration and for calling other modules.
- Use **DataService** as the only layer that talks to **Repository** in the same module.
- Use DTOs, mappers, `ApiResponseDto`, and pagination `{ data, meta }` on lists.
- Resolve campus in the Service and pass namespace to DataService.
- Register entities in the owning module’s `onModuleInit()`.

---

## 14. Adding a feature that needs another module’s data

1. In **module B** (owner of the data): expose a method on **B’s Service**. Implement it through B’s DataService and Repository.
2. In **module A**: `imports: [BModule]`, inject **B’s Service**, and call it.
3. Do not inject B’s Repository or DataService in A. Do not query B’s tables from A’s Repository.

---

## 15. Prompt alignment checklist

| Topic | Prompt section | Implementation |
|-------|----------------|----------------|
| Layer flow | ARCHITECTURE LAYER RULES | Controller → Service → DataService → Repository |
| Cross-module | Service → Service only | Never Repository or DataService across modules |
| DTOs | DTO RULES, MAPPER RULES | class-validator on request DTOs; mappers for ReqDTO ↔ Entity ↔ ResDTO |
| Entities | BASE ENTITY STANDARD | Base / BaseLegacy / BaseCamelCaseLegacy matched to real columns |
| API response | STANDARD API RESPONSE FORMAT | ApiResponseDto.success / .error |
| Pagination | PAGINATION | `{ data, meta }`; `page`, `limit` |
| Campus | MULTI-TENANT | TenantContextService; namespace passed from Service to DataService |
| Transactions | TRANSACTION MANAGEMENT | `@Transactional()` in Service |
| Auth | JWT, RBAC | JwtAuthGuard; RolesGuard; campus roles |
| Logging | LOGGING AND ERROR HANDLING | NestJS Logger; re-throw HttpException |

---

*This guide follows **`prompt/prompt.txt`**. Cross-module communication is via **Service only**.*
