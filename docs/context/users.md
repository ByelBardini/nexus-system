# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `users`

**Arquivos do módulo (`server/src/users/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `users.module.ts` | Registra `UsersController` e `UsersService`; importa `PrismaModule`; **exporta `UsersService`** (consumido por `AuthModule`, `RolesModule` e vários outros módulos de domínio) |
| `users.controller.ts` | Rotas em `/users`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('users')` |
| `users.service.ts` | CRUD de usuários, consultas internas usadas por `auth` e `roles`, gestão de senha, permissões |
| `users.prisma-include.ts` | Includes Prisma reutilizáveis: `usuarioIncludeListagem` (listagem/detalhe admin), `usuarioIncludeAuth` (login e `getPermissions`); tipos `UsuarioComListagemInclude` e `UsuarioComAuthInclude` via `Prisma.UsuarioGetPayload` |
| `users.constants.ts` | `BCRYPT_SALT_ROUNDS` — única fonte do custo do `bcrypt.hash` em criação e reset de senha |
| `dto/create-user.dto.ts` | `nome` (MinLength 1), `email` (IsEmail), `password` (MinLength 4), `ativo?` (default `true`), `setor?` opcional com `@IsEnum(SetorUsuario)` (enum do `@prisma/client`, alinhado ao schema) |
| `dto/update-user.dto.ts` | Todos os campos opcionais: `nome?`, `email?`, `ativo?`, `setor?` (`@IsEnum(SetorUsuario)` quando informado) — **`password` não é atualizável por este DTO** |
| `dto/user-response.dto.ts` | Shape documental de resposta “flat”; **não está amarrado** ao controller — respostas reais incluem `usuarioCargos` e demais campos do Prisma; **`senhaHash` nunca exposto** nas respostas sanitizadas |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/users` | `ADMINISTRATIVO.USUARIO.LISTAR` |
| GET | `/users/paginated` | `ADMINISTRATIVO.USUARIO.LISTAR` |
| GET | `/users/:id` | `ADMINISTRATIVO.USUARIO.LISTAR` |
| POST | `/users` | `ADMINISTRATIVO.USUARIO.CRIAR` |
| PATCH | `/users/:id` | `ADMINISTRATIVO.USUARIO.EDITAR` |
| POST | `/users/:id/reset-password` | `ADMINISTRATIVO.USUARIO.EDITAR` |

> Não há rota de exclusão de usuário.

**Query params `GET /users/paginated`:**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `search` | `string?` | Busca em `nome` **ou** `email` (OR); implementação usa `mode: 'insensitive'` no Prisma — **com MySQL/MariaDB o Prisma pode rejeitar esse filtro** (erro de validação em runtime). Em ambientes PostgreSQL costuma funcionar como case-insensitive. |
| `ativo` | `string?` (`'true'` / `'false'`) | Filtra por `ativo`; omitido = sem filtro |
| `page` | `string?` (convertido com `+`) | Default `1` |
| `limit` | `string?` | Default `15`; max `100` |

**Includes Prisma (DRY):**

- **`usuarioIncludeListagem`** — `usuarioCargos → cargo → setor` + `cargoPermissoes` (sem nested `permissao`). Usado em `findAll`, `findAllPaginated`, `findOne`, `findById` (detalhe alinhado à listagem).
- **`usuarioIncludeAuth`** — `usuarioCargos → cargo → cargoPermissoes → permissao`. Usado em `findByEmail`, `findByIdWithPassword` (login, guard, troca de senha).

**Diferenças entre `GET /users` e `GET /users/paginated`:**

- `GET /users` (`findAll`): sem paginação; include **`usuarioIncludeListagem`**; ordena por `nome asc`. Ideal para selects.
- `GET /users/paginated` (`findAllPaginated`): paginado; mesma estrutura de cargos; filtros de `search` e `ativo`. Ideal para listagens administrativas.

**Métodos públicos do `UsersService`:**

| Método | Retorno | Notas |
|--------|---------|-------|
| `findAll()` | `Usuario[]` sem `senhaHash` | Include **`usuarioIncludeListagem`** |
| `findAllPaginated(params)` | `PaginatedResult` sem `senhaHash` | Filtros `search`/`ativo`; `maxLimit=100`; mesmo include de listagem |
| `findOne(id)` | `Usuario` sem `senhaHash` | Mesmo include que a listagem; lança `NotFoundException` |
| `create(dto)` | `Usuario` sem `senhaHash` | Lança `ConflictException` se email duplicado; `senhaExpiradaEm = null`; `setor` aplicado só se `dto.setor !== undefined` (permite `null` explícito); hash com **`BCRYPT_SALT_ROUNDS`** |
| `update(id, dto)` | `Usuario` sem `senhaHash` | Valida existência via `findOne`; `setor` aceita `null` para limpar; **não altera senha**; resposta do `update` Prisma **sem** re-include de relações (payload pode ser mais “flat” que `findOne`) |
| `resetPassword(id)` | `{ message: string }` | Senha padrão `'#Infinity123'`; hash com **`BCRYPT_SALT_ROUNDS`**; reseta `senhaExpiradaEm = null` |
| `findByIdWithPassword(id)` | `Promise<UsuarioComAuthInclude \| null>` | Include **`usuarioIncludeAuth`**; **uso interno** — ex.: `trocarSenha` |
| `updatePassword(id, senhaHash, senhaExpiradaEm)` | `void` | **Uso interno** — chamado por `auth.service` após troca de senha bem-sucedida |
| `findByEmail(email)` | `Promise<UsuarioComAuthInclude \| null>` | Include **`usuarioIncludeAuth`**; **uso interno** — `login`, `PermissionsGuard` |
| `findById(id)` | `Usuario \| null` sem `senhaHash` | Include **`usuarioIncludeListagem`**; **uso interno** — `JwtStrategy.validate` / `validateUser` |
| `getPermissions(user)` | `string[]` | Parâmetro tipado como **`UsuarioComAuthInclude`**; retorna `code` deduplicados; **uso interno** — `AuthService.login`, `PermissionsGuard` |
| `updateLastLogin(id)` | `void` | Seta `ultimoAcesso = new Date()`; chamado após login bem-sucedido |

**`sanitizeUser` (privado):**

Todos os métodos que retornam `Usuario` para o exterior passam por `sanitizeUser`, que remove `senhaHash` via destructuring. Nunca retorna a hash de senha em respostas da API pública.

**Modelo Prisma `Usuario` (campos-chave):**

`id`, `nome`, `email` (unique), `senhaHash`, `ativo` (bool, default `true`), `setor` (`SetorUsuario?`), `senhaExpiradaEm` (`DateTime?`), `ultimoAcesso` (`DateTime?`), `criadoEm`, `atualizadoEm`, relação `usuarioCargos[]`.

**Enum `SetorUsuario`:** `AGENDAMENTO` | `CONFIGURACAO` | `ADMINISTRATIVO`.

**Regras de negócio críticas:**

- `create`: unicidade de `email` validada via `findUnique` — lança `ConflictException('Email já cadastrado')`. `senhaExpiradaEm = null` na criação (força troca na primeira entrada).
- `update`: **não** atualiza `senhaHash`; apenas `nome`, `email`, `ativo` e `setor`. Para alterar senha usar `resetPassword` (admin) ou `POST /auth/trocar-senha` (usuário).
- `resetPassword`: senha padrão é `'#Infinity123'`; reinicia `senhaExpiradaEm = null` (força nova troca no próximo login).
- `UsersModule` é **exportado** e importado por quase todos os módulos de domínio — alterações na interface do service têm impacto amplo.

**Testes unitários (`server/test/unit/users/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `users.controller.spec.ts` | Delegação controller → service; conversão `string → number` em `id`; defaults de `page`/`limit`; conversão de `ativo` string para booleano (true/false/undefined); todos os 6 endpoints |
| `users.service.spec.ts` | Mock de `bcrypt`; asserts de **`BCRYPT_SALT_ROUNDS`** em `create`/`resetPassword`; includes **`usuarioIncludeListagem`** / **`usuarioIncludeAuth`** nas chamadas Prisma relevantes; `findById` / `findByEmail` / `findByIdWithPassword`; demais fluxos (paginação, conflitos, `getPermissions`, etc.) |
| `users.prisma-include.spec.ts` | Forma dos objetos de include (listagem vs auth) |
| `create-user.dto.spec.ts` | `class-validator` + `SetorUsuario`: valores válidos, `null`, enum inválido |
| `update-user.dto.spec.ts` | Patch vazio, `setor` enum/`null`, enum inválido, email inválido |

**Testes E2E (`server/test/users.e2e-spec.ts`):**

- Módulo `UsersModule` + `PermissionsGuard` mockado; dados isolados com e-mail `*@e2e-users-nexus.test` e **`cleanupE2eUsers`** em `test/helpers/e2e-db-cleanup.ts`.
- Cobertura: listagem e paginação (sem `senhaHash`, `usuarioCargos`), filtro **`ativo`**, CRUD parcial (POST/PATCH), enum `setor` inválido (400), senha curta (400), email duplicado (409), `setor` null (create/patch), reset de senha (hash e `bcrypt.getRounds` vs constante), 404 em rotas com usuário inexistente.
- **`search` em paginação não é exercitado no E2E** pelo limite do provider MySQL/MariaDB com `mode: 'insensitive'` (ver tabela de query params acima).

**Frontend (`client/src/pages/usuarios/`):**

Rota: `/usuarios` (Configurações → "Usuários"). A tela é composta por `UsuariosPage.tsx` (orquestração) + módulos abaixo; TanStack Query via hooks dedicados.

**Estrutura de pastas (cliente):**

| Caminho | Conteúdo |
|---------|----------|
| `UsuariosPage.tsx` | Estado local, `useForm` (criar/editar), liga header, tabela, rodapé e modais |
| `hooks/useUsuariosQueries.ts` | `useUsuariosPaginatedQuery`, `usePermissionsQuery`, `useCargosComPermissoesQuery` (este último com `enabled` quando modal de criação/edição abre) |
| `hooks/useUsuariosMutations.ts` | `create` / `update` / `toggleStatus` / `resetPassword` + `invalidateQueries`; callbacks opcionais `onCreateSettled` / `onUpdateSettled` (fechar modal, reset de form) **antes** do toast, como no fluxo original |
| `lib/types.ts` | `UsuarioListItem`, `CargoWithPermissions`, respostas paginadas, etc. |
| `lib/schemas.ts` | `schemaCreate` / `schemaEdit` (Zod) e tipos de formulário |
| `lib/constants.ts` | `SETORES_USUARIO` e `SetorUsuario` |
| `lib/permissoes-heranca.ts` | `calcularPermissoesHerdadas`, `getModuloLabel`, `getAcaoLabel` |
| `lib/usuarios-format.ts` | `getSetorLabel`, `getInitials`, `getAccessLevel`, `formatLastLogin` (aceita `now` injetável para testes), `computeAccessScore` (score lateral dos modais; unifica a lógica duplicada de “access score” por cargos) |
| `lib/groupCargos.ts` | `groupCargosBySetorNome` — agrupa `GET /roles?includePermissions=true` por `cargo.setor.nome` |
| `components/UsuariosPageHeader.tsx` | Busca, filtro de status, botão "Novo Usuário" |
| `components/UsuariosDataTable.tsx` + `UsuarioExpandedPanel.tsx` | Tabela, accordion, painel de auditoria e ações |
| `components/UsuariosTableFooter.tsx` | Totais e paginação |
| `components/UsuarioDadosForm.tsx` | Nome, setor, e-mail (criação e edição) |
| `components/CargosAtribuicaoBlock.tsx` | Chips, lista por setor, toggle expansível |
| `components/PermissoesHerancaSidebar.tsx` | "Resumo de Herança" + score (compartilhado entre modais) |
| `components/CriarUsuarioDialog.tsx` / `EditarUsuarioDialog.tsx` | Modais; sidebar recalcula preview com as libs acima |

**Testes (Vitest + RTL, API mockada):** `client/src/__tests__/pages/usuarios/` — unidades em `lib/`, hooks, componentes e `UsuariosPage.e2e.test.tsx` (fluxo da página).

**Interface de linha da lista (`UsuarioListItem` em `lib/types.ts`):** equivale ao antigo `User` na página.

```ts
// Resumo: id, nome, email, ativo, setor?, createdAt, ultimoAcesso?, usuarioCargos?
// usuarioCargos[].cargo: id, nome, categoria, cargoPermissoes: { permissaoId }[]
```

**Estado e queries:**

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `search` | `string` | Debounce 300 ms via `useDebounce`; busca por nome ou email |
| `statusFilter` | `"TODOS" \| "ATIVOS" \| "INATIVOS"` | Converte para `ativo=true/false` no param; `TODOS` omite o param |
| `page` | `number` | Paginação servidor; reset para 1 ao mudar `search`/`statusFilter` |
| `openCreate` | `boolean` | Controla Dialog de criação |
| `editingId` | `number \| null` | `null` = fechado; preenchido = modo edição |
| `expandedId` | `number \| null` | Linha expandida (accordion) |
| `selectedCreateRoleIds` | `number[]` | IDs de cargos selecionados no modal de criação |
| `selectedRoleIds` | `number[]` | IDs de cargos no modal de edição |
| `showCreateRoleSelector` | `boolean` | Toggle da lista expansível de cargos (criação) |
| `showEditRoleSelector` | `boolean` | Toggle da lista expansível de cargos (edição) |

| QueryKey | Endpoint | Notas |
|----------|----------|-------|
| `["users-paginated", debouncedSearch, statusFilter, page]` | `GET /users/paginated?search&ativo&page&limit=15` | Paginação servidor |
| `["permissions"]` | `GET /roles/permissions` | Sempre carregada (para calcular `totalPermissions`) |
| `["roles-with-permissions"]` | `GET /roles?includePermissions=true` | Habilitada **só** quando `openCreate=true` ou `editingId != null` |

**Mutations:**

| Mutation | Endpoint(s) | Notas |
|----------|-------------|-------|
| `createMutation` | `POST /users` + `PATCH /roles/users/:id/roles` | Cria usuário com senha `#Infinity123`; se `cargoIds.length > 0`, atribui cargos em seguida (chamadas sequenciais, não paralelas) |
| `updateMutation` | `Promise.all([PATCH /users/:id, PATCH /roles/users/:id/roles])` | Atualiza dados e cargos em paralelo; `roleIds` substitui todos os cargos |
| `toggleStatusMutation` | `PATCH /users/:id` | Envia `{ ativo: boolean }`; bloqueado para o `currentUser` (não pode inativar a si mesmo) |
| `resetPasswordMutation` | `POST /users/:id/reset-password` | Reseta para `#Infinity123`; toast exibe a senha padrão |

Definição em `hooks/useUsuariosMutations.ts`. Todas invalidam `["users-paginated"]` em `onSuccess` (após a conclusão da mutation, antes/depois do toast conforme o hook — callbacks de fechamento de modal rodam antes do toast de sucesso).

**Formulário de criação (`schemaCreate` em `lib/schemas.ts` — zod):**

`nome` (min 1), `email` (IsEmail), `ativo: boolean` (default `true`), `setor: string | null | undefined`, `cargoIds: number[]` (array de IDs — **não é campo do DTO da API**, é gerenciado via estado `selectedCreateRoleIds`).

**Formulário de edição (`schemaEdit` em `lib/schemas.ts` — zod):**

`nome`, `email`, `ativo`, `setor` — sem campo `cargoIds` (cargos gerenciados via `selectedRoleIds` separado).

**`cargosPorSetor` (useMemo na página):**

`useMemo(() => groupCargosBySetorNome(cargosComPermissoes), [cargosComPermissoes])` — ver `lib/groupCargos.ts`. Usado na lista expandível de cargos nos modais.

**`calcularPermissoesHerdadas` (`lib/permissoes-heranca.ts`):**

Recebe `selectedCargoIds` e `cargos`; percorre `cargoPermissoes` dos cargos selecionados; agrupa por `SETOR.MODULO`; detecta ações `EXCLUIR` como "alto risco". Retorna:
- `setoresHabilitados: { modulo: string; acoes: string[] }[]`
- `acoesAltoRisco: { modulo: string; permissao: string }[]`

O painel lateral "Resumo de Herança" consome o resultado; os modais também usam `computeAccessScore` (`lib/usuarios-format.ts`) para a barra de score (percentual de permissões distintas vs lista global `["permissions"]`).

**`getAccessLevel` (`lib/usuarios-format.ts`):**

Calcula % de permissões únicas de um usuário vs `totalPermissions` (contagem de `["permissions"]`). Retorna `{ percent, label, color, barColor }`:

| Faixa | Label | Cor |
|-------|-------|-----|
| 0% | "Nenhum" | slate |
| ≤ 25% | "Baixo" | emerald |
| ≤ 50% | "Médio" | amber |
| ≤ 75% | "Alto" | orange |
| > 75% | "Total" | red |

**`formatLastLogin` (`lib/usuarios-format.ts`):**

`null/undefined` → `"Nunca acessou"`; hoje → `"Hoje, HH:mm"`; ontem → `"Ontem, HH:mm"`; < 7 dias → `"N dias atrás"`; mais antigo → data pt-BR completa. Segundo parâmetro opcional `now` (para testes).

**Colunas da tabela (7):** expand icon · Usuário/Identificação (avatar iniciais + nome + ID 5 dígitos + email) · Setor · Cargo(s) Atribuídos (badges via `@/types/cargo`) · Último Acesso · Nível de Acesso (barra + label) · Status (badge emerald/slate).

**Linha expandida (accordion, `colSpan=7`):** grid 12 colunas em 3 seções:
1. **Audit Trail & Segurança** (col-5) — data de cadastro, último acesso, percentual de permissões ativas.
2. **Cargos Vinculados** (col-4) — lista de cargos com badge de categoria.
3. **Ações Rápidas** (col-3) — botões "Resetar Senha", "Editar Usuário", "Inativar/Ativar Usuário" (visíveis apenas se `canEdit`; botão de status escondido para `currentUser.id === user.id`).

**Modais (Dialog `max-w-6xl h-[90vh]`):**

Estrutura idêntica entre criação e edição: `header` fixo (título + step indicator) + `flex-1` com formulário à esquerda e `aside w-96` à direita + `footer` com botões.

O `aside` (painel "Resumo de Herança") exibe em tempo real:
- **Setores Habilitados** — lista de módulos com ações herdadas (`getModuloLabel` + `getAcaoLabel`).
- **Ações de Alto Risco** — permissões `EXCLUIR` detectadas.
- **Score de Acesso** — percentual com barra colorida (mesmo esquema de cores de `getAccessLevel`).

**Diferenças entre modal criação e edição:**

| Aspecto | Criação | Edição |
|---------|---------|--------|
| Campo `ativo` | Padrão `true`; não exibido no form (sem toggle) | Ausente do form (edição não muda `ativo` via modal) |
| Cargos | `selectedCreateRoleIds` + `showCreateRoleSelector` | `selectedRoleIds` + `showEditRoleSelector` |
| Submit | `POST /users` → `PATCH /roles/users/:id/roles` (sequencial) | `Promise.all([PATCH /users/:id, PATCH /roles/users/:id/roles])` |
| Senha | Informativo: "senha inicial `#Infinity123`" (Protocolos de Segurança) | Sem seção de senha |
| `ativo` no formulário | Ausente | Ausente — alterado via botão "Inativar/Ativar" na linha expandida |

**Permissões frontend:**

| Código | Efeito |
|--------|--------|
| `ADMINISTRATIVO.USUARIO.CRIAR` | Exibe botão "Novo Usuário" no header |
| `ADMINISTRATIVO.USUARIO.EDITAR` | Exibe botões "Resetar Senha", "Editar Usuário", "Inativar/Ativar" na linha expandida |

**Categorias de cargo na UI (badges):** `categoriaCargoOuOperacional` e `categoriaCargoParaBadge` de `@/types/cargo` (tabela, chips de cargos, painel expandido) — alinhado ao padrão de outras telas (ex. `CargosPage`).

**`getModuloLabel` / `getAcaoLabel` (`lib/permissoes-heranca.ts`):**

`getModuloLabel` mapeia path `"SETOR.ITEM"` (e fallback legado por segmento) para label pt-BR. `getAcaoLabel` mapeia `LISTAR→"Visualizar"`, `CRIAR`, `EDITAR`, `EXCLUIR`, `EXECUTAR`.

> **Atenção:** Ao adicionar novos módulos de permissão, atualizar os mapas em `client/src/pages/usuarios/lib/permissoes-heranca.ts` e, se necessário, os equivalentes no `CargoModal` / outras telas (lógica pode divergir até haver módulo compartilhado de labels RBAC).

---

