# Cyacsys Barbershop API

API REST para o sistema de gestão da Cyacsys Barbershop, construída com [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) e PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o projeto](#executando-o-projeto)
- [Documentação da API](#documentação-da-api)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [Licença](#licença)

---

## Funcionalidades

- **Autenticação** — JWT com suporte a Firebase
- **Multi-tenant** — Gestão de estabelecimentos (tenants) e usuários por tenant
- **Serviços** — Cadastro e gestão de serviços da barbearia
- **Usuários** — CRUD de usuários com validação e transformação de dados
- **Documentação** — Swagger/OpenAPI em `/api`
- **Validação** — DTOs com `class-validator` e `class-transformer`
- **Migrations** — TypeORM para versionamento do banco de dados

---

## Stack tecnológica

| Tecnologia | Uso |
|------------|-----|
| **NestJS** | Framework backend |
| **TypeScript** | Linguagem |
| **TypeORM** | ORM e migrations |
| **PostgreSQL** | Banco de dados |
| **Passport + JWT** | Autenticação |
| **Firebase Admin** | Integração Firebase |
| **Swagger** | Documentação da API |
| **Jest** | Testes unitários e e2e |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Yarn](https://yarnpkg.com/) ou npm
- [PostgreSQL](https://www.postgresql.org/) 15+
- Conta e projeto [Firebase](https://firebase.google.com/) (para autenticação)

---

## Instalação

```bash
git clone <url-do-repositorio>
cd cyacsys-barbershop

yarn install
```

---

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp .envExample .env
```

2. Edite o `.env` e preencha os valores:

| Variável | Descrição |
|----------|-----------|
| `DB_TYPE` | Tipo do banco (ex: `postgres`) |
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta do PostgreSQL (ex: `5432`) |
| `DB_USERNAME` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_DATABASE` | Nome do banco de dados |
| `PORT` | Porta da API (padrão: `3000`) |
| `NODE_ENV` | `development`, `production` ou `test` |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `API_KEY` | Chave da API Firebase |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Service account em Base64 |

---

## Executando o projeto

### Desenvolvimento (watch mode)

```bash
yarn start:dev
```

A API estará disponível em `http://localhost:3000` (ou na porta definida em `PORT`).

### Produção

```bash
yarn build
yarn start:prod
```

### Migrations

```bash
yarn migration:generate src/database/migrations/NomeDaMigration

yarn migration:run
```

---

## Documentação da API

Com a aplicação em execução, a documentação Swagger está disponível em:

- **Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)

A API suporta autenticação Bearer (JWT). Use o botão **Authorize** no Swagger para informar o token.

---

## Testes

```bash
yarn test

yarn test:watch

yarn test:cov

yarn test:e2e
```

---

## Estrutura do projeto

```
src/
├── config/           # Configurações (TypeORM, etc.)
├── modules/
│   ├── auth/        # Autenticação (JWT, Firebase)
│   ├── firebase/    # Módulo Firebase
│   ├── service/     # Serviços da barbearia
│   ├── tenant/      # Estabelecimentos (multi-tenant)
│   ├── tenant-user/ # Usuários por tenant
│   └── user/        # Usuários
├── database/
│   └── migrations/  # Migrations TypeORM
├── app.module.ts
└── main.ts
```

---

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `yarn start` | Inicia a aplicação |
| `yarn start:dev` | Inicia em modo desenvolvimento (watch) |
| `yarn start:debug` | Inicia em modo debug |
| `yarn start:prod` | Inicia em modo produção |
| `yarn build` | Compila o projeto |
| `yarn lint` | Executa o ESLint |
| `yarn format` | Formata o código com Prettier |
| `yarn test` | Roda os testes unitários |
| `yarn test:e2e` | Roda os testes e2e |
| `yarn test:cov` | Gera relatório de cobertura |
| `yarn migration:generate` | Gera uma nova migration |
| `yarn migration:run` | Executa as migrations |

---

## Licença

Projeto proprietário — Cyacsys. Todos os direitos reservados.
