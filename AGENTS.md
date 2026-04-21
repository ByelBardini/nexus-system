# AGENTS.md — Nexus System

Leia este arquivo **antes** de explorar ou alterar o código. O detalhe por domínio está em [`docs/context/`](docs/context/) — abra só o arquivo relevante para a tarefa (menos tokens que carregar tudo aqui). Setup: `README.md`. Estilo e comportamento do agente: `CLAUDE.md`.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| API | NestJS 11, Prisma 7, MySQL/MariaDB (`@prisma/adapter-mariadb`), JWT, Pino, Throttler |
| Web | React, Vite, TypeScript, Tailwind, shadcn/ui |

## Layout do repositório

```
server/          # API NestJS — todo Prisma, migrations e variáveis de DB
client/          # SPA Vite — UI, chamadas HTTP
package.json     # Raiz: apenas scripts que orquestram server + client (ex.: dev)
```

Não há `npm run test` na raiz: testes rodam **dentro** de `server/` ou `client/` conforme a área alterada.

## Contexto por domínio (`docs/context/`)

Ao trabalhar em uma área:

1. Identifique backend, frontend ou ambos.
2. Leia o(s) arquivo(s) da tabela abaixo.
3. Em telas que usam `lib/` ou `components/` compartilhados, consulte também [`docs/context/frontend-core.md`](docs/context/frontend-core.md).

| Área | Arquivo |
|------|---------|
| Boot NestJS, Prisma, `common/`, testes unitários backend | [`docs/context/backend-core.md`](docs/context/backend-core.md) |
| Domínio `auth` | [`docs/context/auth.md`](docs/context/auth.md) |
| Domínio `users` + página Usuários | [`docs/context/users.md`](docs/context/users.md) |
| Domínio `roles` + página Cargos | [`docs/context/roles.md`](docs/context/roles.md) |
| Domínio `aparelhos` (API) | [`docs/context/aparelhos.md`](docs/context/aparelhos.md) |
| Domínio `clientes` + página Clientes | [`docs/context/clientes.md`](docs/context/clientes.md) |
| Domínio `tecnicos` + página Técnicos | [`docs/context/tecnicos.md`](docs/context/tecnicos.md) |
| Domínio `veiculos` | [`docs/context/veiculos.md`](docs/context/veiculos.md) |
| Domínio `equipamentos` (API) | [`docs/context/equipamentos.md`](docs/context/equipamentos.md) |
| Domínio `ordens-servico` + criação de OS | [`docs/context/ordens-servico.md`](docs/context/ordens-servico.md) |
| Domínio `pedidos-rastreadores` (API) | [`docs/context/pedidos-rastreadores.md`](docs/context/pedidos-rastreadores.md) |
| Domínio `cadastro-rastreamento` | [`docs/context/cadastro-rastreamento.md`](docs/context/cadastro-rastreamento.md) |
| Domínio `debitos-rastreadores` | [`docs/context/debitos-rastreadores.md`](docs/context/debitos-rastreadores.md) |
| AuthContext, hooks, `lib/`, componentes reutilizáveis | [`docs/context/frontend-core.md`](docs/context/frontend-core.md) |
| Scripts Vite, Tailwind, rotas `App.tsx`, testes frontend | [`docs/context/frontend-setup.md`](docs/context/frontend-setup.md) |
| Login, dashboard OS, bancada de testes, cadastro rastreamento (UI) | [`docs/context/frontend-agendamento.md`](docs/context/frontend-agendamento.md) |
| Aparelhos, equipamentos, pareamento (UI) | [`docs/context/frontend-aparelhos.md`](docs/context/frontend-aparelhos.md) |
| Configurações (hub), débitos equipamentos (UI) | [`docs/context/frontend-admin.md`](docs/context/frontend-admin.md) |
| Pedidos / pedidos-config (UI) | [`docs/context/frontend-pedidos.md`](docs/context/frontend-pedidos.md) |

## Onde aprofundar sem varrer o repo

| Tema | Onde |
|------|------|
| Convenções backend e TDD | `.cursor/skills/nexus-backend/SKILL.md` |
| Testes unit/E2E backend | `.cursor/skills/nexus-backend-tests/SKILL.md` |
| UI e padrões React do projeto | `.cursor/skills/nexus-frontend/SKILL.md` |
| Permissões / matriz | `server/test/unit/permissions/permissions-matrix.spec.ts` (e código em `roles` / guards) |
| Prisma (CLI, migrações, convenções) | [`docs/context/backend-core.md`](docs/context/backend-core.md); `.cursor/skills/nexus-backend/SKILL.md` |

## Checklist rápido antes de editar

1. Confirmar se a mudança é **server**, **client** ou **ambos** (e se toca schema Prisma).
2. Abrir o **módulo** ou **página** alvo e seguir imports em vez de buscar por todo o monorepo.
3. Se alterar contrato API ou DTO, verificar consumo em `client/src` (busca pelo path ou nome do endpoint).
4. Rodar testes só no pacote afetado (`server` ou `client`).
5. Mudança no **schema** ou **permissões**: migration/`prisma:generate` em `server/`; novos códigos em `permission-codes.ts` → `prisma:sync-permissions`; ajustar `createPrismaMock` ou testes que tocam no modelo afetado.
