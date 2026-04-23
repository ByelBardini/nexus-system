# Context — Nexus System

Ver índice em `AGENTS.md`.

### Páginas: Pedidos Rastreadores (`client/src/pages/pedidos/`)

Duas rotas distintas; **na raiz do módulo existem apenas dois ficheiros `.tsx`** (entradas de página). O restante vive em subpastas por domínio.

| Rota | Componente | Propósito |
|------|-----------|-----------|
| `/pedidos-rastreadores` | `PedidosRastreadoresPage` | Kanban read-only + criação |
| `/pedidos-config` | `PedidosConfigPage` | Kanban operacional com gestão de kits e status |

#### Estrutura de pastas (resumo)

| Pasta / ficheiros raiz | Conteúdo |
|------------------------|----------|
| `PedidosRastreadoresPage.tsx`, `PedidosConfigPage.tsx` | Únicos ficheiros na raiz (apenas `.tsx`) — páginas exportadas pelas rotas em `App.tsx` |
| `shared/pedidos-rastreador.types.ts` | Tipos da API e do view model (`PedidoRastreadorApi`, `PedidoRastreadorView`, etc.); **reexporta** constantes de kanban/urgência e `mapPedidoToView` definidos em ficheiros irmãos em `shared/` |
| `shared/pedidos-config-types.ts` | Tipos de kit (`KitResumo`, `KitDetalhe`, `KitComAparelhos`, `KitVinculado`, `AparelhoNoKit`) e `TipoDespacho` |
| `shared/` (resto) | `pedidos-rastreador-api-enums.ts` (`StatusPedidoRastreador`); `pedidos-rastreador-kanban.ts` (`STATUS_ORDER`, `STATUS_CONFIG`, `URGENCIA_LABELS`, `URGENCIA_STYLE` com `bar` / `badge` / `valueText`, `STATUS_TO_KEY`, …); `map-pedido-rastreador-to-view.ts`; `aparelho-destinatario.ts` (rótulo único de destinatário para aparelho em e-Kit, painel e filtros); `aparelho-no-kit-aggregates.ts` (marcas/modelos e operadoras únicas a partir de `AparelhoNoKit`); `pedidos-urgencia-ui.ts` (`getUrgenciaBadgeClass`, `getUrgenciaValueTextClass` sobre `URGENCIA_STYLE`) |
| `lista/hooks/` | `usePedidosRastreadoresListQuery`, `pedidos-rastreadores-list.query-keys` — listagem partilhada pelas duas páginas |
| `lista/components/` | Toolbar (`PedidosRastreadoresListToolbar`), shell do kanban (`PedidosKanbanColumnShell`), placeholder de coluna vazia (`PedidosKanbanColumnEmptyState`), chips Misto (`PedidoMistoChips`), `ExcluirPedidoConfirmDialog`, `DrawerDetalhes` |
| `lista/kanban/` | `KanbanColumn`, `KanbanColumnConfig`, `KanbanCard`, `KanbanCardConfig` — imports internos preferem alias `@/pages/pedidos/...` |
| `novo-pedido/` | Mesmo padrão: `ModalNovoPedido.tsx` na raiz; `components/`, `hooks/`; ficheiros `novo-pedido-rastreador.*` na raiz |
| `modal-selecao-ekit/` | **Padrão alinhado ao `novo-pedido/`:** `ModalSelecaoEKit.tsx` na raiz; `modal-selecao-ekit.types.ts`, `modal-selecao-ekit.utils.ts`; `components/` (passos, tabela, painel de aparelhos); `hooks/` (`useModalSelecaoEKit`, `useModalSelecaoEKitState`, `pareamento-kits.queries.ts`). O hook do modal usa `useKitComAparelhosQuery` do side-panel para cache alinhado ao painel. |
| `side-panel/` | **Mesmo padrão:** `SidePanel.tsx` na raiz; `side-panel.types.ts`, `side-panel.utils.ts`; `components/` (header, kits, despacho, histórico, …); `hooks/` (`useSidePanelMutations`, `useKitComAparelhosQuery`) |

Imports públicos típicos (sem barrels): páginas/modal raiz — `@/pages/pedidos/novo-pedido/ModalNovoPedido`, `@/pages/pedidos/modal-selecao-ekit/ModalSelecaoEKit`, `@/pages/pedidos/side-panel/SidePanel`. Submódulos e testes importam caminhos explícitos, p.ex. `@/pages/pedidos/modal-selecao-ekit/hooks/useModalSelecaoEKit`, `@/pages/pedidos/side-panel/components/SidePanelHeader`.

#### Ficheiros principais e responsabilidades

| Local | Responsabilidade |
|-------|------------------|
| `PedidosRastreadoresPage.tsx` | Kanban de leitura; `usePedidosRastreadoresListQuery` (`scope: "lista"`); toolbar; abre `lista/components/DrawerDetalhes` e `novo-pedido/ModalNovoPedido` |
| `PedidosConfigPage.tsx` | Kanban operacional; `scope: "config"` na mesma API; workspace em `sessionStorage` (`nexus-pedidos-config-workspace`); abre `side-panel/SidePanel` |
| `lista/kanban/*` | Colunas e cards; colunas vazias usam `PedidosKanbanColumnEmptyState`; cards de config alinham badge de urgência a `URGENCIA_STYLE` / `pedidos-urgencia-ui` |
| `lista/components/DrawerDetalhes.tsx` | `Sheet` read-only; valor textual de urgência via `getUrgenciaValueTextClass`; exclusão com `ExcluirPedidoConfirmDialog` |
| `side-panel/SidePanel.tsx` | Painel operacional na raiz da pasta; `ModalSelecaoEKit` de `../modal-selecao-ekit/ModalSelecaoEKit`; subcomponentes em `side-panel/components/` (imports para `shared/` em `../../shared/…`) |
| `novo-pedido/ModalNovoPedido.tsx` | `Dialog` de criação; RHF + Zod; TECNICO / CLIENTE / MISTO |

#### Tipos principais (`shared/pedidos-rastreador.types.ts` e `shared/*`)

**Enums de API:** ver `shared/pedidos-rastreador-api-enums.ts` e reexport em `shared/pedidos-rastreador.types.ts`.

**`StatusPedidoKey`** (minúsculo, kanban): exportado a partir de `shared/pedidos-rastreador-kanban.ts` e reexportado por `shared/pedidos-rastreador.types.ts`.

**Constantes visuais:** `STATUS_ORDER`, `STATUS_CONFIG`, `STATUS_TO_API`, `URGENCIA_LABELS`, `URGENCIA_STYLE` — definidas em `shared/pedidos-rastreador-kanban.ts` (`URGENCIA_STYLE` inclui `valueText` para cor de texto em detalhes/drawer).

**`mapPedidoToView`:** implementação em `shared/map-pedido-rastreador-to-view.ts`; reexport em `shared/pedidos-rastreador.types.ts`. Regras de mapeamento (destinatário, MISTO, endereço, contato) inalteradas em relação à descrição anterior.

**Destinatário de aparelho (e-Kit / resumo do painel):** `shared/aparelho-destinatario.ts` — `getDestinatarioExibicaoAparelhoNoKit`, `getDestinatarioFiltroAparelhoNoKit`, `collectDestinatariosEmpresasAparelhos`. UI do modal e-Kit deve importar estes helpers (não usar wrapper duplicado).

**Agregação marca/modelo/operadora:** `shared/aparelho-no-kit-aggregates.ts` — reutilizado por `modal-selecao-ekit.utils` e `side-panel.utils` (`aggregateResumoAparelhosDoKit`).

#### QueryKeys e listagem (frontend)

A listagem usa **um hook** com escopos distintos para cache:

| Escopo | QueryKey (resumo) | Uso |
|--------|-------------------|-----|
| `lista` | `["pedidos-rastreadores", buscaTrim]` | `PedidosRastreadoresPage` |
| `config` | `["pedidos-rastreadores", "config", buscaTrim]` | `PedidosConfigPage` |

**API:** `GET /pedidos-rastreadores?limit=500&search=...` (search só se `busca.trim()` não for vazio).  
Invalidação ampla com `queryKey: ["pedidos-rastreadores"]` cobre ambos os escopos.

Outras chaves relevantes (sem mudança de regra de negócio):

| QueryKey | Endpoint | Onde |
|----------|----------|------|
| `["tecnicos"]` | `GET /tecnicos` | hooks globais + `novo-pedido` |
| `["clientes", "subclientes"]` | `GET /clientes?subclientes=1` | idem |
| `["aparelhos","pareamento","kits","detalhes"]` | detalhes de kits | `modal-selecao-ekit/hooks/pareamento-kits.queries.ts` (modal + `PedidosConfigPage` pré-busca) |
| `["kit", kitId]` | `GET /aparelhos/pareamento/kits/:id` | `useKitComAparelhosQuery` (painel e `useModalSelecaoEKit`) |

#### Mutations e permissões

Tabela de mutations/rotas e permissões mantém-se alinhada ao backend (`docs/context/pedidos-rastreadores.md`).

#### Workspace persistido (`PedidosConfigPage`)

Inalterado: `sessionStorage["nexus-pedidos-config-workspace"]` com `kitsPorPedido`, `tipoDespachoPorPedido`, `transportadoraPorPedido`, `numeroNfPorPedido`.

#### Formulário `ModalNovoPedido`

Comportamento do schema e destinos mantido; código em `novo-pedido/` (ver ficheiros `novo-pedido-rastreador.schema.ts`, hooks e componentes).
