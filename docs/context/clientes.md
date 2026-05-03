# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `clientes`

**Arquivos do módulo (`server/src/clientes/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `clientes.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule` |
| `clientes.controller.ts` | Rotas em `/clientes`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('clientes')` |
| `clientes.service.ts` | `findAll`, `findOne`, `create`, `update` |
| `clientes.contato.helpers.ts` | `toPrismaContatoWriteData` — mapeamento único de `nome` / `celular` / `email` para persistência de `ContatoCliente` (create + update) |
| `dto/create-cliente.dto.ts` | Criação de cliente + contatos; define enums `TipoContrato` e `StatusCliente` (validação + Swagger) |
| `dto/update-cliente.dto.ts` | `UpdateClienteDto` = `PartialType(OmitType(CreateClienteDto, ['contatos']))` + campo `contatos?: UpdateContatoDto[]` (`@nestjs/swagger`). `UpdateContatoDto` **estende** `ContatoDto` e só adiciona `id?` para upsert |

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

- `Cliente`: `id`, `nome`, `nomeFantasia`, `cnpj`, `tipoContrato` (`TipoContrato`), `status` (`StatusCliente`), `cor` (`String? @db.VarChar(7)` — hex de 7 chars, ex.: `#3b82f6`), `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `criadoEm`, `atualizadoEm`.
- `ContatoCliente`: `id`, `clienteId`, `nome`, `celular?`, `email?`.
- `Subcliente`: relação N de `Cliente` — incluída opcionalmente no `findAll` e sempre no `findOne`.

**Enums:**

- `TipoContrato`: `COMODATO` | `AQUISICAO` (default `COMODATO`)
- `StatusCliente`: `ATIVO` | `PENDENTE` | `INATIVO` (default `ATIVO`)

**Regras de negócio críticas:**

- `findAll` **exclui** o cliente com `id = CLIENTE_INFINITY_ID` (= `1`, constante em `server/src/common/constants.ts`) — esse registro é reservado para aparelhos próprios da Infinity e **nunca** deve aparecer para o usuário.
- `update` gerencia contatos via **upsert manual em transação**: contatos sem `id` são criados; com `id` são atualizados; contatos existentes cujo `id` não esteja na lista enviada são **deletados** (`deleteMany` com `notIn`).
- **Segurança / integridade (contatos):** antes de qualquer `deleteMany` ou `update` de linhas de contato, o service valida cada `contato.id` informado com `contatoCliente.findFirst({ where: { id, clienteId } })`. Se o id não pertencer ao cliente da URL → `BadRequestException('Contato não pertence a este cliente')` e **nenhuma** alteração de contatos é aplicada (evita IDOR e evita apagar contatos legítimos ao falhar só depois do delete).
- `findOne` lança `NotFoundException` se cliente não existe; `update` chama `findOne` internamente antes de persistir.
- Campos de endereço são todos opcionais (`string?`) e não há geocoding neste módulo.

**Frontend (`client/src/pages/clientes/`):**

| Caminho | Responsabilidade |
|---------|-----------------|
| `ClientesPage.tsx` | Orquestra header, tabela, rodapé e modal; estado do modal (`modalOpen`, `editingCliente`) |
| `shared/clientes-page.shared.ts` | Schema Zod (`clienteFormSchema`), tipos, enums/labels/classes de UI (`TIPO_CONTRATO_*`, `STATUS_*`, filtros, legenda), `CLIENTES_PAGE_SIZE`, `getDefaultClienteFormValues`, `clienteToFormValues`, `buildClienteApiBody`, `getClientesFooterStats`, `formatClienteEnderecoLinhaLista` / `formatClienteEnderecoResumo` |
| `hooks/useClientesPageList.ts` | `useQuery` com `queryKey: ["clientes"]`, filtros, paginação, `expandedId`, stats do rodapé; exporta também `CLIENTES_QUERY_KEY` e `CLIENTES_LISTA_QUERY_KEY` |
| `components/ClientesPageHeader.tsx` | Voltar, busca, filtros SearchableSelect, botão Novo Cliente |
| `components/ClientesTable.tsx` | Tabela principal + expansão de linha |
| `components/ClienteRowExpandedPanel.tsx` | Endereço (texto via `formatClienteEnderecoLinhaLista`), grid de contatos, Editar |
| `components/ClientesTableFooter.tsx` | Texto de totais, legenda tipo contrato, paginação |
| `cliente-modal/` | `ClienteModal.tsx`, seções do formulário (`ClienteModalDadosSection`, `Endereco`, `Contatos`, `Resumo`), `useClienteModal.ts` (RHF, `useFieldArray`, mutations, `useWatch` para resumo) |

A listagem usa `useClientesPageList`; o modal usa `useClienteModal` (TanStack Query `queryKey: ["clientes"]` + `api("/clientes")` na listagem).

**Estado e filtros (todos client-side, sem query params):**

| Estado | Tipo | Função |
|--------|------|--------|
| `busca` | `string` | Filtra por `nome`, `nomeFantasia` ou `cnpj` (substring) |
| `filtroTipoContrato` | `"todos"\|"COMODATO"\|"AQUISICAO"` | Filtro por tipo de contrato |
| `page` | `number` (0-indexed) | Paginação; PAGE_SIZE = 10 |
| `expandedId` | `number\|null` | ID da linha expandida; exibe contatos e endereço inline |
| `modalOpen` | `boolean` | Controla Dialog de criação/edição |
| `editingCliente` | `Cliente\|null` | `null` = modo criação; preenchido = modo edição |

**Rodapé da tabela:** texto derivado de `getClientesFooterStats(clientes, filtered)` — **“Exibindo X de Y cliente(s) · Z ativo(s) na seleção”**, onde `Z` conta só `status === "ATIVO"` **entre os registros já filtrados** (coerente com a lista), não um total global enganoso.

**Permissões checadas:**
- `AGENDAMENTO.CLIENTE.CRIAR` → exibe botão "Novo Cliente"
- `AGENDAMENTO.CLIENTE.EDITAR` → exibe botão "Editar" na linha expandida

**Formulário (react-hook-form + Zod):**

Três seções no modal:
1. **Dados do Cliente** — `nome` (obrigatório), `nomeFantasia`, `cnpj` (via `InputCNPJ`; campo vazio é válido; quando preenchido, validado por `validarCNPJ` de `@/lib/cpf-cnpj-validation` — desabilitável via `VITE_VALIDATE_CPF_CNPJ=false`), `tipoContrato` (Select), `status` (Select), `cor` (via `InputCor` — color picker; opcional)
2. **Endereço (opcional)** — `cep` via `InputCEP` com `onAddressFound` que auto-preenche `logradouro`, `bairro`, `cidade`, `estado` via BrasilAPI; `estado` usa `SelectUF` (hook `useUFs`); `cidade` usa `SelectCidade` (hook `useMunicipios(estado)`)
3. **Contatos** — array gerenciado por `useFieldArray`; cada item tem `nome` (obrigatório), `celular` (`InputTelefone`), `email`; botão Trash2 remove inline

**Sidebar de preview ao vivo:** `useWatch({ control })` sobre o formulário inteiro (sem mapeamento frágil por índice de tupla); fallback `getDefaultClienteFormValues()`. Painel fixo à direita do modal (w-64) mostra razão social, tipo de contrato, endereço e contagem de contatos em tempo real. Badge de tipo no resumo usa `resumoForm.tipoContrato ?? "COMODATO"` para índice seguro.

**Mutations:**
- `createMutation` → `POST /clientes` com corpo `buildClienteApiBody(data, "create")`
- `updateMutation` → `PATCH /clientes/:id` com corpo `buildClienteApiBody(data, "update")` — contatos com `id` para upsert; novos sem `id`; backend valida posse dos ids e deleta os não enviados
- Ambas invalidam `["clientes"]` **e** `["clientes-lista"]` no `onSuccess` (outras telas reutilizam o mesmo endpoint com a segunda chave) e fecham o modal

**Exibição na tabela:**
- ID exibido como `(c.id - 1).padStart(4, "0")` — **0-indexed, 4 dígitos** (não é o ID real do banco)
- Badge tipoContrato e legenda do rodapé: valores/labels/classes centralizados em `shared/clientes-page.shared.ts` (`TIPO_CONTRATO_LABEL`, `TIPO_CONTRATO_BADGE_CLASS`, `TIPO_CONTRATO_LEGEND_SWATCH_CLASS`, etc.)
- Status: ponto colorido — `STATUS_INDICATOR_DOT_CLASS`; label amigável `STATUS_CLIENTE_LABEL`
- Linha expandida: cards de contatos em grid responsivo + bloco de endereço com `MapPin`

**Campo `cor`:**
- Armazena hex de 7 chars (ex.: `#3b82f6`); opcional.
- No formulário: `InputCor` (color picker com `react-colorful`, paleta rápida e input hex manual). Preview ao vivo do badge ao lado do picker.
- Badge de cor é usado em outras páginas (ex.: `AparelhosPage`) para identificar o cliente com cor personalizada.
- Incluído no payload via `buildClienteApiBody` (strings vazias omitidas).

**Formatadores usados:** `formatarCNPJ`, `formatarTelefone`, `formatarCEP` — todos de `@/lib/format`.

**Testes**

| Local | Arquivo | Cobertura |
|-------|---------|-----------|
| Unit (server) | `test/unit/clientes/clientes.controller.spec.ts` | Delegação ao service; parsing de id; query `subclientes`; propagação de `BadRequestException` |
| Unit (server) | `test/unit/clientes/clientes.service.spec.ts` | `findAll` (Infinity), `findOne`, `create`/`update`, validação de posse de contatos antes do `deleteMany`, IDOR |
| Unit (server) | `test/unit/clientes/clientes.contato.helpers.spec.ts` | `toPrismaContatoWriteData` |
| Unit (server) | `test/unit/clientes/update-cliente.dto.spec.ts` | `class-validator` em DTOs de update |
| E2E (server) | `test/clientes.e2e-spec.ts` | Smoke 401 em GET/POST/PATCH `/clientes` (app com `ValidationPipe`) |
| Unit (client) | `src/__tests__/pages/clientes-page.shared.test.ts` | Schema, payloads API, defaults, `getClientesFooterStats`, constantes de filtro |
| Unit (client) | `src/__tests__/pages/clientes/clientes-page.shared.test.ts` | Formatadores de endereço (`formatClienteEnderecoLinhaLista` / `Resumo`), `CLIENTES_PAGE_SIZE`, stats |
| Unit (client) | `src/__tests__/pages/clientes/useClientesPageList.test.tsx`, `useClienteModal.test.tsx` | Hook de lista e hook do modal |
| Unit (client) | `src/__tests__/pages/clientes/ClientesPageHeader.test.tsx`, `ClientesTable*.test.tsx`, `ClienteRowExpandedPanel.test.tsx` | Componentes da listagem |
| Integração (client) | `src/__tests__/pages/clientes/ClientesPage.integration.test.tsx`, `ClienteModal.integration.test.tsx` | Fluxos de UI |
| Unit (client) | `src/__tests__/pages/ClientesPage.test.tsx` | Rodapé coerente com filtros / busca |

---
