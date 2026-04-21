# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `clientes`

**Arquivos do módulo (`server/src/clientes/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `clientes.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule` |
| `clientes.controller.ts` | Rotas em `/clientes`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('clientes')` |
| `clientes.service.ts` | `findAll`, `findOne`, `create`, `update` |
| `dto/create-cliente.dto.ts` | Criação de cliente + contatos; define enums `TipoContrato` e `StatusCliente` |
| `dto/update-cliente.dto.ts` | Atualização parcial; `UpdateContatoDto` com `id?` opcional para upsert de contatos |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/clientes` | `AGENDAMENTO.CLIENTE.LISTAR` |
| GET | `/clientes/:id` | `AGENDAMENTO.CLIENTE.LISTAR` |
| POST | `/clientes` | `AGENDAMENTO.CLIENTE.CRIAR` |
| PATCH | `/clientes/:id` | `AGENDAMENTO.CLIENTE.EDITAR` |

> Não existe rota de exclusão. `AGENDAMENTO.CLIENTE.EXCLUIR` pode ou não estar em `permission-codes.ts` mas não há endpoint correspondente.

**Query param em `GET /clientes`:**

- `subclientes=1` ou `subclientes=true` → inclui relação `subclientes` no retorno (padrão: omitido).

**Modelos Prisma (campos-chave):**

- `Cliente`: `id`, `nome`, `nomeFantasia`, `cnpj`, `tipoContrato` (`TipoContrato`), `estoqueProprio` (boolean, default `false`), `status` (`StatusCliente`), `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `criadoEm`, `atualizadoEm`.
- `ContatoCliente`: `id`, `clienteId`, `nome`, `celular?`, `email?`.
- `Subcliente`: relação N de `Cliente` — incluída opcionalmente no `findAll` e sempre no `findOne`.

**Enums:**

- `TipoContrato`: `COMODATO` | `AQUISICAO` (default `COMODATO`)
- `StatusCliente`: `ATIVO` | `PENDENTE` | `INATIVO` (default `ATIVO`)

**Regras de negócio críticas:**

- `findAll` **exclui** o cliente com `id = CLIENTE_INFINITY_ID` (= `1`, constante em `server/src/common/constants.ts`) — esse registro é reservado para aparelhos próprios da Infinity e **nunca** deve aparecer para o usuário.
- `update` gerencia contatos via **upsert manual em transação**: contatos sem `id` são criados; com `id` são atualizados; contatos existentes cujo `id` não esteja na lista enviada são **deletados** (`deleteMany` com `notIn`).
- `findOne` lança `NotFoundException` se cliente não existe; `update` chama `findOne` internamente antes de persistir.
- Campos de endereço são todos opcionais (`string?`) e não há geocoding neste módulo.

**Frontend (`client/src/pages/clientes/ClientesPage.tsx`):**

Sem hook dedicado `useClientes`; página usa TanStack Query diretamente com `queryKey: ["clientes"]` e `api("/clientes")`.

**Estado e filtros (todos client-side, sem query params):**

| Estado | Tipo | Função |
|--------|------|--------|
| `busca` | `string` | Filtra por `nome`, `nomeFantasia` ou `cnpj` (substring) |
| `filtroTipoContrato` | `"todos"\|"COMODATO"\|"AQUISICAO"` | Filtro por tipo de contrato |
| `filtroEstoque` | `"todos"\|"proprio"\|"terceiro"` | Filtra `estoqueProprio` boolean |
| `page` | `number` (0-indexed) | Paginação; PAGE_SIZE = 10 |
| `expandedId` | `number\|null` | ID da linha expandida; exibe contatos e endereço inline |
| `modalOpen` | `boolean` | Controla Dialog de criação/edição |
| `editingCliente` | `Cliente\|null` | `null` = modo criação; preenchido = modo edição |

**Permissões checadas:**
- `AGENDAMENTO.CLIENTE.CRIAR` → exibe botão "Novo Cliente"
- `AGENDAMENTO.CLIENTE.EDITAR` → exibe botão "Editar" na linha expandida

**Formulário (react-hook-form + Zod):**

Três seções no modal:
1. **Dados do Cliente** — `nome` (obrigatório), `nomeFantasia`, `cnpj` (via `InputCNPJ`), `tipoContrato` (Select), `status` (Select), `estoqueProprio` (toggle switch customizado)
2. **Endereço (opcional)** — `cep` via `InputCEP` com `onAddressFound` que auto-preenche `logradouro`, `bairro`, `cidade`, `estado` via BrasilAPI; `estado` usa `SelectUF` (hook `useUFs`); `cidade` usa `SelectCidade` (hook `useMunicipios(estado)`)
3. **Contatos** — array gerenciado por `useFieldArray`; cada item tem `nome` (obrigatório), `celular` (`InputTelefone`), `email`; botão Trash2 remove inline

**Sidebar de preview ao vivo:** `useWatch` nos campos do form alimenta `watchedObj`; painel fixo à direita do modal (w-64) mostra razão social, tipo contrato, endereço e contagem de contatos em tempo real.

**Mutations:**
- `createMutation` → `POST /clientes`; campos de endereço vazios convertidos para `undefined` antes do envio
- `updateMutation` → `PATCH /clientes/:id`; contatos com `id` fazem upsert; contatos sem `id` são criados; backend deleta os não enviados
- Ambas invalidam `["clientes"]` no `onSuccess` e fecham o modal

**Exibição na tabela:**
- ID exibido como `(c.id - 1).padStart(4, "0")` — **0-indexed, 4 dígitos** (não é o ID real do banco)
- Badge tipoContrato: `COMODATO` = amber, `AQUISICAO` = indigo
- Status: ponto colorido — `ATIVO` emerald, `PENDENTE` amber, `INATIVO` slate
- `estoqueProprio`: ícone CheckCircle (emerald) ou X (slate)
- Linha expandida: cards de contatos em grid responsivo + bloco de endereço com `MapPin`

**Formatadores usados:** `formatarCNPJ`, `formatarTelefone`, `formatarCEP` — todos de `@/lib/format`.

**Testes unitários (`server/test/unit/clientes/`):**

| Arquivo | Cobertura esperada |
|---------|-------------------|
| `clientes.controller.spec.ts` | Delegação controller → service; parsing de id; query param `subclientes` |
| `clientes.service.spec.ts` | `findAll` (exclusão Infinity), `findOne` (not found), `create` (com/sem contatos), `update` (upsert contatos em tx) |

---

