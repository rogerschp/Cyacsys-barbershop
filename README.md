# Cyacsys API — Beauty & wellness professionals (multi-tenant)

REST API for multi-tenant beauty and wellness businesses: tenants, members, **team invitations**, **notifications (mock)**, **global professional profiles**, per-establishment links, services, **contextual scheduling**, **bookings**, **reviews**, **media upload (Cloudinary)**, **subscription plans**, **reports**, **public search**, **tenant theming**, and **Firebase + JWT** authentication.

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

### Core platform

| Area                     | Description                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**                 | Firebase login, refresh, logout                                                                                                                            |
| **Multi-tenant**         | Establishments with slug, IANA timezone, status, address, CNPJ, social links                                                                               |
| **Members**              | User ↔ tenant (OWNER, ADMIN, STAFF, BARBER)                                                                                                                |
| **Users**                | Global CRUD; optional `professionalProfile` in responses                                                                                                   |
| **Professional profile** | Global identity (type, `bookingMode`, contacts)                                                                                                            |
| **Tenant professional**  | Professional ↔ tenant link                                                                                                                                 |
| **Services**             | Catalog per tenant                                                                                                                                         |
| **Availability**         | Working hours, time off, blocks, offered services, **bootstrap week**, slots (`tenantProfessionalId`); `available-slots` excludes DRAFT/CONFIRMED bookings |
| **Booking**              | Draft / confirm driven by `bookingMode`; linked client user; responses as `BookingResponseDto`                                                             |
| **Media**                | Hexagonal upload/storage (Cloudinary); paths via `MEDIA_ENV` (`dev/` vs `prod/`); never accept `storagePath` from clients                                  |
| **API docs**             | Swagger/OpenAPI at `/api`                                                                                                                                  |
| **Quality**              | DTOs with `class-validator`; TypeORM migrations; unit and e2e tests; CI (lint, test, typecheck, build)                                                     |

### Growth & monetization

| Area               | Description                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Plans**          | FREE, STANDARD, PRO, ELITE — public catalog at `GET /plans`                                                       |
| **Subscriptions**  | Auto FREE plan on tenant creation; current subscription + history per tenant                                      |
| **Plan gating**    | `SubscriptionGuard` + `@RequiresPlan()` on reports and theme; `AssertTenantPlanFeatureUseCase` on review creation |
| **Admin billing**  | SUPER_ADMIN manual activation and forced expiration (testing)                                                     |
| **Expiration job** | Daily cron downgrades expired paid plans                                                                          |

### Discovery & reputation

| Area               | Description                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Search**         | Public tenant search by name, slug, segment, and geo proximity (Haversine)                                            |
| **Reviews**        | Ratings for tenants and professionals; public list; create requires STANDARD+ plan (`403` on FREE); OWNER/ADMIN reply |
| **Tenant profile** | Segment, avatar, latitude/longitude for discovery; editable via `PATCH /tenants/:id` (OWNER/ADMIN)                    |

### Analytics & branding

| Area             | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Reports**      | STANDARD (current month), PRO (3 months), ELITE (6 months) — revenue and booking metrics |
| **Export**       | ELITE plan: PDF or Excel export of the advanced report                                   |
| **Tenant theme** | Public JSON theme for the establishment page; upsert/delete gated by plan tier           |

### Security & ops

| Area              | Description                                        |
| ----------------- | -------------------------------------------------- |
| **Rate limiting** | Global `ThrottlerGuard` (60 req/min)               |
| **Helmet**        | HTTP security headers                              |
| **CORS**          | Configurable via `CORS_ORIGINS`                    |
| **Docker**        | `docker-compose.yml` for local API + PostgreSQL 16 |

---

## Domain model

```
User
 └── ProfessionalProfile (global)
      ├── Reviews (professional target)
      └── TenantProfessional (per tenant)
           ├── Availability
           └── Booking

Tenant
 ├── TenantUser (membership + roles)
 ├── TenantSubscription → Plan
 ├── Services
 ├── Reviews (tenant target)
 ├── Reports (aggregated from bookings)
 ├── Theme (JSONB, optional)
 └── Media (optional refs; `avatarUrl` string still used)

Media (global table)
 └── Cloudinary (or future S3) via IStorageProvider
```

- Any user can be a client and a professional; there is **no** `isProfessional` flag.
- Frontend: `GET /users/me` → treat as professional when `professionalProfile !== null`.
- New tenants receive an **ACTIVE FREE** subscription automatically.

---

## Documentation

Portuguese docs live under [`docs/`](docs/README.md). Start here:

| Audience | Doc |
|----------|-----|
| Front / AI handoff | [docs/FRONTEND_API_GUIDE.md](docs/FRONTEND_API_GUIDE.md) |
| HTTP contracts | [docs/FRONTEND_INTEGRACAO.md](docs/FRONTEND_INTEGRACAO.md) |
| Backend | [docs/DESENVOLVEDORES.md](docs/DESENVOLVEDORES.md) |
| Media module | [docs/media.md](docs/media.md) |
| Team / invitations | [docs/team.md](docs/team.md) |
| Notifications | [docs/notification.md](docs/notification.md) |
| Product | [docs/PRODUTO_NEGOCIOS.md](docs/PRODUTO_NEGOCIOS.md) |

---

## Tech stack

| Technology         | Use                                   |
| ------------------ | ------------------------------------- |
| NestJS             | HTTP, modules, guards, scheduled jobs |
| TypeORM            | ORM, PostgreSQL migrations            |
| Firebase Admin     | Authentication                        |
| Cloudinary         | Media upload / CDN (`STORAGE_PROVIDER`) |
| Swagger            | OpenAPI at `/api`                     |
| Jest + Supertest   | Unit and e2e tests                    |
| Luxon              | Tenant timezone handling              |
| ExcelJS + PDFKit   | Report export (ELITE)                 |
| Helmet + Throttler | Security headers and rate limiting    |
| `@nestjs/schedule` | Subscription expiration cron          |

---

## Setup

### Local (Node + PostgreSQL)

```bash
git clone <repository-url>
cd cyacsys-barbershop
yarn install
cp .envExample .env
# Set DB_*, FIREBASE_*, MEDIA_*/CLOUDINARY_*, and optionally CORS_ORIGINS
yarn migration:run
yarn start:dev
```

Prefer a **separate Firebase project** for local vs production when sharing Cloudinary/DB setups would otherwise mix auth identities across environments.

### Docker (API + PostgreSQL 16)

```bash
cp .envExample .env
# DB_HOST=postgres, DB_PORT=5432, DB_USERNAME=barber, DB_PASSWORD=barber, DB_DATABASE=barber
docker compose up --build
# first run: docker compose exec api yarn migration:run
```

| Variable         | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `DB_*`           | PostgreSQL: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` |
| `DB_SSL`         | `true` / `require` for Neon/Render; `false` for local Docker |
| `DATABASE_URL`   | Optional full connection string (Neon)                  |
| `FIREBASE_*` / `API_KEY` | Firebase Admin + client API key (exact names; see `.envExample`) |
| `STORAGE_PROVIDER` | `cloudinary` (default) or `aws` when S3 is implemented |
| `MEDIA_ENV`      | `dev` (local) or `prod` (Render) — folder root in Cloudinary |
| `CLOUDINARY_*`   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `CORS_ORIGINS`   | Comma-separated allowed browser origins                 |
| `PORT`           | HTTP port (default `3000`)                              |
| `NODE_ENV`       | `production` hides Swagger unless `EXPOSE_SWAGGER=true` |
| `EXPOSE_SWAGGER` | Set `true` in production to expose `/api`               |

---

## Migrations

```bash
yarn migration:run
```

Run all pending migrations on a fresh database. Key groups:

### Professional profile refactor

See [docs/refactor-professional-profile.md](docs/refactor-professional-profile.md).

| Order | Migration       | Purpose                                                  |
| ----- | --------------- | -------------------------------------------------------- |
| 1     | `1779000000000` | `professional_profiles`                                  |
| 2     | `1779100000000` | `tenant_professionals` + backfill from `barber_profiles` |
| 3     | `1779200000000` | Availability → `tenant_professional_id`                  |
| 4     | `1779300000000` | Booking → `tenant_professional_id`                       |
| 5     | `1779400000000` | Drop `barber_profiles`                                   |
| 6     | `1779500000000` | Booking → `client_user_id`                               |

If `AvailabilityUseTenantProfessional` fails on a missing `FK_working_hours_barber_profile`, pull the latest code (FK drop is resolved dynamically) and run `migration:run` again.

### Platform extensions

| Migration       | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `1780000000000` | Reviews table                                                  |
| `1781000000000` | Subscription tables (`plans`, `tenant_subscriptions`, history) |
| `1781000000001` | Seed FREE / STANDARD / PRO / ELITE plans                       |
| `1782000000000` | Tenant segment, avatar, coordinates                            |
| `1782000000001` | Tenant theme (JSONB)                                           |
| `1782000000002` | Booking indexes for reports                                    |
| `1787000000000` | Media table (Cloudinary metadata + soft delete)                |

---

## API documentation (Swagger)

[http://localhost:3000/api](http://localhost:3000/api) — Bearer JWT where marked. Tenant-scoped routes require active membership.

### Access rules (summary)

- Tenant routes: `BearerAuthGuard` → `TenantResolverGuard` (or `TenantInterceptor`) → `TenantMembershipGuard` → `TenantRolesGuard`.
- Plan-gated routes add `SubscriptionGuard` and `@RequiresPlan(feature)`.
- Effective roles: OWNER satisfies OWNER/ADMIN/STAFF/BARBER; ADMIN satisfies ADMIN/STAFF; STAFF satisfies STAFF; BARBER satisfies BARBER.
- BARBER manages only their own `tenantProfessionalId` on availability/booking (see [docs/RBAC.md](docs/RBAC.md)).

### Public routes (no auth)

| Route                                             | Description                 |
| ------------------------------------------------- | --------------------------- |
| `GET /plans`                                      | Active plans and features   |
| `GET /search/tenants`                             | Paginated tenant discovery  |
| `GET /tenants/:tenantId/theme`                    | Public theme + current plan |
| `GET /tenants/:tenantId/reviews`                  | Tenant reviews              |
| `GET /users/:userId/professional-profile/reviews` | Professional reviews        |

### Subscription plans (summary)

| Plan     | Reports                 | Reviews (create) | Marketplace   | Theme        | Export      |
| -------- | ----------------------- | ---------------- | ------------- | ------------ | ----------- |
| FREE     | —                       | —                | —             | defaults     | —           |
| STANDARD | basic (1 month)         | ✓                | ✓             | basic        | —           |
| PRO      | intermediate (3 months) | ✓                | ✓ + highlight | intermediate | —           |
| ELITE    | advanced (6 months)     | ✓                | ✓ + badge     | full         | PDF / Excel |

Review **listing** is public; **creating** a review requires a plan with `reviews: true` (STANDARD+).

---

## Tests

```bash
yarn test              # unit
yarn test:e2e          # e2e
yarn test:cov          # coverage
yarn test:search       # search module only
```

CI runs lint, unit tests, TypeScript check, and build on push/PR to `master`, `develop`, and feature branches.

```bash
npx jest --config jest.config.ts --testPathPattern="professional-profile|tenant-professional|subscription|report|search|tenant-theme|media"
npx jest --config jest-e2e.json --testPathPattern="booking|availability|report|search|tenant-theme"
```

E2e specs live under `src/test/`: `tenant`, `user`, `service`, `professional-profile`, `tenant-professional`, `availability`, `booking`, `report`, `search`, `tenant-theme`. Media has unit coverage under `src/test/unit/media/`.

---

## Project structure

```
src/
├── common/            # guards, decorators, filters, exceptions
├── config/            # TypeORM + media.config (MEDIA_ENV)
├── database/migrations/
├── modules/
│   ├── auth/
│   ├── availability/
│   ├── booking/
│   ├── media/         # upload + storage (Cloudinary)
│   ├── notification/  # event → router → template → provider → record
│   ├── professional-profile/
│   ├── tenant-professional/
│   ├── firebase/
│   ├── report/
│   ├── review/
│   ├── search/
│   ├── service/
│   ├── subscription/
│   ├── team/          # onboard + invitations
│   ├── tenant/
│   ├── tenant-theme/
│   ├── tenant-user/
│   └── user/
├── repository/
└── test/              # e2e (*.e2e-spec.ts) + unit/ specs
docs/                  # Per-module documentation (PT)
```

### Notable endpoints

| Endpoint                                                  | Notes                                                                                  |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `POST /tenants/:tenantId/team/onboard`                    | Add member by email or create invitation (OWNER/ADMIN)                                 |
| `GET /tenants/:tenantId/team`                             | List members                                                                           |
| `POST /media/upload`                                      | Multipart upload; path from `mediaType` + context; see [docs/media.md](docs/media.md)  |
| `POST /media` · `GET/DELETE /media/:id`                   | Register existing asset / fetch / soft-delete                                          |
| `PATCH /users/me/deactivate`                              | Self-service: `INACTIVE` + Firebase disable (not soft-delete)                          |
| `PATCH /tenants/:id`                                      | Update tenant; includes `segment`, `avatarUrl`, `latitude`/`longitude` (pair required) |
| `POST .../working-hours/bootstrap-week`                   | Configure full week with `closedDays` and `periods`                                    |
| `GET .../available-slots`                                 | Returns free slots; excludes DRAFT/CONFIRMED bookings                                  |
| `GET /tenants/:tenantId/reports/{standard\|pro\|elite}`   | Plan-gated analytics                                                                   |
| `GET /tenants/:tenantId/reports/export?format=pdf\|excel` | ELITE export                                                                           |
| `GET /search/tenants?lat=&lng=&radius=`                   | Geo search (max 50 km)                                                                 |
| `PUT /tenants/:tenantId/theme`                            | OWNER/ADMIN; requires customization feature                                            |
| `POST /admin/subscriptions/activate`                      | SUPER_ADMIN only                                                                       |

---

## Breaking changes

`/tenants/:id/barber-profiles` routes were **removed**. See [docs/BREAKING-CHANGES.md](docs/BREAKING-CHANGES.md).

---

## License

Proprietary — Cyacsys. All rights reserved.
