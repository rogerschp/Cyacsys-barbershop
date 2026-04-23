# Cyacsys Barbershop API

API REST multi-tenant para gestão de barbearias: tenants, membros, serviços, perfis de barbeiro, **disponibilidade/agenda**, **agendamentos (booking)** e autenticação via **Firebase + JWT**. Construída com [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) e PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Documentação detalhada (por módulo)](#documentação-detalhada-por-módulo)
- [Stack tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Docker](#docker)
- [Executando o projeto](#executando-o-projeto)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [Licença](#licença)

---

## Funcionalidades

| Área | Descrição |
|------|-----------|
| **Auth** | Login (Firebase), refresh de token, logout com revogação de refresh tokens |
| **Multi-tenant** | Barbearias (`tenants`) com slug único, timezone IANA e status operacional |
| **Membros** | Vínculo usuário ↔ tenant com papéis (OWNER, ADMIN, STAFF, BARBER) |
| **Usuários** | CRUD de usuários globais e busca por e-mail |
| **Serviços** | Catálogo por tenant (preço, duração, ativo/inativo) |
| **Barbeiros** | Perfis ligados a `tenant_user` BARBER; desativação bloqueia novos agendamentos |
| **Disponibilidade** | Jornada semanal, períodos, folgas, bloqueios, serviços oferecidos e **slots disponíveis** |
| **Booking** | Rascunho → confirmação; antecedência mínima; sem sobreposição por barbeiro |
| **API docs** | Swagger/OpenAPI em `/api` |
| **Qualidade** | DTOs com `class-validator`; migrations TypeORM; testes unitários e e2e |

---

## Stack tecnológica

| Tecnologia | Uso |
|------------|-----|
| NestJS | Framework HTTP, módulos, guards, pipes |
| TypeScript | Linguagem |
| TypeORM | ORM, entidades, migrations PostgreSQL |
| Passport JWT | Estratégia Bearer |
| Firebase Admin | Autenticação e tokens |
| Swagger | OpenAPI UI |
| Jest + Supertest | Testes unitários e e2e |
| Luxon | Datas/agenda com timezone do tenant |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+ (o repositório também usa imagens Node 22/24 no Docker)
- [Yarn](https://yarnpkg.com/) classic (v1) — **use Yarn** para scripts e dependências
- [PostgreSQL](https://www.postgresql.org/) 16+ (compatível com 15+)
- Projeto [Firebase](https://firebase.google.com/) configurado (Auth + service account)

---

## Instalação

```bash
# Clone o repositório (se ainda não tiver)
git clone <url-do-repositorio>
cd cyacsys-barbershop
yarn install
```

---

## Configuração

1. Copie o arquivo de exemplo:

```bash
cp .envExample .env
```

2. Preencha o `.env` (principais variáveis):

| Variável | Descrição |
|----------|-----------|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Conexão PostgreSQL |
| `PORT` | Porta HTTP da API (padrão `3000`) |
| `NODE_ENV` | `development`, `production` ou `test` |
| `FIREBASE_PROJECT_ID`, `API_KEY`, `FIREBASE_SERVICE_ACCOUNT_BASE64` | Firebase Admin / Auth |

---

## Docker

Subir API + PostgreSQL (desenvolvimento):

```bash
docker compose up
```

A API usa `Dockerfile.dev`; variáveis vêm do `.env` montado no container.

---

## Executando o projeto

### Desenvolvimento (watch)

```bash
yarn start:dev
```

Base URL: `http://localhost:3000` (ou `PORT` do `.env`).

### Produção

```bash
yarn build
yarn start:prod
```

### Migrations

```bash
yarn migration:run
```

Gerar nova migration (após alterar entidades):

```bash
yarn migration:generate src/database/migrations/NomeDescritivo
```

---

## Documentação da API (Swagger)

Com a aplicação rodando:

- **Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)

Autenticação: **Authorize** → Bearer JWT. Endpoints escopados por `tenantId` exigem que o usuário seja membro ativo do tenant (e papel adequado quando houver `@TenantRoles`).

---

## Testes

```bash
yarn test              # unitários (jest.config.ts)
yarn test:watch
yarn test:cov
yarn test:e2e          # e2e (jest-e2e.json)
```

Exemplo de escopo:

```bash
yarn jest src/test/unit/booking --config jest.config.ts
yarn test:e2e --testPathPattern=booking
```

---

## Estrutura do projeto

```
src/
├── common/            # Guards, decorators, DTOs paginação, exceções
├── config/            # TypeORM, etc.
├── database/migrations/
├── modules/
│   ├── auth/
│   ├── availability/
│   ├── barber-profile/
│   ├── booking/
│   ├── firebase/
│   ├── service/
│   ├── tenant/
│   ├── tenant-user/
│   └── user/
├── repository/        # Repositórios TypeORM (por agregado)
├── test/              # e2e (*.e2e-spec.ts)
├── test/unit/         # testes unitários por pasta
├── app.module.ts
└── main.ts
docs/                    # Documentação por módulo (Markdown)
```

---

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `yarn start` | Inicia a aplicação |
| `yarn start:dev` | Desenvolvimento com reload |
| `yarn start:debug` | Debug |
| `yarn start:prod` | Produção (`node dist/main`) |
| `yarn build` | Compila para `dist/` |
| `yarn lint` | ESLint |
| `yarn format` | Prettier |
| `yarn test` | Testes unitários |
| `yarn test:e2e` | Testes e2e |
| `yarn test:cov` | Cobertura |
| `yarn migration:run` | Aplica migrations |
| `yarn migration:generate` | Gera migration a partir do diff do schema |

---

## Licença

Projeto proprietário — Cyacsys. Todos os direitos reservados.
