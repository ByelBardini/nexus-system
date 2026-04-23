# Context — Nexus System

Ver índice em `AGENTS.md`.

### Página: `TestesPage` — Bancada de Testes (`client/src/pages/testes/`)

**Rota:** `/testes` (sidebar → seção Agendamento → "Bancada de Testes")  
**Permissões necessárias:** `AGENDAMENTO.TESTES.LISTAR` + `AGENDAMENTO.OS.LISTAR` (herdadas do backend — a página em si não faz guard client-side explícito).

#### Estrutura de arquivos

Na pasta `client/src/pages/testes/`, **só** o ponto de entrada da rota fica na raiz; o restante em subpastas.

| Caminho | Responsabilidade |
|---------|------------------|
| **`TestesPage.tsx`** (raiz) | Orquestração mínima: chama `useTestesBancadaController()` e renderiza `TesteBancada`, `TesteFilaSidebar`, modais |
| **`hooks/useTestesBancadaController.ts`** | Estado local, efeitos (seleção, sincronização IMEI, auto-vínculo), handlers que usam as mutations |
| **`hooks/useTestesQueries.ts`** | `useQuery` da fila `GET /ordens-servico/testando` e de `GET /aparelhos/para-testes` |
| **`hooks/useTestesMutations.ts`** | Mutations de status da OS, vínculo de aparelho e PATCH de status do aparelho + invalidação + `toast` |
| **`lib/testes-types.ts`** | Tipos: `OsTeste`, `RastreadorParaTeste`, `ComunicacaoResult` |
| **`lib/testes-utils.ts`** | `imeiVinculadoNaBancadaTestes`, `subclienteLabel`, `filtrarOsTesteNaFila` (filtro da sidebar) |
| **`lib/rastreador-format.ts`** | Texto de busca / resumo de rastreador (`rastreadorTextoBusca`, `formatRastreadorOperadoraMarcaIccidPlano`, `findRastreadorPorIdentificador`, etc.) — usado por `SelectRastreadorTeste` e `TesteEquipamentoSection` |
| **`components/TesteBancada.tsx`** | Área principal (flex-1 à esquerda); recebe props; compõe as seções |
| **`components/TesteFilaSidebar.tsx`** | Sidebar direita (w-80); `filtrarOsTesteNaFila` + renderiza `TesteFilaCard` por item |
| **`components/TesteFilaCard.tsx`** | Card na fila; usa `subclienteLabel` |
| **`components/SelectRastreadorTeste.tsx`** | Dropdown em portal para IMEI/ICCID/serial |
| **`components/TesteSectionShell.tsx`** | Cabeçalho reutilizável (ícone + título + slot direito) das seções em cartão |
| **`components/RetiradaRealizadaDialog.tsx`** | Modal “Retirada realizada” (Sim/Não) |
| **`components/CancelarOperacaoTesteDialog.tsx`** | Modal “Cancelar operação” (Voltar / Reagendar / Cancelar OS) |
| **`sections/TesteOsDataSection.tsx`** | Seção "01. Dados da Ordem de Serviço" |
| **`sections/TesteEquipamentoSection.tsx`** | Seção "02. Identificação do Equipamento" (`SelectRastreadorTeste` + resumo via `rastreador-format`) |
| **`sections/TesteComunicacaoSection.tsx`** | Seção "03. Validação de Comunicação GPRS/GPS" |
| **`sections/TesteRetiradaSection.tsx`** | Seção "02. Dados da Retirada" (quando `tipo=RETIRADA`) |
| **`sections/TesteObservacoesSection.tsx`** | Seção "Observações Adicionais" (textarea) |

**Imports:** no mesmo módulo, caminhos relativos (`../lib/…`, `./sections/…`) são usados à vontade; para alguns pares de componentes irmãos em `components/`, o alias `@/` do `tsconfig` é preferível (ex.: `TesteFilaSidebar` importa `TesteFilaCard` de `@/pages/testes/components/TesteFilaCard`) para evitar **TS2307** / resolução instável no IDE com `./OutroComponente` entre ficheiros `.tsx`.

**Testes (Vitest + RTL):** `client/src/__tests__/pages/testes/` — libs, hooks, componentes, fluxo da página (`TestesPage.e2e.test.tsx` com API mockada).

#### Tipos principais (`lib/testes-types.ts`)

```ts
type ComunicacaoResult = "COMUNICANDO" | "AGUARDANDO" | "NAO_COMUNICOU";

interface OsTeste {
  id, numero, tipo, status, clienteId, subclienteId, veiculoId, tecnicoId,
  idAparelho: string | null,  // IMEI do aparelho atual (ou de saída em REVISAO)
  idEntrada: string | null,   // Em REVISAO: IMEI do aparelho novo escolhido na bancada
  cliente, subcliente, veiculo, tecnico, subclienteSnapshotNome?,
  tempoEmTestesMin: number    // calculado pelo backend
}

interface RastreadorParaTeste {
  id, identificador, proprietario ("INFINITY"|"CLIENTE"), marca, modelo,
  status, operadora, criadoEm, cliente, tecnico,
  marcaSimcard: { id, nome, operadora? } | null,
  planoSimcard?: { id, planoMb } | null,
  simVinculado?: { id, identificador, operadora?, marcaSimcard?, planoSimcard? } | null
}
```

#### Layout

`-m-4 flex flex-1 min-h-0 overflow-hidden` — ocupa toda a área de conteúdo sem margens.
- **Esquerda:** `TesteBancada` (flex-1, overflow-y-auto com padding)
- **Direita:** `TesteFilaSidebar` (w-80, shrink-0, fixed height)

#### Estado (em `useTestesBancadaController`)

| Estado | Tipo | Valor inicial | Notas |
|--------|------|--------------|-------|
| `selectedOsId` | `number \| null` | `?osId` URL param ou null | |
| `search` | `string` | `""` | Filtro da sidebar |
| `imeiSearch` | `string` | `""` | Campo IMEI na bancada; sincronizado ao mudar OS |
| `comunicacaoResult` | `ComunicacaoResult \| null` | `"AGUARDANDO"` | Resetado ao finalizar/trocar |
| `novoLocalInstalacao` | `string` | `""` | Obrigatório para finalizar |
| `posChave` | `"SIM" \| "NAO"` | `"NAO"` | Toggle na seção de comunicação |
| `observacoes` | `string` | `""` | Enviado como prefixo de obs no PATCH status |
| `showCancelarModal` | `boolean` | `false` | Modal: Reagendar ou Cancelar OS |
| `showRetiradaModal` | `boolean` | `false` | Modal: confirmar se aparelho foi encontrado |
| `pendingLinkRef` | `ref<{osId, imei} \| null>` | `null` | Evita chamadas duplicadas de vincular |

#### Queries e mutations

| Símbolo | QueryKey / Endpoint | Notas |
|---------|---------------------|-------|
| `listaTestando` | `["ordens-servico", "testando", search]` → `GET /ordens-servico/testando?search=...` | `staleTime: 0`, `refetchOnMount: "always"` |
| `rastreadores` | `["aparelhos", "para-testes", clienteId, tecnicoId, osId]` → `GET /aparelhos/para-testes?clienteId=N&tecnicoId=N&ordemServicoId=N` | Desabilitado quando OS é `RETIRADA` |
| `updateStatusOsMutation` | `PATCH /ordens-servico/:id/status` | Invalida `["ordens-servico"]`; body: `{ status, observacao?, localInstalacao?, posChave? }` |
| `vincularAparelhoMutation` | `PATCH /ordens-servico/:id/aparelho` | Invalida `["ordens-servico"]` e `["aparelhos", "para-testes"]`; body: `{ idAparelho }` |
| `updateStatusAparelhoMutation` | `PATCH /aparelhos/:id/status` | Invalida `["aparelhos"]` e `["aparelhos", "para-testes"]`; body: `{ status, observacao }` |

#### Lógica de auto-vínculo (efeito com `pendingLinkRef`)

Quando `imeiSearch` muda e encontra match exato (case-insensitive) em `rastreadores`, chama `vincularAparelhoMutation` automaticamente — sem precisar o usuário clicar em confirmar. `pendingLinkRef` guarda `{ osId, imei }` para evitar chamada repetida enquanto o servidor não confirma.

Helper **`imeiVinculadoNaBancadaTestes(os)`** (`lib/testes-utils.ts`): retorna `os.idEntrada` para tipo `REVISAO`, `os.idAparelho` para os demais (inclui `RETIRADA`).

#### Condição `canFinalizar`

```ts
canFinalizar =
  !!imeiVinculadoNaBancadaTestes(selectedOs) &&
  comunicacaoResult === "COMUNICANDO" &&
  !!novoLocalInstalacao.trim()
```

#### Comportamentos por tipo de OS

| Comportamento | INSTALACAO / REVISAO | RETIRADA |
|---------------|----------------------|----------|
| Seção Equipamento | `TesteEquipamentoSection` (SelectRastreadorTeste) | `TesteRetiradaSection` (só exibe `idAparelho`) |
| Botão principal | "Finalizar Teste & Liberar OS" | "Retirada Realizada" |
| Transição de status ao finalizar | `TESTES_REALIZADOS` | `AGUARDANDO_CADASTRO` (abre modal de confirmação) |
| `localInstalacao` obrigatório | Sim | Não |
| Query de rastreadores | Habilitada | Desabilitada (`enabled: false`) |

#### Fluxos especiais

**NAO_COMUNICOU:** ao selecionar essa opção com aparelho vinculado, o `updateStatusAparelhoMutation` grava observação no aparelho (`"OS #N - Não comunicou em teste | ...obs"`), `vincularAparelhoMutation` limpa o vínculo (`idAparelho: ""`), `imeiSearch` e `comunicacaoResult` são resetados — forçando seleção de outro equipamento.

**Retirada:** botão "Retirada Realizada" → `showRetiradaModal = true` → modal pergunta "Aparelho foi encontrado?". Ao confirmar (`true` ou `false`), chama `updateStatusOsMutation` com `status: "AGUARDANDO_CADASTRO"` e observação `"Data retirada: dd/mm/yyyy | Aparelho encontrado: Sim/Não"`.

**Cancelar Operação:** abre modal com duas ações: "Reagendar" (→ `AGENDADO`) ou "Cancelar OS" (→ `CANCELADO`).

**Auto-seleção:** se nenhuma OS está selecionada, não há `?osId` na URL e a lista carrega com itens → seleciona automaticamente o primeiro. Se a OS selecionada sai da lista (foi finalizada por outro usuário) → `selectedOsId = null`.

**Sincronização `imeiSearch` ↔ OS:** ao mudar `selectedOs`, `imeiSearch` é atualizado com `imeiVinculadoNaBancadaTestes(selectedOs)` via `useEffect`.

#### `SelectRastreadorTeste` — detalhes

- Portal em `document.body` (não dialog-aware — a bancada não usa modais para esse campo).
- Filtro: função **`rastreadorTextoBusca`** em `lib/rastreador-format.ts` (concatena IMEI, ICCID, marca/modelo, operadora, chip, plano em lowercase).
- Sem filtro: exibe os primeiros 15 rastreadores.
- Largura mínima do dropdown: `max(triggerWidth, 420px)`.
- Rastreador de "outro cliente" (proprietário Infinity ou cliente diferente da OS): destaque em `text-amber-600`.
- `BLUR_DELAY_MS = 150` — timeout para distinguir blur de click no item.
- `onMouseDown={(e) => e.preventDefault()}` no container do dropdown — evita perda de foco antes do click.

#### `TesteFilaCard` — detalhes visuais

- Tempo > 30 min: número em `text-red-600` + bolinha `bg-red-500`.
- OS selecionada: borda esquerda `border-l-4 border-erp-blue bg-erp-blue/5`.
- Exibe: OS#, nome do cliente, técnico • placa, subcliente via **`subclienteLabel`** (`lib/testes-utils.ts`), IMEI.

#### Sidebar — filtro

A busca da fila usa **`filtrarOsTesteNaFila(items, search)`** (`lib/testes-utils.ts`): número da OS, placa, nome do cliente, nome do subcliente e `idAparelho` (case-insensitive no texto digitado).

---


---

### Página: `CadastroRastreamentoPage`

**Entrada (rota):** `client/src/pages/cadastro-rastreamento/CadastroRastreamentoPage.tsx` — apenas compõe o hook e os componentes em `components/`.  
**Lógica e dados:** `hooks/useCadastroRastreamento.ts`.  
**Rota:** `/cadastro-rastreamento` (sidebar → seção Configuração)

#### Tipos e mapeamento (lib)

| Tipo / função | Local |
|---------------|--------|
| `StatusCadastro`, `Plataforma`, `OrdemCadastro`, `OSResponse` | `@/lib/cadastro-rastreamento.types` |
| `mapCadastroRastreamentoOS` (ex-`mapOS`) | `@/lib/cadastro-rastreamento-mapper` — resposta API → `OrdemCadastro`; datas com `formatarDataHoraCurta` |
| Categoria UI + rótulos de ação | `@/lib/cadastro-rastreamento-tipo-mappers` — `TipoRegistro` inclui `OUTRO` para tipos de OS não mapeados |

#### Mapeamento `TipoOS` (backend) → `TipoRegistro` (frontend)

| `TipoOS` (backend) | `TipoRegistro` | `tipoServico` (label) |
|-------------------|---------------|----------------------|
| `INSTALACAO_COM_BLOQUEIO` | `CADASTRO` | "Instalação c/ bloqueio" |
| `INSTALACAO_SEM_BLOQUEIO` | `CADASTRO` | "Instalação s/ bloqueio" |
| `REVISAO` | `REVISAO` | "Troca de Equipamento" |
| `RETIRADA` | `RETIRADA` | "Retirada de Equipamento" |

Outros valores de `tipo` na API mapeiam para `OUTRO` (ver `cadastro-rastreamento-tipo-mappers`).

`instalacaoComBloqueio: boolean | null` — `true` para `COM_BLOQUEIO`, `false` para `SEM_BLOQUEIO`, `null` para outros tipos.

#### Dependências de lib utilizadas

| Import | Uso |
|--------|-----|
| `buildCadastroRastreamentoPeriodoQuery` | `@/lib/cadastro-rastreamento-periodo` — calcula `{ dataInicio, dataFim }` para filtro de período |
| `getCadastroMapDeviceFields` | `@/lib/os-revisao-display` — extrai `imeiEntrada`, `imeiSaida`, `iccidEntradaOs`, `iccidSaidaOs`, `local`, `posChave` conforme `tipoOs`; **não duplicar essa lógica** |
| `api` | `@/lib/api` — cliente HTTP central |
| Mappers / UI / cópia | `cadastro-rastreamento-mapper`, `cadastro-rastreamento-ui`, `cadastro-rastreamento-copy` — ver `docs/context/cadastro-rastreamento.md` |

#### Estado (`useCadastroRastreamento`)

| Estado | Tipo | Uso |
|--------|------|-----|
| `selectedId` | `number \| null` | ID da OS selecionada na tabela |
| `plataforma` | `Plataforma` | Valor do select de plataforma no painel (default `"GETRAK"`); enviado ao concluir |
| `filtroStatus` | `StatusCadastro \| "TODOS"` | Tab de status ativo |
| `filtroTecnico` | `string` | Select de técnico; `""` = todos |
| `filtroTipo` | `string` | Select de tipo de registro; `""` = todos |
| `periodo` | `"hoje" \| "semana" \| "mes"` | Período de busca (default `"hoje"`) |

#### Query / Mutations (react-query)

| Símbolo | Key / endpoint | Notas |
|---------|---------------|-------|
| `useQuery` | `["cadastro-rastreamento", dataInicio, dataFim]` | `GET /cadastro-rastreamento?dataInicio=&dataFim=&limit=100`; retorna `{ data: OSResponse[]; total: number }` |
| `mutIniciar` | `PATCH /cadastro-rastreamento/:id/iniciar` | Move para `EM_CADASTRO`; `invalidateQueries` com prefixo `["cadastro-rastreamento"]` (export `CADASTRO_RAST_QUERY_KEY`) |
| `mutConcluir` | `PATCH /cadastro-rastreamento/:id/concluir` | Body: `{ plataforma }`; idem invalidação |

#### Lógica de filtros (client-side, aplicada sobre `ordens`)

```
ordensFiltradas = ordens.filter(
  matchStatus (TODOS ou exato) &&
  matchTecnico (string === ou vazio) &&
  matchTipo (tipoRegistro === ou vazio)
)
```

`filtroTecnico` e `filtroTipo` são filtros client-side após o fetch. `filtroStatus` também é client-side.

#### Coluna "Equipamento de Saída" — lógica especial

Para `tipoRegistro === "CADASTRO"` sem `imeiSaida` preenchido (após trim), a coluna replica entrada — função `getColunaEquipamentoSaida` em `pages/cadastro-rastreamento/lib/table-helpers.ts`.

#### Constante de Select vazio

`SELECT_CADASTRO_RAST_TODOS` (`"__todos__"`) em `cadastro-rastreamento-ui` — Radix `Select` não aceita `value=""` como item; normalizar para `""` no estado.

#### Config Maps (`cadastro-rastreamento-ui`)

`CADASTRO_RAST_STATUS_CONFIG` — badge por `StatusCadastro` (ex.: `AGUARDANDO` amber, `EM_CADASTRO` blue, `CONCLUIDO` emerald).

`CADASTRO_RAST_TIPO_REGISTRO_CONFIG` — badge base por categoria; instalação c/ s/ bloqueio usa `badgeServicoColunaCadastroRast` + rótulos longos.

`cadastroRastreamentoAcaoLabels` (em `cadastro-rastreamento-tipo-mappers`) — rótulos de botão e toasts por `TipoRegistro` × ação.

`PLATAFORMA_RAST_LABEL` — `GETRAK` / `GEOMAPS` / `SELSYN` → texto legível.

#### Estrutura visual

```
<div>
  Stat Cards (Aguardando | Em Cadastro | Concluídas)
  Toolbar (Select técnico | Select tipo | Select período | Limpar | Tabs status)
  Body
    Tabela (flex-1)     ← clique na row define selectedId
    <aside w-340px>     ← Mesa de Trabalho; sticky; vazio ou detalhes da OS selecionada
      PanelBlock "Dados da Ordem"
      PanelBlock "Dados do Veículo"
      PanelBlock "Aparelho de Entrada"  (CADASTRO e REVISAO)
      PanelBlock "Aparelho de Saída"    (REVISAO e RETIRADA)
      Auxílio de Cadastro (botões copiar individual + copiar todos)
      Controle (Select plataforma se EM_CADASTRO; status readonly; concluidoPor/concluidoEm se CONCLUIDO)
      Botão de ação (Iniciar / Concluir / Concluído desabilitado)
  Rodapé count
```

#### `PanelBlock` / `PanelRow`

Definidos em `components/CadastroRastreamentoPanelPrimitives.tsx` (seção com header + `bg-slate-50`; linha label/valor com `highlight` opcional).

#### Função `copiarTodos` / texto agregado

Montagem do texto em `buildTextoCopiarTodosCadastroRast` (`@/lib/cadastro-rastreamento-copy`). A UI lista botões a partir de `getAuxilioCopiaItens` (mesma lib).

Copia para clipboard o bloco de texto:
```
Placa: <placa>
Cliente: <cliente>
IMEI (Entrada): <imei>       (se existir)
ICCID (Entrada): <iccid>     (se existir)
IMEI (Saída): <imeiSaida>    (se existir)
ICCID (Saída): <iccidSaida>  (se existir)
```


---

## Página: `Login` (`client/src/pages/Login.tsx`)

- **Responsabilidade**: autenticação; troca obrigatória de senha pós-login.
- **Estado**: `loading`, `showSenha` (toggle visibilidade), `showTrocaSenha` (modal), `senhaAtualParaTroca`.
- **Form**: react-hook-form + zod → campos `email` (email) e `password` (min 1).
- **Fluxo**:
  1. Submit → `login(email, password)` do `AuthContext` → `POST /auth/login`.
  2. Se `exigeTrocaSenha = true` → abre `ModalTrocaSenha` com `senhaAtual = senha digitada`, `obrigatorio = true`.
  3. Senão → `navigate(from)` onde `from = location.state?.from?.pathname ?? "/"`.
- **Sem permissões** (pré-auth).
- **API**: indireto via `AuthContext`. Modal chama `POST /auth/trocar-senha` com `{ senhaAtual, novaSenha }`.
- **`ModalTrocaSenha`**: quando `obrigatorio = true`, ESC, clique fora e botão X são bloqueados.

**Layout (split-panel industrial):**

- `flex min-h-screen overflow-hidden` na raiz; dois painéis lado a lado.
- **Painel esquerdo** (`hidden lg:flex lg:w-[55%]`): branding `bg-slate-900` com padrão SVG inline (`INDUSTRIAL_PATTERN`), gradiente overlay, logo + nome do sistema, headline e 3 pilares de feature (`PILLARS` — ícones `MaterialIcon` + label + descrição). Borda colorida esquerda `border-l-2 border-erp-blue/40` por pilar.
- **Painel direito** (`w-full lg:w-[45%]`): `bg-white`; logo mobile-only; formulário em `max-w-md`; card `border border-slate-200 rounded-sm shadow-sm p-8`; campos com ícones `MaterialIcon` prefixados (account_circle, lock); botão de submit com `ArrowRight` (animação `group-hover:translate-x-0.5`) e `Loader2` durante loading; footer "© Evolutiva Sistemas".
- Inputs com `h-10 pl-9`; labels `text-[10px] font-bold uppercase text-slate-500`.
- **Sem `Card`/`CardHeader`/`CardContent`** do shadcn — layout manual.

---

## Página: `OrdensServicoPage` (`client/src/pages/ordens-servico/OrdensServicoPage.tsx`)

Dashboard principal de ordens de serviço. Rota: `/` (índice do `AppLayout`).

**Organização do código:** a página é um orquestrador fino. Estado e dados vêm de `hooks/useOrdensServicoPage.ts`; UI em `lista/components/` (pipeline, toolbar, tabela, painel de detalhe expandido, diálogos); tipos, constantes de status e helpers de exibição em `shared/` (`ordens-servico.types.ts`, `ordens-servico.constants.ts`, `ordens-servico.display.ts`). Lazy load no `App.tsx`: `@/pages/ordens-servico/OrdensServicoPage`.

### Queries

| QueryKey | Endpoint | Notas |
|----------|----------|-------|
| `["ordens-servico", "resumo"]` | `GET /ordens-servico/resumo` | Cards de contagem no pipeline |
| `["ordens-servico", page, search, statusFilter]` | `GET /ordens-servico?page&limit=15&search&status` | Tabela paginada; `status` omitido quando `"TODOS"` |
| `["ordens-servico", "detalhe", expandedOsId]` | `GET /ordens-servico/:id` | `enabled: !!expandedOsId`; carregado ao expandir linha |

### Mutation

`PATCH /ordens-servico/:id/status` com `{ status, observacao? }` — invalida `["ordens-servico"]` em `onSuccess`.

Ações mapeadas para a mutation:
- **Iniciar Testes**: `status = "EM_TESTES"` (com modal de confirmação).
- **Retirada Realizada**: `status = "AGUARDANDO_CADASTRO"`, `observacao = "Data retirada: dd/mm/yyyy | Aparelho encontrado: Sim/Não"` (com modal de confirmação).
- **Enviar para Cadastro**: `status = "AGUARDANDO_CADASTRO"` (direto, sem modal).

### Estado (em `useOrdensServicoPage`)

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `page` | `number` | Página atual (server-side) |
| `search` | `string` | Texto livre (OS, placa, cliente) |
| `statusFilter` | `string` | `"TODOS"` ou valor de `StatusOS`; clicável no pipeline |
| `expandedOsId` | `number \| null` | Linha expandida — dispara query de detalhe |
| `downloadingPdf` | `boolean` | Loading de download de PDF |
| `confirmIniciarOsId` | `number \| null` | ID da OS no modal de confirmação de início de testes |
| `showRetiradaModal` | `number \| null` | ID da OS no modal de confirmação de retirada |

### Permissões

| Código | Efeito |
|--------|--------|
| `AGENDAMENTO.OS.CRIAR` | Exibe botão "Nova OS" |
| `AGENDAMENTO.OS.EDITAR` | Habilita "Iniciar Testes" e "Retirada Realizada" na linha expandida |

### Layout e componentes

- **Pipeline** (topo): 6 cards clicáveis (Total, Agendado, Em Testes, Testes Realizados, Aguardando Cadastro, Finalizado); cor de borda ativa (`border-t-2 border-b-2`).
- **Toolbar**: `Input` de busca (`w-64`) + `SearchableSelect` de status + botão "Nova OS".
- **Tabela** (`erp-table font-condensed`): 10 colunas — expand icon · OS# · Cliente · Subcliente · Placa · Técnico · Tipo · Status · Última Mov. · Ações (DropdownMenu).
- **Linha expandida** (`colSpan=10`, `grid-cols-3`): 3 seções:
  1. **Dados de Emissão** — emitido por, data, tipo, ID a retirar/substituir, local, pós-chave, endereço subcliente, telefone, email, veículo, observações.
  2. **Dados de Teste / Dados da Retirada** — condicional por tipo e status; exibe botões de ação ("Iniciar Testes", "Retirada Realizada"); tempos de testes; IMEI/local/pós-chave via `getOsDadosTesteParaExibicao`.
  3. **Dados de Cadastro** — botão "Enviar para Cadastro" (quando `TESTES_REALIZADOS`); data de envio, plataforma, status do cadastro (quando `AGUARDANDO_CADASTRO` ou `FINALIZADO`).
- **Download PDF**: `apiDownloadBlob(\`/ordens-servico/${id}/pdf\`, 30_000)` → cria `<a>` e dispara download.

### Helpers e constantes (`shared/`)

| Módulo | Conteúdo |
|--------|----------|
| `shared/ordens-servico.display.ts` | `getSubclienteParaExibicao`, `formatEnderecoSubcliente`, `formatDadosVeiculo`, `getDadosTeste`, `getDadosRetirada` |
| `shared/ordens-servico.constants.ts` | `ORDENS_SERVICO_STATUS_LABELS`, `ORDENS_SERVICO_STATUS_COLORS`, `totalOrdensFromResumo` |
| `shared/ordens-servico.types.ts` | Tipos de resumo, lista, detalhe e subcliente para exibição |

O painel expandido trata **detalhe obsoleto** durante o refetch ao trocar de linha: mostra loading enquanto `osDetalhe.id` não bate com a linha expandida.

## Página: `OrdensServicoCriacaoPage` (`/ordens-servico/nova`)

Criação de ordem de serviço. O **ponto de entrada** é `client/src/pages/ordens-servico/OrdensServicoCriacaoPage.tsx` (lazy: `@/pages/ordens-servico/OrdensServicoCriacaoPage`); a implementação está modularizada em `client/src/pages/ordens-servico/criacao/` (schema, constantes, payload, resumo, hooks, componentes de seção e sidebar). Detalhe de ficheiros, queries, fluxo de subcliente/veículo e testes de frontend: **`docs/context/ordens-servico.md`** (secção *Módulo de criação de OS* e *OrdensServicoCriacaoPage — detalhes de implementação*).

---
