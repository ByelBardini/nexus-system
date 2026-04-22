# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `tecnicos`

**Arquivos do módulo (`server/src/tecnicos/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `tecnicos.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`, `GeocodingModule` |
| `tecnicos.controller.ts` | Rotas em `/tecnicos`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('tecnicos')` |
| `tecnicos.service.ts` | `findAll`, `findOne`, `create`, `update`; geocoding integrado; delega montagem de payloads Prisma a `tecnicos.persist-helpers.ts` |
| `tecnicos.persist-helpers.ts` | Funções puras: `tecnicoCreateDataFromDto`, `tecnicoUpdateDataFromDto`, `precoTecnicoDataForCreate`, `precoTecnicoMergedRowForUpsert` (merge PATCH parcial de preços + flag `hadExisting` para update vs create) |
| `dto/precos.dto.ts` | `PrecosDto` compartilhado (class-validator + Swagger); usado em create e update |
| `dto/create-tecnico.dto.ts` | Criação de técnico; referencia `PrecosDto`; `ativo` default `true` no service |
| `dto/update-tecnico.dto.ts` | Atualização parcial; referencia o mesmo `PrecosDto` |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/tecnicos` | `AGENDAMENTO.TECNICO.LISTAR` |
| GET | `/tecnicos/:id` | `AGENDAMENTO.TECNICO.LISTAR` |
| POST | `/tecnicos` | `AGENDAMENTO.TECNICO.CRIAR` |
| PATCH | `/tecnicos/:id` | `AGENDAMENTO.TECNICO.EDITAR` |

> Não existe rota de exclusão. `AGENDAMENTO.TECNICO.EXCLUIR` pode existir em `permission-codes.ts` mas não há endpoint correspondente.

**Modelos Prisma (campos-chave):**

- `Tecnico`: `id`, `nome`, `cpfCnpj?`, `telefone?`, `cidade?`, `estado?` (**atuação** — exibição e mapa), `cep?`, `logradouro?`, `numero?`, `complemento?`, `bairro?`, `cidadeEndereco?`, `estadoEndereco?` (**endereço de entrega** — usado no geocoding), `latitude?`, `longitude?`, `geocodingPrecision?` (`GeocodingPrecision`), `geocodedAt?`, `ativo` (bool, default `true`), `criadoEm`, `atualizadoEm`.
- `PrecoTecnico`: relação **1:1** com `Tecnico` (`tecnicoId` unique); campos `instalacaoComBloqueio`, `instalacaoSemBloqueio`, `revisao`, `retirada`, `deslocamento` (todos `Decimal`, default `0`).

> **Atenção — dois conjuntos de endereço:** `cidade`/`estado` = cidade/UF de **atuação** (filtro e mapa); `cidadeEndereco`/`estadoEndereco` + campos `cep`/`logradouro`/`numero`/`complemento`/`bairro` = endereço de **entrega do rastreador** (base do geocoding).

**Regras de negócio críticas:**

- `findAll`: ordenado por `nome asc`; inclui `precos`.
- `findOne`: inclui `precos`; lança `NotFoundException('Técnico não encontrado')` se não existir.
- `create`: monta `data` com `tecnicoCreateDataFromDto` → cria `Tecnico` → se `precos` fornecido, `precoTecnicoDataForCreate` + `precoTecnico.create` → chama `persistGeocoding` sempre; retorna `findOne`.
- `update`: chama `findOne` (valida existência) → `prisma.$transaction` com `tecnico.update` (`tecnicoUpdateDataFromDto`) + upsert de `PrecoTecnico` via `precoTecnicoMergedRowForUpsert` (update se já existir linha, create caso contrário); fora da transação, verifica `addressChanged` e chama `persistGeocoding` somente se algum campo de endereço mudou.
- **`addressChanged`** compara apenas: `cep`, `logradouro`, `numero`, `cidadeEndereco`, `estadoEndereco`. Mudanças em `complemento`, `bairro` ou campos de atuação **não** disparam geocoding.
- **`persistGeocoding`**: chama `GeocodingService.geocode` com mapeamento `cidadeEndereco → cidade`, `estadoEndereco → uf`; persiste `latitude`, `longitude`, `geocodingPrecision`, `geocodedAt`; erros são logados como `warn` e **nunca** propagam exceção — `create`/`update` sempre concluem.
- Atualização parcial de preços em `update`: usa `Number(existingPrecos?.campo ?? 0)` para herdar valores existentes (Prisma pode retornar `Decimal` como string `"150.00"`; o `Number()` normaliza).

**Convenção frontend — preços em centavos:**

O frontend armazena e exibe preços em centavos inteiros via `InputPreco`. O corpo JSON de `POST`/`PATCH` é montado por **`buildTecnicoApiBody`** (`client/src/pages/tecnicos/tecnico-form.ts`), que divide cada campo de preço por 100. A API recebe e persiste em reais. Ao carregar para edição, multiplica por 100 (`tecnicoPrecoToNum(t.precos?.campo) * 100`).

**Frontend — arquivos do domínio:**

| Arquivo | Função |
|---------|--------|
| `client/src/pages/tecnicos/TecnicosPage.tsx` | Lista + mapa lateral + modal criar/editar; filtros por nome/estado/status; paginação client-side (`PAGE_SIZE=10`); `queryKey: ["tecnicos"]` |
| `client/src/pages/tecnicos/tecnico-form.ts` | `tecnicoFormSchema` (Zod), tipo `TecnicoFormData`, `emptyTecnicoFormValues()` (defaults do modal + `useForm`), `buildTecnicoApiBody()` (payload único para `createMutation` e `updateMutation`) |
| `client/src/components/TecnicosMap.tsx` | Mapa Leaflet com marcadores dos técnicos; carregado via `lazy()` |
| `client/src/lib/tecnicos-page.ts` | `nextMapState`, `tecnicoPrecoToNum`, tipo `MapState` (`'collapsed' \| 'expanded' \| 'fullscreen'`) |
| `client/src/lib/tecnico-map-marker-html.ts` | Gera HTML do marcador Leaflet por técnico |
| `client/src/lib/tecnico-map-cluster.ts` | Agrupamento de marcadores próximos |
| `client/src/lib/tecnico-map-spread.ts` | Espalhamento de marcadores sobrepostos (mesma coordenada) |

Sem hook dedicado `useTecnicos`; página usa `useQuery` do TanStack Query diretamente.

**Frontend — `TecnicosPage` detalhes:**

**Interface `Tecnico` (frontend):** `id`, `nome`, `cpfCnpj?`, `telefone?`, `cidade?`, `estado?` (atuação), `cep?`, `logradouro?`, `numero?`, `complemento?`, `bairro?`, `cidadeEndereco?`, `estadoEndereco?` (entrega), `latitude?`, `longitude?`, `geocodingPrecision: "EXATO" | "CIDADE" | null`, `ativo`, `precos?: { instalacaoComBloqueio, instalacaoSemBloqueio, revisao, retirada, deslocamento }` (cada campo `number | string` — normalizar com `tecnicoPrecoToNum`).

**Estado da página:**

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `modalOpen` | `boolean` | Controla abertura do Dialog |
| `editingTecnico` | `Tecnico \| null` | `null` = criação; preenchido = edição |
| `expandedId` | `number \| null` | Linha expandida na tabela (accordion) |
| `busca` | `string` | Filtro por nome (case-insensitive) |
| `filtroEstado` | `string` | Filtro por `t.estado`; `"todos"` = sem filtro |
| `filtroStatus` | `"todos" \| "ativo" \| "inativo"` | Filtro por `t.ativo` |
| `page` | `number` | Página atual (0-indexed); reset para 0 ao mudar filtros |
| `mapState` | `MapState` | Ciclo collapsed(40%) → expanded(75%) → fullscreen(fixo inset-0 z-40) |

**Filtros e paginação:** todos client-side sobre o array `tecnicos` do `useQuery`. Filtros combinados com AND lógico. `filtered` alimenta o `TecnicosMap` e a tabela paginada.

**Mutations:**

| Mutation | Endpoint | Payload | onSuccess |
|----------|----------|---------|-----------|
| `updateStatusMutation` | `PATCH /tecnicos/:id` | `{ ativo: boolean }` | Invalida `["tecnicos"]`; `toast.success` |
| `createMutation` | `POST /tecnicos` | `JSON.stringify(buildTecnicoApiBody(data))` | Invalida `["tecnicos"]`; fecha modal |
| `updateMutation` | `PATCH /tecnicos/:id` | idem (`buildTecnicoApiBody`) | Invalida `["tecnicos"]`; fecha modal |

**Formulário:** schema Zod e defaults vêm de `tecnico-form.ts` (`tecnicoFormSchema`, `emptyTecnicoFormValues`). Campos: `nome` (obrigatório ao submeter; default `""` no modal até o usuário preencher), `cpfCnpj?`, `telefone?`, `cidade?`, `estado?`, `cep?`, `logradouro?`, `numero?`, `complemento?`, `bairro?`, `cidadeEndereco?`, `estadoEndereco?`, `ativo: boolean`, cinco preços como `z.coerce.number().min(0)` em centavos. Resolver: `zodResolver(tecnicoFormSchema)`.

**Comportamentos não-óbvios do formulário:**
- Ao mudar `estado` (atuação), `cidade` é resetada para `""` via `form.setValue("cidade", "")`.
- `InputCEP.onAddressFound` preenche automaticamente `logradouro`, `bairro`, `cidadeEndereco`, `estadoEndereco` (e `complemento` se existir).
- Sidebar "Resumo do Técnico" usa `useWatch` em `nome`, `cidade`, `estado`, `instalacaoSemBloqueio`, `revisao`, `deslocamento` — atualiza em tempo real sem rerenderizar o form inteiro.
- Sidebar exibe preços em centavos via `formatarMoedaDeCentavos` (diferente da tabela que usa `tecnicoPrecoToNum` + `formatarMoeda`).

**Permissões frontend:**
- `canCreate` = `hasPermission("AGENDAMENTO.TECNICO.CRIAR")` — mostra botão "Novo Técnico".
- `canEdit` = `hasPermission("AGENDAMENTO.TECNICO.EDITAR")` — mostra toggle de status na tabela (habilitado) e botão "Editar Perfil" na linha expandida.

**Linha expandida (accordion):** exibe endereço de entrega completo + tabela de 5 custos operacionais + botão "Editar Perfil" (se `canEdit`). O click na linha alterna `expandedId`; o click no toggle de status usa `e.stopPropagation()`.

**Mapa (`TecnicosMap`):** carregado com `lazy()` + `Suspense`; recebe `filtered` (não `paginated`). Tamanho controlado por `mapState`: `collapsed`=`w-[40%]`, `expanded`=`w-[75%]`, `fullscreen`=`fixed inset-0 z-40`. O botão no canto superior direito do mapa avança no ciclo via `nextMapState`; no estado `expanded` aparece segundo botão para recolher direto para `collapsed`.

**Seções do modal (form):**
1. **01. Dados Básicos** — Nome, CPF/CNPJ, Status, Telefone, Estado de Atuação, Cidade de Atuação.
2. **02. Endereço para envio de rastreador** — CEP (auto-preenche), Logradouro, Número, Complemento, Bairro, Cidade, Estado.
3. **03. Valores de Serviço** — Instalação c/ Bloqueio, s/ Bloqueio, Revisão, Retirada, Deslocamento (km).

**Testes unitários (`server/test/unit/tecnicos/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `tecnicos.controller.spec.ts` | Delegação controller → service; conversão id para número; `NotFoundException` propagada |
| `tecnicos.service.spec.ts` | `findAll` (ordenação + preços), `findOne` (not found/found), `create` (sem preços, com preços, `ativo` default true, preços parciais com zero), `update` (not found, sem preços, atualiza preços existentes, cria preços novos, usa transação), geocoding (persiste lat/lng/precision/geocodedAt; não persiste quando `geocode` retorna null; precision `CIDADE`; não chama em update quando endereço não mudou; chama quando qualquer campo muda: `cep`, `logradouro`, `numero`, `cidadeEndereco`, `estadoEndereco`; não quebra quando geocode lança exceção ou persistência falha) |
| `tecnicos.persist-helpers.spec.ts` | `tecnicoCreateDataFromDto` (`ativo` default vs false), `tecnicoUpdateDataFromDto` (`ativo` undefined), `precoTecnicoDataForCreate` (zeros e zero explícito), `precoTecnicoMergedRowForUpsert` (sem linha existente, merge com Decimal/string, `null` herdado → 0) |

**Testes E2E (`server/test/tecnicos.e2e-spec.ts`):** módulo `TecnicosModule` com `GeocodingService` mockado e `PermissionsGuard` relaxado (ou guard customizado no bloco de permissão POST). Inclui: lista com campos de coordenadas; `POST` com endereço persiste geocode; `POST` com geocode `null`; `PATCH` sem mudar endereço não re-chama geocode; `PATCH` mudando CEP chama geocode; **`GET /tecnicos/:id`** com preços após criação; **`GET` 404** para id inexistente; **`POST` sem `precos`** → `precos` null na resposta; **`PATCH` com `precos` parcial** preserva demais valores. Bloco separado valida **403** em `POST` quando o guard nega criação. Limpeza: `cleanupE2eTecnicos` (nomes começando com `E2E`).

**Testes frontend:** `client/src/__tests__/pages/tecnicos/tecnico-form.test.ts` (schema, `buildTecnicoApiBody`, defaults); `TecnicosPage.test.tsx` também cobre POST e PATCH com corpo coerente com o payload compartilhado.

---

