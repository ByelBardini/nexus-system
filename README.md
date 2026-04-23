# Nexus System

[![CI](https://github.com/ByelBardini/nexus-system/actions/workflows/ci.yml/badge.svg)](https://github.com/ByelBardini/nexus-system/actions/workflows/ci.yml)
[![versão](https://img.shields.io/github/package-json/v/ByelBardini/nexus-system?label=alpha&color=orange)](https://github.com/ByelBardini/nexus-system/releases)
[![semantic-release](https://img.shields.io/badge/semantic--release-conventionalcommits-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

> **Alpha** — projeto em desenvolvimento ativo. A API e as interfaces podem mudar sem aviso entre versões.

Stack: **Server** (NestJS 11 + Prisma 7 + MySQL/MariaDB) e **Client** (React + Vite + TypeScript + Tailwind + shadcn/ui)

## Funcionalidade

Aplicação web para **operação e cadastro** no contexto de **rastreamento veicular**: gestão de **clientes** e subclientes, **técnicos** (incluindo mapa), **veículos**, **ordens de serviço** e documentos gerados no fluxo, **aparelhos** (lotes, kits, pareamento), **equipamentos** (marcas, modelos, operadoras, chips/planos), **pedidos de rastreadores** com acompanhamento tipo kanban, **testes** em bancada e fila, **débitos** de equipamentos, **cadastro de rastreamento**, além de **usuários**, **cargos** e **permissões** por código. O acesso é **autenticado (JWT)**; a API REST está descrita no **Swagger** (`/api`).

## Versionamento (alpha)

Estado atual: **alpha** (`0.x.y` conforme [SemVer](https://semver.org/); histórico em [CHANGELOG.md](CHANGELOG.md)).

### Um único número de produto

O campo `version` fica no [`package.json`](package.json) da raiz; [`server/package.json`](server/package.json) e [`client/package.json`](client/package.json) **espelham** esse valor (`npm run sync-versions`, também executado no CI após o bump).

### Automático no merge (recomendado)

Ao **dar merge de um PR na `main`**, o [workflow de CI](.github/workflows/ci.yml) roda testes, lint e formatação; se tudo passar, o job **Versionamento (semantic-release)** executa [semantic-release](https://github.com/semantic-release/semantic-release): ele lê os commits no padrão **[Conventional Commits](https://www.conventionalcommits.org/)** (desde a última tag), decide **patch / minor / major**, atualiza versão e [CHANGELOG.md](CHANGELOG.md), cria **commit** `chore(release): …`, **tag `v*`** e **GitHub Release**.

- Use mensagens como `feat: …`, `fix: …`, `perf: …` (e `BREAKING CHANGE:` ou `feat!:` quando aplicável). Commits que não seguirem o padrão **não** entram no cálculo da próxima versão — pode não haver release naquele merge.
- **Configuração no GitHub (importante):** em **Settings → Actions → General → Workflow permissions**, ative **Read and write permissions** e marque **Allow GitHub Actions to create and approve pull requests**, para o `GITHUB_TOKEN` conseguir **empurrar** o commit de release e criar a release na `main`.
- Se a `main` estiver **protegida**, a regra precisa **permitir que o GitHub Actions** faça push (por exemplo **Bypass list** incluindo o app **GitHub Actions** / `github-actions[bot]`), ou use um **PAT** com escopo `repo` em um secret (ex.: `SEMANTIC_RELEASE_TOKEN`) e troque o workflow para `env: GITHUB_TOKEN: ${{ secrets.SEMANTIC_RELEASE_TOKEN }}`. Sem isso, o job de versionamento falha ao tentar publicar.

### Manual (opcional)

Na raiz: `npm run release` / `npm run release:patch` etc. ([release-it](https://github.com/release-it/release-it)) — útil em situações excepcionais; no dia a dia o fluxo automático acima substitui.

### SemVer e Prisma

Em `0.x`, **patch** para correções compatíveis e **minor** para funcionalidades novas. Releases com migration nova: documente no CHANGELOG que o deploy deve rodar `prisma migrate deploy` (ou equivalente).

### CI

O mesmo workflow roda em PRs, em **push** na `main` e em **tags** `v*`.

**Opcional (futuro):** expor versão em runtime (`APP_VERSION`, `VITE_*`) para suporte — não habilitado por padrão.

## Pré-requisitos

- Node.js 18+
- MySQL ou MariaDB (ou Docker) para o backend
- npm (ou pnpm)

## Rodar tudo (server + client)

Na raiz do projeto:

```bash
npm run dev
```

Inicia o server (Nest) e o client (Vite) em paralelo. Server em http://localhost:3000, client em http://localhost:5173.

## Produção

Para build e deploy em produção, utilize os seguintes comandos na raiz:

**Comando Único (Start):**
- `npm start`: Inicia ambos (server e client) em modo de produção simultaneamente.

**Frontend (Client):**
- Build: `npm run build:client` (executa `cd client && npm install && npm run build`)
- Deploy: `npm run start:client` (executa `cd client && npm run start`)

**Backend (Server):**
- Build: `npm run build:server` (executa `cd server && npm install && npm run build`)
- Deploy: `npm run start:server` (executa `cd server && npm run start:prod`)

---

## Server (Backend)

```bash
cd server
cp .env.example .env   # Ajuste DATABASE_URL, JWT_SECRET, PORT
npm install
npm run prisma:generate
npm run prisma:migrate   # primeira vez: aplica migrations ao banco
npm run start:dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api  
- Testes: `npm run test` (na pasta `server`)

## Prisma (ORM)

Toda a configuração fica em **`server/`**.

| Item | Caminho / detalhe |
|------|-------------------|
| Schema | `server/prisma/schema.prisma` (`provider = "mysql"`) |
| Migrations | `server/prisma/migrations/` |
| Config (Prisma 7) | `server/prisma.config.ts` — `DATABASE_URL`, caminhos de schema/migrations e comando de seed |
| Client em runtime | Nest usa `@prisma/adapter-mariadb` com URL `mysql://...` (compatível com MySQL e MariaDB) |

**`DATABASE_URL`** deve seguir o formato do `.env.example`:

`mysql://usuario:senha@host:3306/nome_do_banco`

Fluxo típico no primeiro setup: criar o banco vazio → configurar `.env` → `npm run prisma:generate` → `npm run prisma:migrate`.

Em **produção/CI** (sem prompt interativo), aplique apenas migrations já versionadas:

```bash
cd server
npx prisma migrate deploy
```

### Scripts npm (`cd server`)

- `npm run prisma:generate` — gera o Prisma Client (`prisma generate`)
- `npm run prisma:migrate` — desenvolvimento: cria/aplica migrations (`prisma migrate dev`)
- `npm run prisma:seed` — popula dados iniciais (`prisma db seed` → `prisma/seed.ts`)
- `npm run prisma:studio` — abre o Prisma Studio
- `npm run prisma:sync-permissions` — sincroniza permissões do domínio (`prisma/sync-permissions.ts`)

## Client (Frontend)

```bash
cd client
cp .env.example .env   # Opcional: VITE_API_URL (padrão para chamadas à API)
npm install
npm run dev
```

- App: http://localhost:5173  

## Visão geral do código (`src`)

Texto para onboarding: onde está a lógica do backend e do frontend, como a API é documentada e como a UI conversa com o servidor. **Listagem completa de endpoints** e **corpo dos DTOs** ficam no Swagger, não abaixo. Um **mapa detalhado de pastas do repositório** pode ser acrescentado depois.

### Documentação da API (Swagger)

Com o backend em execução, a UI interativa do OpenAPI está em **`/api`** (configurado em `server/src/main.ts`). Exemplo em desenvolvimento:

**http://localhost:3000/api** (use a mesma porta se `PORT` no `.env` for outra).

Use o Swagger para explorar rotas, schemas e exemplos de payload. Rotas protegidas exigem JWT: clique em **Authorize**, escolha **Bearer** e cole o token (o mesmo formato `Bearer <token>` que o client envia). O `DocumentBuilder` já registra `addBearerAuth()`.

### Backend (`server/src`)

- **`main.ts`**: `ValidationPipe` global (whitelist + transform), CORS para o Vite local, **Swagger** em `/api`, logger Pino.
- **`app.module.ts`**: `ConfigModule` global, rate limit (`ThrottlerModule` + `ThrottlerGuard` global), `LoggerModule`, **`JwtAuthGuard` global** (todas as rotas exigem JWT salvo exceções explícitas).
- **Persistência:** acesso ao banco via `PrismaService` (`server/src/prisma/`); detalhes de schema e migrations na seção **Prisma** deste README.

**`server/src/common/`**

- `constants.ts` — constantes de domínio (ex.: regras de cliente/senha).
- `pagination.helper.ts` — utilitários de paginação (`paginateParams`, `paginate`).
- `geocoding/` — geocodificação de endereços (Nominatim / OpenStreetMap), com fila e throttle.

**`server/src/auth/`**

- Autenticação JWT; rotas públicas com o decorator `@Public()` (`IS_PUBLIC_KEY`).
- Autorização por permissão com `@RequirePermissions(...códigos)`; o guard compara com as permissões do usuário.
- Os **códigos** usados no código e no banco alinham-se a `server/prisma/permission-codes.ts` e ao fluxo de seed/sync de permissões em `server/prisma/`.

**Módulos de domínio** (cada um com controller/service alinhados ao Swagger):

| Módulo | Foco |
|--------|------|
| `auth` | Login, troca de senha, emissão/uso de JWT. |
| `users` | Cadastro e gestão de usuários. |
| `roles` | Setores, cargos, atribuição de permissões. |
| `clientes` | Clientes e subclientes do negócio. |
| `tecnicos` | Técnicos e dados operacionais (ex.: localização). |
| `veiculos` | Veículos vinculados ao fluxo operacional. |
| `ordens-servico` | Ordens de serviço, status, artefatos (ex.: HTML/PDF). |
| `aparelhos` | Aparelhos, lotes, kits, pareamento. |
| `equipamentos` | Marcas/modelos, operadoras, marcas SIM/planos. |
| `pedidos-rastreadores` | Pedidos, itens, fluxo tipo kanban no client. |
| `debitos-rastreadores` | Histórico e consulta de débitos de equipamentos. |
| `cadastro-rastreamento` | Cadastro de rastreamento (conclusão e regras associadas). |

### Frontend (`client/src`)

- **`main.tsx`**: `QueryClientProvider` (React Query, retries desligados, `staleTime` ~60s), `BrowserRouter`, `AuthProvider`, toaster global.
- **`App.tsx`**: definição de rotas e **lazy loading** de páginas (code splitting).
- **`layouts/AppLayout.tsx`**: layout autenticado (shell com navegação).
- **`lib/api.ts`**: base URL `VITE_API_URL` ou `http://localhost:3000`; `fetch` com timeout; header `Authorization: Bearer` a partir de `localStorage`; em **401** chama callback registrado via `setOnUnauthorized` (limpeza de sessão no `AuthContext`).
- **`contexts/AuthContext.tsx`**: login/logout, persistência em `localStorage` (`nexus_auth` + `accessToken`), lista de permissões e `hasPermission` para a UI.
- **`components/ProtectedRoute.tsx`**: exige autenticação para rotas internas.
- **`components/ui/`** — componentes shadcn/ui; não listados aqui.
- **Hooks** — integrações notáveis: `useConsultaPlaca`, `useBrasilAPI` (APIs externas auxiliares).

**Áreas em `pages/`** (telas agrupadas por domínio, não por arquivo):

- Ordens de serviço (lista e fluxo de criação), clientes, técnicos (inclui mapa), aparelhos (lote e individual), equipamentos (cadastro, config, pareamento), pedidos de rastreadores (kanban e configurações), testes em bancada/fila, débitos de equipamentos, cadastro de rastreamento, usuários, cargos, configurações gerais, login.

Testes do client: `npm run test` na pasta `client`.

## Desenvolvido por e licença

- **Repositório no GitHub:** [github.com/ByelBardini/nexus-system](https://github.com/ByelBardini/nexus-system)
- **Perfil:** [@ByelBardini](https://github.com/ByelBardini)
- **Licença:** [MIT](LICENSE) — texto completo em [`LICENSE`](LICENSE) na raiz.

