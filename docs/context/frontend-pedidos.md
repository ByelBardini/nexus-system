# Context — Nexus System

Ver índice em `AGENTS.md`.

### Páginas: Pedidos Rastreadores (`client/src/pages/pedidos/`)

Duas rotas distintas compartilham o mesmo diretório:

| Rota | Componente | Propósito |
|------|-----------|-----------|
| `/pedidos-rastreadores` | `PedidosRastreadoresPage` | Kanban read-only + criação |
| `/pedidos-config` | `PedidosConfigPage` | Kanban operacional com gestão de kits e status |

#### Arquivos e responsabilidades

| Arquivo | Responsabilidade |
|---------|-----------------|
| `types.ts` | Tipos da API (`PedidoRastreadorApi`, `PedidoRastreadorView`, enums); constantes visuais (`STATUS_CONFIG`, `URGENCIA_STYLE`, `STATUS_ORDER`); função `mapPedidoToView` |
| `pedidos-config-types.ts` | Tipos de kit (`KitResumo`, `KitDetalhe`, `KitComAparelhos`, `KitVinculado`, `AparelhoNoKit`) e `TipoDespacho` |
| `PedidosRastreadoresPage.tsx` | Kanban de leitura; busca global; abre `DrawerDetalhes` e `ModalNovoPedido` |
| `PedidosConfigPage.tsx` | Kanban operacional; workspace de kits/despacho persistido em `sessionStorage` (`nexus-pedidos-config-workspace`); abre `SidePanel` |
| `KanbanColumn.tsx` | Coluna kanban com header de status + lista de `KanbanCard` |
| `KanbanCard.tsx` | Card individual: borda de urgência (`URGENCIA_STYLE`), código, destinatário, tipo, endereço, quantidade, duração (se entregue) |
| `DrawerDetalhes.tsx` | `Sheet` lateral read-only (450 px); exibe detalhes + histórico; botão excluir (`AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR`) com confirmação via `Dialog` |
| `SidePanel.tsx` | `Sheet` operacional (580 px); avança/retrocede status; gerencia kits vinculados; seleção de tipo de despacho; abre `ModalSelecaoEKit` |
| `ModalNovoPedido.tsx` | `Dialog` de criação; form react-hook-form + zod; suporte a tipos TECNICO / CLIENTE / MISTO; campos de marca/modelo/operadora opcionais |
| `ModalSelecaoEKit.tsx` | `Dialog` de seleção e edição de kits; 2 steps: seleção de kit e edição de aparelhos; cria kits novos inline; gerencia destinatários MISTO via `/aparelhos-destinatarios` |

#### Tipos principais (`types.ts`)

**Enums de API (string union):**
- `TipoDestinoPedido`: `"TECNICO" | "CLIENTE" | "MISTO"`
- `StatusPedidoRastreador`: `"SOLICITADO" | "EM_CONFIGURACAO" | "CONFIGURADO" | "DESPACHADO" | "ENTREGUE"`
- `UrgenciaPedido`: `"BAIXA" | "MEDIA" | "ALTA" | "URGENTE"`

**`StatusPedidoKey`** (minúsculo, usado no kanban): `"solicitado" | "em_configuracao" | "configurado" | "despachado" | "entregue"`

**Constantes visuais:**
- `STATUS_ORDER: StatusPedidoKey[]` — ordem das colunas (5 colunas)
- `STATUS_CONFIG` — `{ label, color, dotColor }` por status
- `STATUS_TO_API` — converte `StatusPedidoKey` → `StatusPedidoRastreador`
- `URGENCIA_LABELS` — `{ BAIXA→"Baixa", MEDIA→"Média", ALTA→"Alta", URGENTE→"Urgente" }`
- `URGENCIA_STYLE` — `{ bar: string, badge: string }` por label de urgência (borda esquerda do card)

**`mapPedidoToView(p: PedidoRastreadorApi): PedidoRastreadorView`** — transforma a resposta da API no view model do kanban. Regras importantes:
- `destinatario`: nome do técnico se `TECNICO/MISTO`; subcliente > cliente > subcliente.cliente se `CLIENTE`
- `itensMisto`: apenas para `MISTO`; item `INFINITY` → label `"Infinity"`, item `CLIENTE` → `cliente.nome`
- `cidadeEstado`: prioriza `cidadeEndereco/estadoEndereco` do técnico; cai para `cidade/estado`
- `endereco`: compila logradouro + número + complemento + bairro + cidade/estado + CEP do técnico
- `contato`: técnico só tem `nome` + `telefone`; subcliente tem `nome` + `telefone` + `email`

#### QueryKeys e endpoints consumidos (frontend)

| QueryKey | Endpoint | Onde |
|----------|----------|------|
| `["pedidos-rastreadores", busca]` | `GET /pedidos-rastreadores?limit=500&search=...` | `PedidosRastreadoresPage`, `PedidosConfigPage` |
| `["tecnicos"]` | `GET /tecnicos` | `ModalNovoPedido` |
| `["clientes", "com-subclientes"]` | `GET /clientes?subclientes=true` | `ModalNovoPedido` |
| `["equipamentos", "marcas"]` | `GET /equipamentos/marcas` | `ModalNovoPedido` |
| `["equipamentos", "modelos", marcaId]` | `GET /equipamentos/modelos?marcaId=...` | `ModalNovoPedido` |
| `["equipamentos", "operadoras"]` | `GET /equipamentos/operadoras` | `ModalNovoPedido` |
| `["kit", kitId]` | `GET /aparelhos/pareamento/kits/:id` | `SidePanel` (expand de kit) |
| `["kits"]` / `["aparelhos"]` | invalidados em mudança de status | `SidePanel` |

#### Mutations e endpoints de escrita

| Mutation | Endpoint | Payload |
|---------|----------|---------|
| Criar pedido TECNICO/CLIENTE | `POST /pedidos-rastreadores` | `{ tipoDestino, tecnicoId?, clienteId?, subclienteId?, dataSolicitacao, quantidade, urgencia, ... }` |
| Criar pedido MISTO | `POST /pedidos-rastreadores` | `{ tipoDestino: "MISTO", tecnicoId, itens: [{ proprietario, clienteId?, quantidade, ... }] }` |
| Atualizar status | `PATCH /pedidos-rastreadores/:id/status` | `{ status: StatusPedidoRastreador, kitIds?: number[] }` |
| Vincular kits | `PATCH /pedidos-rastreadores/:id/kits` | `{ kitIds: number[] }` |
| Excluir | `DELETE /pedidos-rastreadores/:id` | — |

#### Fluxo de status no `SidePanel`

```
SOLICITADO → EM_CONFIGURACAO → CONFIGURADO → DESPACHADO → ENTREGUE
```

- Avançar para `CONFIGURADO` exige `progress >= total` (kits vinculados cobrem toda a quantidade).
- `tipoDespacho === "EM_MAOS"`: pula `DESPACHADO` e vai direto para `ENTREGUE`.
- Retroceder bloqueado quando `status === "despachado"` (não pode voltar de despachado via UI).
- `kitIds` é enviado junto com a mudança de status para `CONFIGURADO`, `DESPACHADO` e `ENTREGUE`.
- Ao mudar status, invalida também `["aparelhos"]`, `["kit"]` e `["kits"]`.

#### Workspace persistido (`PedidosConfigPage`)

Estado de configuração local (não vai para a API) salvo em `sessionStorage["nexus-pedidos-config-workspace"]`:

```ts
interface WorkspacePersisted {
  kitsPorPedido: Record<string, KitVinculado[]>;
  tipoDespachoPorPedido: Record<string, TipoDespacho>;
  transportadoraPorPedido: Record<string, string>;
  numeroNfPorPedido: Record<string, string>;
}
```

Chaves são `string(pedidoId)`. `TipoDespacho`: `"TRANSPORTADORA" | "CORREIOS" | "EM_MAOS"`.

#### Formulário `ModalNovoPedido` — schema zod

Campo `destinoCliente` codifica o destino como `"cliente-{id}"` ou `"subcliente-{id}"` — parseado no submit.  
Campo `itensMisto` é `useFieldArray`; cada item tem `proprietario`, `quantidade`, e flags opcionais `marcaModeloEspecifico` / `operadoraEspecifica`.  
Regras cross-field (`.refine`):
- `TECNICO` ou `MISTO`: `tecnicoId` obrigatório
- `CLIENTE`: `destinoCliente` obrigatório

#### Permissões usadas

| Ação | Código |
|------|--------|
| Excluir pedido | `AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR` |
| Editar status / kits | `AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR` |

#### KanbanColumnConfig / KanbanCardConfig

`PedidosConfigPage` usa `KanbanColumnConfig` e `KanbanCardConfig` (variantes com interações de configuração), separados de `KanbanColumn` / `KanbanCard` usados na `PedidosRastreadoresPage`.

