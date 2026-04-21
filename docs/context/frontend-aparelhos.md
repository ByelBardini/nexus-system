# Context — Nexus System

Ver índice em `AGENTS.md`. Páginas de aparelhos/equipamentos (detalhe de UI).

**Frontend — páginas do domínio:**

| Arquivo | Função |
|---------|--------|
| `client/src/pages/aparelhos/AparelhosPage.tsx` | Lista paginada com filtros e expansão de linha |
| `client/src/pages/aparelhos/CadastroLotePage.tsx` | POST `/aparelhos/lote` — entrada em massa |
| `client/src/pages/aparelhos/CadastroIndividualPage.tsx` | POST `/aparelhos/individual` — entrada avulsa |
| `client/src/pages/equipamentos/EquipamentosPage.tsx` | Lista equipamentos (RASTREADOR com SIM vinculado) + pipeline de status + filtros |
| `client/src/pages/equipamentos/PareamentoPage.tsx` | Pareamento IMEI↔ICCID: modos individual, massa e CSV |
| `client/src/pages/equipamentos/EquipamentosConfigPage.tsx` | CRUD de marcas, modelos, operadoras, marcas-simcard e planos-simcard |
| `client/src/pages/equipamentos/PreviewPareamentoTable.tsx` | Componente de preview de associação IMEI↔ICCID (modos individual/massa; reexporta tipos) |
| `client/src/pages/equipamentos/PreviewCsvTable.tsx` | Componente de preview exclusivo do modo CSV (ações VINCULAR/CRIAR/ERRO + erros mapeados) |
| `client/src/pages/testes/TestesPage.tsx` | `/aparelhos/para-testes` + PATCH status |
| `client/src/lib/aparelho-status.ts` | Labels/cores por `StatusAparelho` (`STATUS_CONFIG_APARELHO`) |
| `client/src/components/IdAparelhoSearch.tsx` | Busca de IMEI em rastreadores |

Sem hook dedicado `useAparelhos`; páginas usam `useQuery` do TanStack Query diretamente.

**`AparelhosPage.tsx` — detalhes:**

- `queryKey: ["aparelhos"]` → `GET /aparelhos`; `queryKey: ["aparelhos", "pareamento", "kits"]` → `GET /aparelhos/pareamento/kits` (pode retornar 404 — ver divergência abaixo).
- `PAGE_SIZE = 15`; paginação client-side sobre array filtrado.
- Filtros: `busca` (texto livre sobre `identificador`, `lote.referencia`, `tecnico.nome`), `statusFilter` (`StatusAparelho | "TODOS"`), `tipoFilter` (`"RASTREADOR" | "SIM" | "TODOS"`), `proprietarioFilter` (`"INFINITY" | "CLIENTE" | "TODOS"`), `marcaFilter` (string dinâmico — `marca` para RASTREADOR, `operadora` para SIM).
- Pipeline de status no topo: cards clicáveis para TODOS / EM_ESTOQUE / CONFIGURADO / DESPACHADO / COM_TECNICO / INSTALADO com contagem.
- Linha expansível (`expandedId`): mostra 3 colunas — Dados do Equipamento (IMEI/ICCID, marca/modelo ou operadora/plano, proprietário, valor unitário, lote), Vínculos (SIM/rastreador vinculado, kit, técnico, OS, subcliente, placa), Histórico (`HistoricoItem[]`).
- Kit resolvido com fallback: `aparelho.kit?.nome ?? kitsPorId.get(aparelho.kitId) ?? rastreador?.kit?.nome ?? kitsPorId.get(rastreador?.kitId)` — precisa do map de kits para SIM sem kit direto.
- Botões de criação condicionais: `hasPermission("CONFIGURACAO.APARELHO.CRIAR")` → links para `/aparelhos/lote` e `/aparelhos/individual`.
- Tipo local `Aparelho` define shape completo incluindo `simVinculado`, `aparelhosVinculados[]`, `ordemServicoVinculada`, `historico[]` — verificar se backend inclui esses campos no `GET /aparelhos`.
- Campo `cor` do cliente incluído no select do backend (`cliente: { select: { id, nome, cor } }`); todos os blocos `findMany`/`findUnique` de `aparelhos.service.ts` já retornam `cor`.
- **Badge de proprietário/cliente na tabela:** se `proprietario === "CLIENTE"` e `aparelho.cliente` existe, exibe badge com o nome do cliente usando a cor personalizada do cliente (`cor`): `backgroundColor: ${cor}22`, `color: cor`, `borderColor: ${cor}55`. Se o cliente não tem `cor`, usa fallback amber. Para outros proprietários, exibe badge estático via `propConfig.className`.

**`CadastroIndividualPage.tsx` — detalhes:**

- Permissão: `CONFIGURACAO.APARELHO.CRIAR` (bloqueia botões de submit).
- Queries disparadas: `["clientes-lista"]` → `/clientes`; `["marcas"]` → `/equipamentos/marcas`; `["modelos"]` → `/equipamentos/modelos`; `["operadoras"]` → `/equipamentos/operadoras`; `["marcas-simcard", operadoraIdParaMarca]` → `/equipamentos/marcas-simcard?operadoraId=N` (só quando `tipo=SIM`); `["debitos-rastreadores", "aberto"]` → `/debitos-rastreadores?status=aberto&limit=500` (só quando `tipo=RASTREADOR`); `["aparelhos-ids"]` → `/aparelhos` (para checagem de duplicata, `select` extrai só `identificador`).
- Validação de identificador: strip de não-dígitos; compara com `minCaracteresImei` (modelo) para RASTREADOR ou `minCaracteresIccid` (marcaSimcard) para SIM. Feedback visual verde/vermelho/amarelo em tempo real.
- Lógica de `origem` muda `statusDisponiveis` e `proprietario`:
  - `COMPRA_AVULSA` → apenas `NOVO_OK`; `notaFiscal` visível.
  - `RETIRADA_CLIENTE` / `DEVOLUCAO_TECNICO` → `EM_MANUTENCAO` ou `CANCELADO_DEFEITO`.
- Status `CANCELADO_DEFEITO` exige `categoriaFalha` (`FALHA_COMUNICACAO | PROBLEMA_ALIMENTACAO | DANO_FISICO | CURTO_CIRCUITO | OUTRO`) e `destinoDefeito` (`SUCATA | GARANTIA | LABORATORIO`).
- SIM card: `proprietario` sempre `INFINITY` (informa ao usuário, não há toggle).
- Abate de dívida (`abaterDivida`): só para RASTREADOR; filtra `debitosFiltrados` pelo `proprietario` selecionado e opcionalmente por marca/modelo; `abaterDebitoId` é enviado no POST.
- Payload enviado a `POST /aparelhos/individual`: `identificador` (clean), `tipo`, `marca`/`modelo` (RASTREADOR) ou `operadora`/`marcaSimcardId`/`planoSimcardId` (SIM), `origem`, `responsavelEntrega` (derivado: nome cliente ou "Infinity" ou NF), `proprietario`, `clienteId`, `notaFiscal`, `observacoes`, `statusEntrada`, `categoriaFalha`, `destinoDefeito`, `abaterDebitoId`.
- Dois botões de submit: "Cadastrar e Finalizar" → navega para `/aparelhos`; "Cadastrar Outro" → limpa só `identificador`, mantém demais campos.

**`CadastroLotePage.tsx` — detalhes:**

- Permissão: `CONFIGURACAO.APARELHO.CRIAR`.
- Queries: mesmas do Individual exceto `aparelhos-ids` usa `select` diferente (só `identificador`).
- **Diferença de payload vs. Individual:** LotePage guarda `marca`/`modelo`/`operadora` como IDs numéricos (string do `Select`); payload resolve names via `marcasAtivas.find(m => m.id === Number(data.marca))?.nome` antes de enviar ao backend.
- `valorUnitario` armazenado em **centavos** pelo componente `InputPreco`; payload divide por 100 antes de enviar.
- `definirIds` toggle: se `true`, IDs são colados em textarea; validação via `validateIds()`:
  - Separa por `\n`, `,` ou `;`; strip de não-dígitos.
  - Tamanho esperado: RASTREADOR = 15 dígitos, SIM = 19 dígitos (±1 tolerado).
  - Classifica em: `validos`, `duplicados` (dentro do batch), `invalidos` (tamanho errado), `jaExistentes` (já no sistema).
  - Quantidade efetiva = `idValidation.validos.length`; se `definirIds=false`, usa `quantidade` manual.
- `valorTotal` = `(valorUnitario / 100) * quantidadeFinal` — exibido em tempo real no painel lateral.
- Abate de dívida inclui `abaterQuantidade` (máx: `min(debito.quantidade, quantidadeFinal)`).
- Payload enviado a `POST /aparelhos/lote`: `referencia`, `notaFiscal`, `dataChegada`, `proprietarioTipo`, `clienteId`, `tipo`, `marca`/`modelo` (nomes resolvidos), `operadora` (nome resolvido), `marcaSimcardId`, `planoSimcardId`, `quantidade`, `valorUnitario` (dividido por 100), `identificadores` (array — vazio se `definirIds=false`), `abaterDebitoId`, `abaterQuantidade`.

**`EquipamentosPage.tsx` — detalhes:**

- `queryKey: ["aparelhos"]` → `GET /aparelhos`; `queryKey: ["aparelhos", "pareamento", "kits"]` → `GET /aparelhos/pareamento/kits` (pode retornar 404 — ver divergência abaixo).
- `PAGE_SIZE = 12`; paginação client-side. Equipamentos = apenas aparelhos com `tipo === "RASTREADOR"` e `simVinculado != null`.
- Pipeline no topo (cards clicáveis): **Total / Configurados / Em Kit / Despachados / Com Técnico / Instalados**. Cada card filtra `pipelineFilter` + `statusFilter` em sincronia.
  - "Em Kit": `status === "CONFIGURADO"` **e** `kitId != null` — distinto de "Configurado" que exige `kitId === null`.
- Filtros adicionais: `busca` (IMEI, ICCID, nome do técnico, kitId string, lote.referencia), `statusFilter`, `proprietarioFilter` (`INFINITY | CLIENTE | TODOS`), `marcaFilter` (marca do rastreador), `operadoraFilter` (operadora do SIM vinculado).
- `pipelineFilter` e `statusFilter` são mantidos em sincronia: clicar no card muda ambos; mudar o select de Status muda ambos também.
- Linha expansível (`expandedId`): cabeçalho com status badge + IMEI + kit + técnico + proprietário; grid 2 colunas — **Equipamento** (IMEI, Modelo, ICCID, Operadora, Lote) | **Operação** (Técnico, Proprietário, Kit, Transporte, Ordem de Instalação, Subcliente/Placa); **Histórico** em largura total (timeline flat horizontal).
- Status "Em Kit" exibido com badge roxo (`bg-purple-50 text-purple-700`) na linha e detalhe — o enum Prisma permanece `CONFIGURADO` (sem valor "EM_KIT").
- `kitsPorId`: `Map<number, string>` construído a partir do query de kits — fallback para `aparelho.kit?.nome` quando dados inline estão disponíveis.
- Permissão `CONFIGURACAO.APARELHO.CRIAR` controla botões "Montar Equipamento" (`/equipamentos/pareamento`) e "Cadastro em Lote" (`/equipamentos/pareamento?modo=massa`).
- Tipo local `Aparelho` inclui `simVinculado` (com `marcaSimcard`, `planoSimcard`, `lote`), `kit`, `tecnico`, `lote`, `ordemServicoVinculada`, `historico[]`.

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

- 3 cards de contagem: **Válidos**, **Total de linhas** e **Erros** (não há "Exigem Lote" — o backend resolve tudo por linha).
- Tabela com colunas `#`, `IMEI`, `ICCID`, `Rastreador`, `SIM`, `Erros`. Células Rastreador/SIM mostram badge da `tracker_acao`/`sim_acao` (`VINCULAR_EXISTENTE` verde, `CRIAR_VIA_LOTE` azul, `CRIAR_MANUAL` indigo, `ERRO` vermelho) + detalhe em texto (`marca / modelo`, `Lote <ref>`, operadora).
- Linhas com `erros.length > 0` recebem `bg-red-50/50`.
- `ERROS_LABELS`: traduz códigos do backend (`IMEI_INVALIDO`, `ICCID_INVALIDO`, `IMEI_JA_VINCULADO`, `ICCID_JA_VINCULADO`, `FALTA_DADOS_RASTREADOR`, `FALTA_DADOS_SIM`, `LOTE_RASTREADOR_NAO_ENCONTRADO`, `LOTE_SIMCARD_NAO_ENCONTRADO`, `MARCA_SIMCARD_NAO_ENCONTRADA`, `PLANO_SIMCARD_NAO_ENCONTRADO`) para mensagens em português. Códigos desconhecidos caem no fallback `e => e`.
- Tipos exportados: `CsvPreviewLinha`, `CsvPreviewResult` (usados em `PareamentoPage.tsx`).

**`PreviewPareamentoTable.tsx` — detalhes:**

Componente puro (sem queries) que recebe `preview: PreviewResult` e renderiza resumo + tabela.

- Tipos exportados: `PreviewLinha`, `PreviewResult`, `TRACKER_STATUS_LABELS`, `ACTION_LABELS`.
- `TrackerStatus`: `FOUND_AVAILABLE` | `FOUND_ALREADY_LINKED` | `NEEDS_CREATE` | `INVALID_FORMAT`.
- `ActionNeeded`: `OK` | `SELECT_TRACKER_LOT` | `SELECT_SIM_LOT` | `FIX_ERROR`.
- Cards de contagem: Válidos, Exigem Lote, Duplicados (fixo 0 — campo não preenchido pelo backend atual), Erros.

**`EquipamentosConfigPage.tsx` — detalhes:**

- Rota: `/equipamentos/configuracoes`; link de volta para `/equipamentos`. Permissão `CONFIGURACAO.APARELHO.EDITAR` controla todos os botões de criação/edição.
- Queries: `["marcas"]` → `GET /equipamentos/marcas`; `["modelos"]` → `GET /equipamentos/modelos`; `["operadoras"]` → `GET /equipamentos/operadoras`; `["marcas-simcard"]` → `GET /equipamentos/marcas-simcard`.
- **Seção Marcas e Modelos (col-7):** lista acordeão — clicar na marca expande modelos. Filtro de busca debounce 300 ms que filtra por nome da marca **ou** nome de qualquer modelo da marca. Modelo deletável sem confirmação; marca deletável apenas se `_count.modelos === 0`. Desativar marca não remove modelos.
- **Seção Operadoras (col-5):** tabela simples; ativar/desativar via toggle (PATCH `{ ativo }`); excluir sem restrição (backend pode bloquear).
- **Seção Marcas Simcard (full-width col-12):** acordeão similar; cada marca tem `temPlanos: boolean`. Se `temPlanos=false`, a expansão mostra aviso; se `temPlanos=true`, lista planos ativos (`plano.ativo`). Planos excluídos via DELETE (backend faz `ativo=false`, não exclui hard).
- **Modals:** padrão `Dialog` com `hideClose` — 5 modais em estado local: Marca, Modelo, Operadora, MarcaSimcard, PlanoSimcard. Todos usam `onOpenChange={(o) => !o && closeFn()}` para fechar com Esc/overlay.
- Campo `minCaracteresImei` (Modelo) e `minCaracteresIccid` (MarcaSimcard) são opcionais; enviados apenas se preenchidos.

