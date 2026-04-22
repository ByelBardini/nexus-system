# Context — Nexus System

Ver índice em `AGENTS.md`. Páginas de aparelhos/equipamentos (detalhe de UI).

**Frontend — páginas do domínio:**

| Arquivo | Função |
|---------|--------|
| `client/src/pages/aparelhos/AparelhosPage.tsx` | Orquestra a lista (loading + composição de subcomponentes em `lista/`) |
| `client/src/pages/aparelhos/lista/useAparelhosList.ts` | Hook: `useQuery` de aparelhos e kits, estado de filtros/paginação/expansão, derivados (`filtered`, `paginated`, contagens) |
| `client/src/pages/aparelhos/lista/aparelhos-page.shared.ts` | Tipos `Aparelho`, `HistoricoItem`, `TIPO_CONFIG`, `PROPRIETARIO_CONFIG`, `PAGE_SIZE`, `AparelhosFiltros` |
| `client/src/pages/aparelhos/lista/aparelhos-list.helpers.ts` | Funções puras: filtro, marcas, contagens por status, paginação, resolução de kit/vínculos, nomes de técnico/cliente (inclui diferença coluna tabela vs. painel “Vínculos”) |
| `client/src/pages/aparelhos/lista/AparelhosStatusPipeline.tsx` | Cards de status no topo (`data-testid` nos botões) |
| `client/src/pages/aparelhos/lista/AparelhosToolbar.tsx` | Busca, selects de filtro, links Lote/Individual |
| `client/src/pages/aparelhos/lista/AparelhosTable.tsx` | Tabela + estado vazio |
| `client/src/pages/aparelhos/lista/AparelhoTableRow.tsx` | Linha clicável e expansão |
| `client/src/pages/aparelhos/lista/AparelhoExpandedDetails.tsx` | Painel expandido (3 colunas: equipamento, vínculos, histórico) |
| `client/src/pages/aparelhos/lista/AparelhosTableFooter.tsx` | Rodapé com intervalo exibido e paginação |
| `client/src/__tests__/pages/aparelhos/*` | Testes (helpers, `shared/`, `cadastro-individual/`, `cadastro-lote/`, fluxo integrado da lista) |
| `client/src/pages/aparelhos/shared/` | Código comum aos cadastros (individual e lote): `catalog.types.ts`, `catalog.helpers.ts` (filtros de modelo, operadora, IDs), `debito-rastreador.ts` (tipo API + `filterDebitosRastreadores` / `formatDebitoLabel`), `useAparelhoCadastroCatalogs.ts` (React Query: clientes, marcas, modelos, operadoras, marcas-simcard, débitos abertos, `/aparelhos` para duplicidade) |
| `client/src/pages/aparelhos/cadastro-individual/` | Formulário avulso: `schema.ts` + `constants.ts` (Zod, defaults, `STATUS_CONFIG`, origens), seções de UI, `useCadastroIndividualAparelhoMutation.ts` (POST `/aparelhos/individual`) |
| `client/src/pages/aparelhos/cadastro-lote/` | **Cadastro em lote (refatorado em módulo):** `useCadastroLote.ts` (form + memos + `useMutation` → `buildLotePostBody` + `POST /aparelhos/lote`), `schema.ts` (`loteFormSchema` / `LoteFormValues`), `validate-lote-ids.ts` (`validateLoteIds`), `build-lote-post-body.ts`, `lote-form-errors.ts` (`toastLoteFormValidationErrors`). UI: `CadastroLoteHeader`, `CadastroLoteFooter`, `LoteIdentificacaoSection`, `LotePropriedadeTipoSection`, `LoteSimcardPlanoField` (plano condicional), `LoteIdentificadoresSection`, `LoteValoresSection`, `LoteAbaterDividaSection`, `CadastroLoteResumoPanel` |
| `client/src/pages/aparelhos/CadastroLotePage.tsx` | Rota de entrada em massa — `POST /aparelhos/lote` via `useCadastroLote`; página só orquestra o hook + componentes de `cadastro-lote/` |
| `client/src/__tests__/pages/aparelhos/cadastro-lote/` | Testes do módulo: schema, `validateLoteIds`, `buildLotePostBody`, toasts, `useCadastroLote`, seções, `CadastroLotePage` integrado (APIs mockadas) |
| `client/src/pages/aparelhos/CadastroIndividualPage.tsx` | POST `/aparelhos/individual` — entrada avulsa; orquestra `shared` + seções em `cadastro-individual/` |
| `client/src/pages/equipamentos/EquipamentosPage.tsx` | Lista equipamentos (RASTREADOR com SIM vinculado) + pipeline de status + filtros |
| `client/src/pages/equipamentos/equipamentos-page.shared.ts` | Tipo `EquipamentoListItem`, `EquipamentoPipelineFilter` e função `equipamentoMatchesStageFilter` (regra única para pipeline, filtro de status e contagens) |
| `client/src/pages/equipamentos/PareamentoPage.tsx` | Pareamento IMEI↔ICCID: modos individual, massa e CSV |
| `client/src/pages/equipamentos/EquipamentosConfigPage.tsx` | CRUD de marcas, modelos, operadoras, marcas-simcard e planos-simcard |
| `client/src/pages/equipamentos/PreviewPareamentoTable.tsx` | Componente de preview de associação IMEI↔ICCID (modos individual/massa; reexporta tipos) |
| `client/src/__tests__/pages/PreviewPareamentoTable.test.tsx` | Vitest/RTL: `countPareamentoPreviewDuplicateLinhas` (trim, vazios, IMEI/ICCID repetidos) e valor exibido no card **Duplicados** (`within` sobre o card ancestral do rótulo; `closest` assertado como `HTMLElement` para compatibilidade com os typings do Testing Library) |
| `client/src/pages/equipamentos/PreviewCsvTable.tsx` | Componente de preview exclusivo do modo CSV (ações VINCULAR/CRIAR/ERRO + erros mapeados) |
| `client/src/pages/testes/TestesPage.tsx` | `/aparelhos/para-testes` + PATCH status |
| `client/src/lib/aparelho-status.ts` | Labels/cores por `StatusAparelho` (`STATUS_CONFIG_APARELHO`) |
| `client/src/components/IdAparelhoSearch.tsx` | Busca de IMEI em rastreadores |

A lista principal de aparelhos concentra o data fetching em **`useAparelhosList`**. As telas de **cadastro** (individual e lote) compartilham **`useAparelhoCadastroCatalogs`** e helpers em `aparelhos/shared/`; demais páginas do domínio continuam usando `useQuery` diretamente onde fizer sentido.

**Lista de aparelhos (`AparelhosPage` + módulos) — detalhes:**

- `queryKey: ["aparelhos"]` → `GET /aparelhos`; `queryKey: ["aparelhos", "pareamento", "kits"]` → `GET /aparelhos/pareamento/kits` (pode retornar 404 — ver divergência abaixo). Ambos são disparados no hook `useAparelhosList`.
- `PAGE_SIZE = 15` em `lista/aparelhos-page.shared.ts`; paginação client-side sobre o array já filtrado (`filterAparelhos` + `slicePagina` em `lista/aparelhos-list.helpers.ts`).
- Filtros: `busca` (texto livre sobre `identificador`, `lote.referencia`, `tecnico.nome`), `statusFilter` (`StatusAparelho | "TODOS"`), `tipoFilter` (`"RASTREADOR" | "SIM" | "TODOS"`), `proprietarioFilter` (`"INFINITY" | "CLIENTE" | "TODOS"`), `marcaFilter` (string dinâmico — `marca` para RASTREADOR, `operadora` para SIM). Alterar busca ou qualquer select na toolbar zera a página (`setPage(0)` na página); o card de status usa `handleStatusClick` no hook (filtro + página 0).
- Pipeline de status: componente `AparelhosStatusPipeline` — cards clicáveis TODOS / EM_ESTOQUE / CONFIGURADO / DESPACHADO / COM_TECNICO / INSTALADO com contagem.
- Linha expansível: estado `expandedId` no hook; `AparelhoTableRow` + `AparelhoExpandedDetails` — Dados do Equipamento, Vínculos, Histórico (`HistoricoItem[]`).
- **Kit:** resolução centralizada em `resolveKitNome(aparelho, kitsPorId)` — mesma ideia de fallback (`kit` inline → `kitsPorId` por `kitId` → kit do rastreador vinculado ao SIM).
- **Técnico (regra dupla):** na coluna da tabela, `getTecnicoNomeColunaTabela` usa só `aparelho.tecnico` e `rastreadorVinculado.tecnico` (não trata o nome do cliente como técnico). No painel Vínculos, `getNomeDestaqueVinculosTecnico` prioriza `cliente` do aparelho, depois `tecnico`, depois cliente/técnico do rastreador vinculado — comportamento intencional herdado da implementação anterior.
- Botões de criação condicionais na toolbar: `hasPermission("CONFIGURACAO.APARELHO.CRIAR")` → links para `/aparelhos/lote` e `/aparelhos/individual`.
- Tipo `Aparelho` em `lista/aparelhos-page.shared.ts` (shape com `simVinculado`, `aparelhosVinculados[]`, `ordemServicoVinculada`, `historico[]`) — alinhado ao `GET /aparelhos`.
- Campo `cor` do cliente no backend (`cliente: { select: { id, nome, cor } }`); `findMany`/`findUnique` em `aparelhos.service.ts` expõem `cor`.
- **Badge de proprietário/cliente na tabela:** se `proprietario === "CLIENTE"` e `aparelho.cliente` existe, badge com nome e cor (`backgroundColor: ${cor}22`, etc.); sem `cor`, fallback amber; demais casos usam `PROPRIETARIO_CONFIG`.
- **Cabeçalho da tabela:** a coluna que exibe cliente titular / “Infinity” está rotulada **Cliente** (antes duplicava o rótulo “Proprietário” com a coluna de tipo Infinity/Cliente).
- **Acessibilidade / testes:** `data-testid` em pipeline, toolbar (busca, wrappers dos filtros, links), tabela, linhas `aparelho-row-{id}`, painel `aparelho-expanded-{id}`, rodapé e paginação.

**`CadastroIndividualPage` + `cadastro-individual/` — detalhes:**

- Estrutura: a página orquestra estado e watch do `react-hook-form`; UI fatiada em componentes em `cadastro-individual/*` (identificação, origem, status, abater dívida, resumo, header/footer). Schema e opções de UI vivem em `cadastro-individual/schema.ts` e `constants.ts`. Mutação de criação em `useCadastroIndividualAparelhoMutation.ts`.
- Catálogos e checagem de duplicidade: **`useAparelhoCadastroCatalogs`** em `aparelhos/shared/` — operadora do form é **nome** (`idMode: "nome"`). Helpers: `getModelosDisponiveisPorMarcaNome`, `resolveMarcaModeloIdsPorNome`, `filterDebitosRastreadores` (com par marca/modelo resolvido por nome quando ambos preenchidos e encontrados nas listas).
- Permissão: `CONFIGURACAO.APARELHO.CRIAR` (bloqueia botões de submit).
- Queries (via hook compartilhado): `["clientes-lista"]` → `/clientes`; `["marcas"]` → `/equipamentos/marcas`; `["modelos"]` → `/equipamentos/modelos`; `["operadoras"]` → `/equipamentos/operadoras`; `["marcas-simcard", operadoraId ?? "all"]` → `/equipamentos/marcas-simcard` (query habilitada só quando `tipo=SIM`); `["debitos-rastreadores", "aberto"]` → `/debitos-rastreadores?status=aberto&limit=500` (só quando `tipo=RASTREADOR` — **sem** `incluirHistoricos`; a listagem padrão da API não traz histórico, suficiente para saldo e seleção de abate); `["aparelhos-ids"]` → `/aparelhos` (para checagem de duplicata, `select` em `catalog.helpers` extrai `identificador` + `lote`).
- Validação de identificador: strip de não-dígitos; compara com `minCaracteresImei` (modelo) para RASTREADOR ou `minCaracteresIccid` (marcaSimcard) para SIM. Feedback visual verde/vermelho/amarelo em tempo real.
- Lógica de `origem` muda `statusDisponiveis` e `proprietario`:
  - `COMPRA_AVULSA` → apenas `NOVO_OK`; `notaFiscal` visível.
  - `RETIRADA_CLIENTE` / `DEVOLUCAO_TECNICO` → `EM_MANUTENCAO` ou `CANCELADO_DEFEITO`.
- Status `CANCELADO_DEFEITO` exige `categoriaFalha` (`FALHA_COMUNICACAO | PROBLEMA_ALIMENTACAO | DANO_FISICO | CURTO_CIRCUITO | OUTRO`) e `destinoDefeito` (`SUCATA | GARANTIA | LABORATORIO`).
- SIM card: `proprietario` sempre `INFINITY` (informa ao usuário, não há toggle).
- Abate de dívida (`abaterDivida`): só para RASTREADOR; filtra `debitosFiltrados` pelo `proprietario` selecionado e opcionalmente por marca/modelo; `abaterDebitoId` é enviado no POST.
- Payload enviado a `POST /aparelhos/individual`: `identificador` (clean), `tipo`, `marca`/`modelo` (RASTREADOR) ou `operadora`/`marcaSimcardId`/`planoSimcardId` (SIM), `origem`, `responsavelEntrega` (derivado: nome cliente ou "Infinity" ou NF), `proprietario`, `clienteId`, `notaFiscal`, `observacoes`, `statusEntrada`, `categoriaFalha`, `destinoDefeito`, `abaterDebitoId`.
- Dois botões de submit: "Cadastrar e Finalizar" → navega para `/aparelhos`; "Cadastrar Outro" → limpa só `identificador`, mantém demais campos.

**`CadastroLotePage` + `cadastro-lote/` — detalhes:**

- Estrutura: `CadastroLotePage.tsx` só monta o `<form>` e repassa o retorno de **`useCadastroLote`**. Toda a lógica fica no hook: `react-hook-form` + Zod (`loteFormSchema` em `schema.ts`), catálogos via **`useAparelhoCadastroCatalogs`**, validação de textarea de IDs com **`validateLoteIds`** (`validate-lote-ids.ts` — antes função `validateIds` no arquivo monolítico), corpo do request tipado com **`buildLotePostBody`** (`build-lote-post-body.ts`), erros de submit com **`toastLoteFormValidationErrors`** (`lote-form-errors.ts`). Cada bloco de tela é um componente em `cadastro-lote/*` (ver tabela acima).
- Permissão: `CONFIGURACAO.APARELHO.CRIAR`.
- Catálogos: **`useAparelhoCadastroCatalogs`** com `marcasSimcardQueryEnabled: true` e operadora do form como **id** (`idMode: "id"`). `getModelosDisponiveisPorMarcaId`, `resolveMarcaModeloFiltroLote` e `filterDebitosRastreadores` (marca/modelo do form são ids numéricos em string; filtro de débito compara `marcaId`/`modeloId` diretamente após `Number()`).
- **`aparelhos-ids`:** mesma rota e `select` unificado com o individual (identificador + lote no tipo); o lote deriva `existingIds` com `.map` só dos identificadores.
- **Diferença de payload vs. Individual:** o lote guarda `marca`/`modelo`/`operadora` como **IDs** (string do `Select`); `build-lote-post-body` resolve nomes a partir de `marcasAtivas` / `modelosDisponiveis` / `operadorasAtivas` antes de enviar.
- `valorUnitario` armazenado em **centavos** pelo componente `InputPreco`; payload divide por 100 antes de enviar.
- `definirIds` toggle: se `true`, IDs no textarea; validação via **`validateLoteIds`** (mesma regra: separadores `\n`, `,`, `;`, strip de não-dígitos, tamanho RASTREADOR 15 / SIM 19 com ±1, duplicados no batch, já existentes).
  - Quantidade efetiva = `idValidation.validos.length`; se `definirIds=false`, usa `quantidade` manual.
- `valorTotal` = `(valorUnitario / 100) * quantidadeFinal` — exibido em tempo real no painel (`CadastroLoteResumoPanel`). A nota fiscal no resumo usa **`form.watch("notaFiscal")`** (atualiza ao digitar; não depender de `getValues` no render).
- Abate de dívida inclui `abaterQuantidade` (máx: `min(debito.quantidade, quantidadeFinal)`).
- Payload enviado a `POST /aparelhos/lote`: `referencia`, `notaFiscal`, `dataChegada`, `proprietarioTipo`, `clienteId`, `tipo`, `marca`/`modelo` (nomes resolvidos), `operadora` (nome resolvido), `marcaSimcardId`, `planoSimcardId`, `quantidade`, `valorUnitario` (dividido por 100), `identificadores` (array — vazio se `definirIds=false`), `abaterDebitoId`, `abaterQuantidade`.

**`EquipamentosPage.tsx` — detalhes:**

- `queryKey: ["aparelhos"]` → `GET /aparelhos`; `queryKey: ["aparelhos", "pareamento", "kits"]` → `GET /aparelhos/pareamento/kits` (pode retornar 404 — ver divergência abaixo).
- `PAGE_SIZE = 12`; paginação client-side. Equipamentos = apenas aparelhos com `tipo === "RASTREADOR"` e `simVinculado != null`.
- Pipeline no topo (cards clicáveis): **Total / Configurados / Em Kit / Despachados / Com Técnico / Instalados**. Cada card filtra `pipelineFilter` + `statusFilter` em sincronia.
  - "Em Kit": `status === "CONFIGURADO"` **e** `kitId != null` — distinto de "Configurado" que exige `kitId === null`.
- **Regra de estágio centralizada:** `equipamentoMatchesStageFilter` em `equipamentos-page.shared.ts` — usada para contagens do pipeline, para o `useMemo` de linhas filtradas (`matchPipeline` / `matchStatus`) e evita duplicar a mesma lógica entre card e select.
- Filtros adicionais: `busca` (IMEI, ICCID, nome do técnico, kitId string, lote.referencia), `statusFilter`, `proprietarioFilter` (`INFINITY | CLIENTE | TODOS`), `marcaFilter` (marca do rastreador), `operadoraFilter` (operadora do SIM vinculado).
- `pipelineFilter` e `statusFilter` são mantidos em sincronia: clicar no card muda ambos; mudar o select de Status muda ambos também.
- Linha expansível (`expandedId`): cabeçalho com status badge + IMEI + kit + técnico + proprietário; grid 2 colunas — **Equipamento** (IMEI, Modelo, ICCID, Operadora, Lote) | **Operação** (Técnico, Proprietário, Kit, Transporte, Ordem de Instalação, Subcliente/Placa); **Histórico** em largura total (timeline flat horizontal).
- Status "Em Kit" exibido com badge roxo (`bg-purple-50 text-purple-700`) na linha e detalhe — o enum Prisma permanece `CONFIGURADO` (sem valor "EM_KIT").
- `kitsPorId`: `Map<number, string>` construído a partir do query de kits — fallback para `aparelho.kit?.nome` quando dados inline estão disponíveis.
- Permissão `CONFIGURACAO.APARELHO.CRIAR` controla botões "Montar Equipamento" (`/equipamentos/pareamento`) e "Cadastro em Lote" (`/equipamentos/pareamento?modo=massa`).
- Tipo da listagem: `EquipamentoListItem` exportado de `equipamentos-page.shared.ts` (campos usados na tabela: `simVinculado` com `marcaSimcard`/`planoSimcard`/`lote`, `kit`, `tecnico`, `lote`, `ordemServicoVinculada`, `historico[]`, etc.).

**`PareamentoPage.tsx` — detalhes:**

- Três modos controlados por `?modo=individual|massa|csv` (searchParam); fallback para `"individual"`.
- **Modo individual:** um par IMEI + ICCID; checkboxes `pertenceLoteRastreador` / `pertenceLoteSim` determinam se o aparelho será buscado num lote existente (sem criar novo) ou criado informando marca/modelo/operadora/marcaSimcard/plano. Proprietário `INFINITY | CLIENTE`; se `CLIENTE`, exibe `SelectClienteSearch`. Payload para `POST /aparelhos/pareamento`: `{ imei, iccid, loteRastreadorId?, marcaRastreador?, modeloRastreador?, criarNovoRastreador, loteSímId?, operadoraSim?, marcaSimcardId?, planoSimcardId?, criarNovoSim, proprietario, clienteId? }`.
- **Modo massa:** textareas separadas para IMEIs e ICCIDs (separados por vírgula, ponto-e-vírgula ou quebra de linha); `parseIds` normaliza strip de espaços e zero-width chars. Preview disparado via `POST /aparelhos/pareamento/preview` com array de pares `{ imei, iccid }[]`. Botão "Confirmar Pareamento" envia `POST /aparelhos/pareamento` com os mesmos pares + configuração de lote/metadados (lote/manual aplicam-se a **todas** as linhas `NEEDS_CREATE`).
- **Modo CSV (funcional):**
  - Upload `<input type="file" data-testid="csv-file-input" accept=".csv">`; parse com `papaparse` (`header: true`, `skipEmptyLines`, `transformHeader` via `normalizarCabecalho` — lowercase + strip de espaços/aspas).
  - Cabeçalhos aceitos (`CSV_HEADER_ALIASES`): `marca_rastreador` (aliases `marcarastreador`, `marca(rastreador)`), `modelo` / `modelo_rastreador`, `imei`, `operadora`, `marca_simcard` (aliases `marcasimcard`, `marca(simcard)`), `plano`, `iccid`, `lote_rastreador` (+ aliases), `lote_simcard` / `lote_sim` / `lote(simcard)`. Linhas com ambos `imei` e `iccid` vazios são descartadas.
  - Botão "Baixar modelo" gera arquivo `template-pareamento.csv` (separador `;`, BOM UTF-8) com 2 exemplos — um manual e um via lotes (`LOTE-RAST-001`/`LOTE-SIM-001`).
  - Estado no componente: `csvFileName`, `csvLinhas: CsvLinhaInput[]`, `csvParseErro`, `csvPreview: CsvPreviewResult | null`, `proprietarioCsv`, `clienteIdCsv`, `csvFileInputRef`. `limparCsv` reseta tudo e o `<input>` real.
  - `csvPreviewMutation` → `POST /aparelhos/pareamento/csv/preview` com `{ linhas, proprietario, clienteId }`. Botão **"Validar CSV"** desabilitado enquanto `csvLinhas.length === 0`.
  - `csvImportarMutation` → `POST /aparelhos/pareamento/csv` (mesmo payload); no sucesso invalida `["aparelhos"]`, `["lotes-rastreadores"]`, `["lotes-sims"]` e chama `limparCsv()`. Botão **"Confirmar Importação"** habilitado apenas se `csvLinhas.length > 0 && csvPreview !== null && !csvTemErros && (proprietarioCsv === "INFINITY" || clienteIdCsv !== null)`.
  - Queries de marcas/modelos/operadoras/marcas-simcard são **não** usadas no modo CSV (resolução é backend).
- Queries disparadas (habilitadas por modo): `["lotes-rastreadores"]` → `GET /aparelhos/pareamento/lotes-rastreadores` (individual/massa); `["lotes-sims"]` → `GET /aparelhos/pareamento/lotes-sims` (individual/massa); `["marcas"]`, `["modelos"]`, `["operadoras"]`, `["marcas-simcard"]` (individual/massa); `["clientes-lista"]` → `GET /clientes` quando qualquer proprietário (individual/massa/csv) for `CLIENTE`.
- `modelosPorMarca` / `marcasSimcardPorOperadora`: derivados de marca/operadora selecionada — filtra por `id` do objeto ativo (apenas individual/massa).
- Validação IMEI/ICCID em tempo real (individual/massa): `minImeiIndividual` lido de `modelo.minCaracteresImei`; `minIccidIndividual` lido de `marcaSimcard.minCaracteresIccid`; ambos ignorados se o campo pertence a lote.
- Quantidade criada (`quantidadeCriada`) incrementada após sucesso no individual para feedback visual.

**`PreviewCsvTable.tsx` — detalhes:**

Componente puro que recebe `preview: CsvPreviewResult` e renderiza:

- 4 cards de contagem em grid responsivo: **Válidos**, **Com aviso** (`preview.contadores.comAviso`), **Total de linhas** e **Erros** (não há "Exigem Lote" no resumo — o backend resolve ações por linha).
- Tabela com colunas `#`, `IMEI`, `ICCID`, `Rastreador`, `SIM`, `Erros`. Células Rastreador/SIM mostram badge da `tracker_acao`/`sim_acao` (`VINCULAR_EXISTENTE` verde, `CRIAR_VIA_LOTE` azul, `CRIAR_MANUAL` indigo, `ERRO` vermelho) + detalhe em texto (`marca / modelo`, `Lote <ref>`, operadora).
- Linhas com `erros.length > 0` recebem `bg-red-50/50`.
- `ERROS_LABELS`: traduz códigos do backend (`IMEI_INVALIDO`, `ICCID_INVALIDO`, `IMEI_JA_VINCULADO`, `ICCID_JA_VINCULADO`, `FALTA_DADOS_RASTREADOR`, `FALTA_DADOS_SIM`, `LOTE_RASTREADOR_NAO_ENCONTRADO`, `LOTE_SIMCARD_NAO_ENCONTRADO`, `MARCA_SIMCARD_NAO_ENCONTRADA`, `PLANO_SIMCARD_NAO_ENCONTRADO`) para mensagens em português. Códigos desconhecidos caem no fallback `e => e`.
- Tipos exportados: `CsvPreviewLinha`, `CsvPreviewResult` (usados em `PareamentoPage.tsx`).

**`PreviewPareamentoTable.tsx` — detalhes:**

Componente puro (sem queries) que recebe `preview: PreviewResult` e renderiza resumo + tabela.

- Tipos exportados: `PreviewLinha`, `PreviewResult`, `TRACKER_STATUS_LABELS`, `ACTION_LABELS`.
- Função exportada `countPareamentoPreviewDuplicateLinhas(linhas)`: conta quantas linhas do preview têm **IMEI** ou **ICCID** não vazio repetido dentro do mesmo lote (normalização com `trim`; duas linhas com o mesmo IMEI contam ambas).
- `TrackerStatus`: `FOUND_AVAILABLE` | `FOUND_ALREADY_LINKED` | `NEEDS_CREATE` | `INVALID_FORMAT`.
- `ActionNeeded`: `OK` | `SELECT_TRACKER_LOT` | `SELECT_SIM_LOT` | `FIX_ERROR`.
- Cards de contagem: Válidos, Exigem Lote, **Duplicados** (valor = `countPareamentoPreviewDuplicateLinhas(preview.linhas)`), Erros.
- Cobertura de testes: `client/src/__tests__/pages/PreviewPareamentoTable.test.tsx` (função pura + asserções no card Duplicados após `render`).

**`EquipamentosConfigPage.tsx` — detalhes:**

- Rota: `/equipamentos/configuracoes`; link de volta para `/equipamentos`. Permissão `CONFIGURACAO.APARELHO.EDITAR` (`canEdit`) controla **de forma uniforme**: botões **Nova Marca** e ações em dropdown na coluna de **Marcas e Modelos de Rastreador**; botão **Nova Operadora**, coluna de menu (⚙) nas linhas de operadora; botão **Nova Marca** (simcard), menu ⚙ de cada marca simcard, botões **Adicionar Plano** e menus de edição/exclusão de plano. Sem `EDITAR`, essas ações somem; listagem e busca permanecem.
- Queries: `["marcas"]` → `GET /equipamentos/marcas`; `["modelos"]` → `GET /equipamentos/modelos`; `["operadoras"]` → `GET /equipamentos/operadoras`; `["marcas-simcard"]` → `GET /equipamentos/marcas-simcard`.
- **Seção Marcas e Modelos (col-7):** lista acordeão — clicar na marca expande modelos. Filtro de busca debounce 300 ms que filtra por nome da marca **ou** nome de qualquer modelo da marca. Modelo deletável sem confirmação; marca deletável apenas se `_count.modelos === 0`. Desativar marca não remove modelos.
- **Seção Operadoras (col-5):** tabela simples; ativar/desativar via toggle (PATCH `{ ativo }`); excluir sem restrição (backend pode bloquear).
- **Seção Marcas Simcard (full-width col-12):** acordeão similar; cada marca tem `temPlanos: boolean`. Se `temPlanos=false`, a expansão mostra aviso; se `temPlanos=true`, lista planos ativos (`plano.ativo`). Planos excluídos via DELETE (backend faz `ativo=false`, não exclui hard).
- **Modals:** padrão `Dialog` com `hideClose` — 5 modais em estado local: Marca, Modelo, Operadora, MarcaSimcard, PlanoSimcard. Todos usam `onOpenChange={(o) => !o && closeFn()}` para fechar com Esc/overlay.
- Campo `minCaracteresImei` (Modelo) e `minCaracteresIccid` (MarcaSimcard) são opcionais; enviados apenas se preenchidos.

