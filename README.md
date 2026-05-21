# Cyacsys API — Profissionais de estética (multi-tenant)

API REST multi-tenant para estabelecimentos de estética e bem-estar: tenants, membros, **perfil profissional global**, vínculo por estabelecimento, serviços, **agenda contextual**, **agendamentos** e autenticação **Firebase + JWT**.

Construída com [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) e PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Modelo de domínio](#modelo-de-domínio)
- [Documentação](#documentação)
- [Stack](#stack-tecnológica)
- [Instalação e execução](#instalação)
- [Migrations](#migrations)
- [Swagger](#documentação-da-api-swagger)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Breaking changes](#breaking-changes)

---

## Funcionalidades

| Área | Descrição |
|------|-----------|
| **Auth** | Login Firebase, refresh, logout |
| **Multi-tenant** | Estabelecimentos com slug, timezone IANA, status |
| **Membros** | Usuário ↔ tenant (OWNER, ADMIN, STAFF, BARBER) |
| **Usuários** | CRUD global; `professionalProfile` opcional na resposta |
| **Perfil profissional** | Identidade global (tipo, bookingMode, contatos) |
| **Tenant professional** | Vínculo profissional ↔ tenant |
| **Serviços** | Catálogo por tenant |
| **Disponibilidade** | Jornada, folgas, bloqueios, slots (por `tenantProfessionalId`) |
| **Booking** | Rascunho/confirmação conforme `bookingMode` |

---

## Modelo de domínio

```
User
 └── ProfessionalProfile (global)
      └── TenantProfessional (por tenant)
           ├── Availability
           └── Booking
```

- Qualquer usuário pode ser cliente e profissional; **não** há `isProfessional`.
- Frontend: `GET /users/me` → `professionalProfile !== null`.

---

## Documentação

| Recurso | Caminho |
|---------|---------|
| Índice dos módulos | [docs/README.md](docs/README.md) |
| Migração da API antiga | [docs/BREAKING-CHANGES.md](docs/BREAKING-CHANGES.md) |
| RBAC | [docs/RBAC.md](docs/RBAC.md) |
| Escopo / hardening | [docs/HARDENING.md](docs/HARDENING.md) |

---

## Stack tecnológica

| Tecnologia | Uso |
|------------|-----|
| NestJS | HTTP, módulos, guards |
| TypeORM | ORM, migrations PostgreSQL |
| Firebase Admin | Auth |
| Swagger | OpenAPI em `/api` |
| Jest + Supertest | Testes |
| Luxon | Timezone do tenant |

---

## Instalação

```bash
git clone <url-do-repositorio>
cd cyacsys-barbershop
yarn install
cp .envExample .env
# Preencha DB_* e FIREBASE_*
yarn migration:run
yarn start:dev
```

---

## Migrations

```bash
yarn migration:run
```

Ordem relevante do refactor profissional: ver [docs/refactor-professional-profile.md](docs/refactor-professional-profile.md).

---

## Documentação da API (Swagger)

[http://localhost:3000/api](http://localhost:3000/api) — Bearer JWT. Rotas por tenant exigem membership ativo.

---

## Testes

```bash
yarn test              # unitários
yarn test:e2e          # e2e
yarn test:cov
```

Exemplos:

```bash
npx jest --config jest.config.ts --testPathPattern="professional-profile|tenant-professional"
npx jest --config jest-e2e.json --testPathPattern="booking|availability"
```

---

## Estrutura do projeto

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
docs/                  # Documentação por módulo
```

---

## Breaking changes

Rotas `/tenants/:id/barber-profiles` foram **removidas**. Ver [docs/BREAKING-CHANGES.md](docs/BREAKING-CHANGES.md).

---

## Licença

Projeto proprietário — Cyacsys. Todos os direitos reservados.
