# Cyacsys API — Beauty & wellness professionals (multi-tenant)

REST API for multi-tenant beauty and wellness businesses: tenants, members, **global professional profiles**, per-establishment links, services, **contextual scheduling**, **bookings**, and **Firebase + JWT** authentication.

Built with [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/), and PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## Table of contents

- [Features](#features)
- [Domain model](#domain-model)
- [Documentation](#documentation)
- [Tech stack](#tech-stack)
- [Setup](#setup)
- [Migrations](#migrations)
- [Swagger](#api-documentation-swagger)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Breaking changes](#breaking-changes)

---

## Features

| Area | Description |
|------|-------------|
| **Auth** | Firebase login, refresh, logout |
| **Multi-tenant** | Establishments with slug, IANA timezone, status |
| **Members** | User ↔ tenant (OWNER, ADMIN, STAFF, BARBER) |
| **Users** | Global CRUD; optional `professionalProfile` in responses |
| **Professional profile** | Global identity (type, `bookingMode`, contacts) |
| **Tenant professional** | Professional ↔ tenant link |
| **Services** | Catalog per tenant |
| **Availability** | Working hours, time off, blocks, offered services, **bootstrap week**, slots (`tenantProfessionalId`) |
| **Booking** | Draft / confirm driven by `bookingMode` |
| **API docs** | Swagger/OpenAPI at `/api` |
| **Quality** | DTOs with `class-validator`; TypeORM migrations; unit and e2e tests |

---

## Domain model

```
User
 └── ProfessionalProfile (global)
      └── TenantProfessional (per tenant)
           ├── Availability
           └── Booking
```

- Any user can be a client and a professional; there is **no** `isProfessional` flag.
- Frontend: `GET /users/me` → treat as professional when `professionalProfile !== null`.

---

## Documentation

| Resource | Path |
|----------|------|
| Module index (PT) | [docs/README.md](docs/README.md) |
| Migration from legacy API | [docs/BREAKING-CHANGES.md](docs/BREAKING-CHANGES.md) |
| Refactor overview | [docs/refactor-professional-profile.md](docs/refactor-professional-profile.md) |
| RBAC | [docs/RBAC.md](docs/RBAC.md) |
| Scope / hardening | [docs/HARDENING.md](docs/HARDENING.md) |

---

## Tech stack

| Technology | Use |
|------------|-----|
| NestJS | HTTP, modules, guards |
| TypeORM | ORM, PostgreSQL migrations |
| Firebase Admin | Authentication |
| Swagger | OpenAPI at `/api` |
| Jest + Supertest | Tests |
| Luxon | Tenant timezone handling |

---

## Setup

```bash
git clone <repository-url>
cd cyacsys-barbershop
yarn install
cp .envExample .env
# Set DB_* and FIREBASE_*
yarn migration:run
yarn start:dev
```

---

## Migrations

```bash
yarn migration:run
```

Professional-profile refactor order: see [docs/refactor-professional-profile.md](docs/refactor-professional-profile.md).

| Order | Migration | Purpose |
|-------|-----------|---------|
| 1 | `1779000000000` | `professional_profiles` |
| 2 | `1779100000000` | `tenant_professionals` + backfill from `barber_profiles` |
| 3 | `1779200000000` | Availability → `tenant_professional_id` |
| 4 | `1779300000000` | Booking → `tenant_professional_id` |
| 5 | `1779400000000` | Drop `barber_profiles` |

If `AvailabilityUseTenantProfessional` fails on a missing `FK_working_hours_barber_profile`, pull the latest code (FK drop is resolved dynamically) and run `migration:run` again. Migrations `177900` and `177910` are not re-run.

---

## API documentation (Swagger)

[http://localhost:3000/api](http://localhost:3000/api) — Bearer JWT. Tenant-scoped routes require active membership.

### Access rules (summary)

- Tenant routes: `BearerAuthGuard` → `TenantResolverGuard` (or `TenantInterceptor`) → `TenantMembershipGuard` → `TenantRolesGuard`.
- Effective roles: OWNER satisfies OWNER/ADMIN/STAFF/BARBER; ADMIN satisfies ADMIN/STAFF; STAFF satisfies STAFF; BARBER satisfies BARBER.
- BARBER manages only their own `tenantProfessionalId` on availability/booking (see [docs/RBAC.md](docs/RBAC.md)).

---

## Tests

```bash
yarn test              # unit
yarn test:e2e          # e2e
yarn test:cov
```

Global coverage threshold in CI: **≥ 80%** (statements, branches, functions, lines).

```bash
npx jest --config jest.config.ts --testPathPattern="professional-profile|tenant-professional"
npx jest --config jest-e2e.json --testPathPattern="booking|availability"
```

---

## Project structure

```
src/
├── common/
├── config/
├── database/migrations/
├── modules/
│   ├── auth/
│   ├── availability/
│   ├── booking/
│   ├── professional-profile/
│   ├── tenant-professional/
│   ├── firebase/
│   ├── service/
│   ├── tenant/
│   ├── tenant-user/
│   └── user/
├── repository/
├── test/              # *.e2e-spec.ts
└── test/unit/
docs/                  # Per-module documentation
```

### Bootstrap week (availability)

`POST /tenants/:tenantId/tenant-professionals/:tenantProfessionalId/working-hours/bootstrap-week` — configure the full week with `closedDays` and `periods`; `overwriteExisting` defaults to `true`.

---

## Breaking changes

`/tenants/:id/barber-profiles` routes were **removed**. See [docs/BREAKING-CHANGES.md](docs/BREAKING-CHANGES.md).

---

## License

Proprietary — Cyacsys. All rights reserved.
