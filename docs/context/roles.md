# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `roles`

**Arquivos do módulo (`server/src/roles/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `roles.module.ts` | Registra controller + service; importa apenas `PrismaModule`; **exporta `RolesService`** |
| `roles.controller.ts` | Rotas em `/roles`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('roles')`; parâmetros de rota numéricos (`:id`, `:userId`) usam **`ParseIntPipe`** (id inválido → **400**) |
| `roles.service.ts` | CRUD de cargos, listagem de setores/permissões, atribuição de permissões a cargos, atribuição de cargos a usuários; reutiliza includes Prisma de `roles.cargo-include.ts` |
| `roles.cargo-include.ts` | Constantes `Prisma.validator<CargoInclude>`: `cargoIncludeSetorEPermissoes`, `cargoIncludeSetorEPermissoesComContagemUsuarios`, `cargoIncludeSomentePermissoes` — evita drift entre `findMany` / `findUnique` / `create` / `update` / pós-`updateRolePermissions` |
| `roles.permissions.ts` | **`ROLES_CONTROLLER_PERMISSIONS`** — única fonte dos códigos passados a `@RequirePermissions` neste controller (matriz em `test/unit/permissions/permissions-matrix.spec.ts` importa o mesmo objeto) |
| `dto/create-role.dto.ts` | `nome` (MaxLength 100), `code` (MaxLength 50), `setorId`, `descricao?` (MaxLength 500), `categoria?` (`CategoriaCargo`), `ativo?` |
| `dto/update-role.dto.ts` | `nome?`, `descricao?`, `categoria?`, `ativo?` — **`code` e `setorId` não são atualizáveis** |
| `dto/is-numeric-id-array.decorator.ts` | `IsNumericIdArrayProperty()` — `ApiProperty` + `IsArray` + `IsNumber({ each: true })` compartilhado pelos DTOs de atribuição |
| `dto/assign-permissions.dto.ts` | `permissionIds: number[]` (via decorator acima) — substitui todas as permissões do cargo |
| `dto/assign-roles.dto.ts` | `roleIds: number[]` (via decorator acima) — substitui todos os cargos do usuário |

**Endpoints e permissões:**

| Método | Path | Permissão (constante / valor) |
|--------|------|--------------------------------|
| GET | `/roles` | `ROLES_CONTROLLER_PERMISSIONS.CARGO_LISTAR` → `ADMINISTRATIVO.CARGO.LISTAR` |
| GET | `/roles/paginated` | idem |
| GET | `/roles/setores` | idem |
| GET | `/roles/permissions` | idem |
| GET | `/roles/:id` | idem (`:id` inteiro) |
| POST | `/roles` | `CARGO_CRIAR` → `ADMINISTRATIVO.CARGO.CRIAR` |
| PATCH | `/roles/:id` | `CARGO_EDITAR` → `ADMINISTRATIVO.CARGO.EDITAR` |
| PATCH | `/roles/:id/permissions` | idem |
| GET | `/roles/users/:userId/roles` | `USUARIO_LISTAR` → `ADMINISTRATIVO.USUARIO.LISTAR` |
| PATCH | `/roles/users/:userId/roles` | `USUARIO_EDITAR` → `ADMINISTRATIVO.USUARIO.EDITAR` |

> Não há rota de exclusão de cargo. `ADMINISTRATIVO.CARGO.EXCLUIR` pode existir em `permission-codes.ts`, mas não há endpoint correspondente.

**Query params `GET /roles/paginated`:**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `search` | `string?` | Busca case-insensitive em `nome` |
| `categoria` | `CategoriaCargo?` | Filtro exato |
| `page` | `string?` (convertido com `+`) | Default `1` |
| `limit` | `string?` | Default `15`; max `100` |

**Diferenças entre `GET /roles` e `GET /roles/paginated`:**

- `GET /roles` (`findAllWithSectors`): sem paginação; ordenado por `setor.code asc, cargo.code asc`; inclui `setor` e `cargoPermissoes` com `permissao`. Ideal para selects/dropdowns que precisam de todos os cargos agrupados por setor.
- `GET /roles/paginated` (`findAllPaginated`): paginado; ordenado por `nome asc`; inclui `setor`, `cargoPermissoes` + permissão, e `_count.usuarioCargos` mapeado como `usuariosVinculados`. Ideal para listagens administrativas.

**Modelos Prisma (campos-chave):**

- `Cargo`: `id`, `nome`, `code` (unique por setor), `setorId`, `descricao?`, `categoria` (`CategoriaCargo`, default `OPERACIONAL`), `ativo` (default `true`), `cargoPermissoes[]`, `usuarioCargos[]`.
- `Setor`: `id`, `nome`, `code` — listado por `GET /roles/setores` (ordenado por `nome asc`).
- `Permissao`: `id`, `code` — listada por `GET /roles/permissions` (ordenada por `code asc`).
- `CargoPermissao`: junção `cargoId` + `permissaoId`.
- `UsuarioCargo`: junção `usuarioId` + `cargoId`.

**Enum `CategoriaCargo`:** ver `schema.prisma` para valores exatos; default de criação = `OPERACIONAL`.

**Regras de negócio críticas:**

- Unicidade de `(setorId, code)` validada via `findFirst` antes de criar — lança `ConflictException('Cargo com este código já existe no setor')`.
- `update` **não** permite alterar `code` nem `setorId` — `UpdateRoleDto` não contém esses campos.
- `updateRolePermissions`: **substitui** todas as permissões em transação (`deleteMany` + `createMany`). Enviar lista vazia remove todas as permissões sem criar novas. **IDs duplicados** no array podem gerar violação de PK em `createMany` (erro Prisma / resposta de erro 5xx até haver tratamento explícito).
- `updateUserRoles`: **substitui** todos os cargos do usuário em transação (`deleteMany` + `createMany`). Lança `NotFoundException` se usuário não existe.
- `findById` e `update` retornam `usuariosVinculados` (mapeado de `_count.usuarioCargos`).
- `RolesService` é **exportado** — pode ser injetado em outros módulos que precisem resolver permissões ou cargos.

**Testes unitários (`server/test/unit/roles/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `roles.controller.spec.ts` | Delegação controller → service; ids numéricos nos métodos (alinhado a `ParseIntPipe` em runtime); defaults de page/limit; todos os endpoints |
| `roles.service.spec.ts` | `findAllWithSectors`, `findAllPaginated` (mapeamento `usuariosVinculados`, filtro search), `findById` (NotFoundException, mapeamento), `create` (defaults categoria/ativo, ConflictException), `update` (NotFoundException), `updateRolePermissions` (transação, lista vazia não chama createMany), `getUserRoles` (NotFoundException, retorna cargos), `updateUserRoles` (NotFoundException, transação) |
| `assign-dtos.validation.spec.ts` | `class-validator` em `AssignPermissionsDto` / `AssignRolesDto` (array válido, campo ausente, elemento não numérico) |

**Testes E2E (`server/test/roles.e2e-spec.ts`):**

- Módulo isolado `RolesModule` + `PermissionsGuard` mockado; `ValidationPipe` global (`whitelist`, `transform`) como no app.
- Fluxos: listagens, paginação, CRUD de cargo, conflito `(setorId, code)`, PATCH permissões (substituir / limpar), validação de body, usuário inexistente, ids de rota inválidos (**400** com `ParseIntPipe`).
- Limpeza de dados: `cleanupE2eRoles` + helpers `e2eRolesCargoCode` / `e2eRolesUserEmail` em `server/test/helpers/e2e-db-cleanup.ts` (usuários com e-mail `*@e2e-roles-nexus.test`, cargos com `code` prefixo `E2E_ROLES_CARGO_`). Teste unitário do cleanup em `server/test/unit/helpers/e2e-db-cleanup.spec.ts`.

**Frontend — arquivos do domínio:**

| Arquivo | Função |
|---------|--------|
| `client/src/pages/cargos/CargosPage.tsx` | Lista paginada de cargos com filtros de nome/categoria; abre `CargoModal` para criar/editar; `queryKey: ["roles-paginated"]`; `GET /roles/paginated?search&categoria&page&limit=15` |
| `client/src/pages/cargos/CargoModal.tsx` | Modal unificado criar/editar cargo; matriz de permissões agrupada por setor/item/ação; painel lateral "Resumo do Cargo" |

**`CargosPage` — detalhes de estado e queries:**

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `search` | `string` | Input controlado; debounce 300 ms via `useDebounce` |
| `categoriaFilter` | `string` | `"TODAS"` (sem filtro) ou `CategoriaCargo`; reset page ao mudar |
| `page` | `number` | Paginação servidor; reset ao mudar search/categoria |
| `modalOpen` | `boolean` | Controla abertura do modal |
| `editingCargo` | `Cargo \| null` | `null` = criação; objeto = edição |

Queries adicionais disparadas **só quando `modalOpen = true`** (prop `enabled`):
- `queryKey: ["setores"]` → `GET /roles/setores`
- `queryKey: ["permissions"]` → `GET /roles/permissions`

**`CargoModal` — props e lógica:**

```ts
interface CargoModalProps {
  open: boolean;
  cargo: Cargo | null;   // null = criação
  isNew: boolean;
  onClose: () => void;
  permissoes: Permission[];
  setores: Setor[];
}
```

- **Criar:** `POST /roles` (sem `ativo` — sempre `true`); se `permissionIds.length > 0`, chama `PATCH /roles/:id/permissions` em seguida. `code` gerado automaticamente: `nome.toUpperCase().replace(/\s+/g, "_")`.
- **Editar:** `Promise.all([PATCH /roles/:id, PATCH /roles/:id/permissions])` — atualiza dados e permissões em paralelo. Campo `ativo` só aparece no formulário ao editar (`!isNew`).
- Invalidação: `queryClient.invalidateQueries({ queryKey: ["roles-paginated"] })` em `onSuccess` de ambas as mutations.

**Permissões verificadas via `useAuth().hasPermission`:**

| Código | Efeito na UI |
|--------|-------------|
| `ADMINISTRATIVO.CARGO.CRIAR` | Exibe botão "Novo Cargo" |
| `ADMINISTRATIVO.CARGO.EDITAR` | Exibe DropdownMenu com "Editar Cargo" por linha |

**Constantes de exibição (definidas em ambos os arquivos — duplicação intencional):**

```ts
// Cores por CategoriaCargo
CATEGORIA_CONFIG = {
  OPERACIONAL:    { label: "Operacional",    className: "bg-blue-100 text-blue-700 ...",    dotColor: "bg-blue-500" },
  ADMINISTRATIVO: { label: "Administrativo", className: "bg-emerald-100 text-emerald-700 ...", dotColor: "bg-emerald-500" },
  GESTAO:         { label: "Gestão",         className: "bg-purple-100 text-purple-700 ...", dotColor: "bg-purple-500" },
}
```

**Matriz de permissões em `CargoModal`:**

Permissões chegam da API como `{ id, code }[]` onde `code` tem formato `SETOR.ITEM.ACAO` (ex.: `ADMINISTRATIVO.CARGO.CRIAR`). A função `agruparPermissoes` transforma em `Record<setor, Record<item, { acao, permissao }[]>>`.

| Constante | Descrição |
|-----------|-----------|
| `ORDEM_SETORES` | `["ADMINISTRATIVO", "CONFIGURACAO", "AGENDAMENTO"]` |
| `ORDEM_ITENS` | `ADMINISTRATIVO: ["CARGO","USUARIO"]`; `CONFIGURACAO: ["APARELHO","EQUIPAMENTO"]`; `AGENDAMENTO: ["CLIENTE","OS","TESTES","PEDIDO_RASTREADOR","TECNICO"]` |
| `ORDEM_ACOES` | `["LISTAR","CRIAR","EDITAR","EXCLUIR","EXECUTAR"]` |
| `NOMES_SETOR` | `ADMINISTRATIVO→"Administrativo"`, `CONFIGURACAO→"Configuração"`, `AGENDAMENTO→"Agendamento & Ordens"` |
| `NOMES_ITEM` | Mapa de código para label pt-BR (ex.: `OS→"Ordens de Serviço"`) |
| `NOMES_ACAO` | `LISTAR→"Visualizar"`, `CRIAR→"Criar"`, `EDITAR→"Editar"`, `EXCLUIR→"Deletar"`, `EXECUTAR→"Executar"` |

Setores são expansíveis/colapsáveis; checkbox "Acesso Total ao Setor" seleciona/deseleciona todas as permissões do setor de uma vez. Células sem permissão no backend exibem `—` (não são selecionáveis).

**Aviso de lógica de acesso (exibido no painel lateral do modal):**
> Permissões de **Criar** ou **Editar** habilitam automaticamente a permissão de **Visualizar** para o recurso correspondente. *(Lógica aplicada no backend/guards, não no frontend.)*

---

