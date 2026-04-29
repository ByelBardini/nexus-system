# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `pedidos-rastreadores`

**Arquivos do módulo (`server/src/pedidos-rastreadores/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `pedidos-rastreadores.module.ts` | Registra controller, `PedidosRastreadoresService`, `PedidosRastreadoresProprietarioDebitoHelper`; importa `PrismaModule`, `UsersModule`, `DebitosRastreadoresModule`; **não** exporta o service |
| `pedidos-rastreadores.controller.ts` | Rotas em `/pedidos-rastreadores`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('pedidos-rastreadores')` |
| `pedidos-rastreadores.service.ts` | Criação, listagem, atualização de status, gestão de kits, destinatários MISTO, atualização de despacho, remoção |
| `pedidos-rastreadores.constants.ts` | `ORDEM_STATUS_PEDIDO_RASTREADOR` (sequência linear de status para validação em `updateStatus`) |
| `pedidos-rastreadores-include.ts` | `PEDIDO_RASTREADOR_INCLUDE_BASE` — shape de `include` Prisma reutilizado em `findMany` / `findOne` / updates |
| `pedidos-rastreadores-kit-ids.helper.ts` | `extrairKitIds(unknown)` — normaliza `pedido.kitIds` (`Json` ou string JSON) para `number[]` |
| `pedidos-rastreadores-destino.helpers.ts` | Funções puras: `resolveTargetClienteId`, `resolveNonMistoClienteDestino`, `resolveNonMistoTecnicoDestino` (pedidos não-MISTO em transições de status) |
| `pedidos-rastreadores-proprietario-debito.helper.ts` | `@Injectable()` — resolve marca/modelo por nome **com cache por transação** (evita N+1) e chama `DebitosRastreadoresService.consolidarDebitoTx` quando o proprietário do aparelho muda |
| `dto/create-pedido-rastreador.dto.ts` | Body de criação; valida destino e itens MISTO |
| `dto/create-pedido-rastreador-item.dto.ts` | Item de pedido MISTO (proprietário, quantidade, marca/modelo/operadora) |
| `dto/update-status-pedido.dto.ts` | `status`, `observacao?`, `kitIds?`, `deClienteId?` |
| `dto/update-kit-ids.dto.ts` | `kitIds: number[]` |
| `dto/update-despacho-pedido.dto.ts` | `tipoDespacho?`, `transportadora?`, `numeroNf?` — todos opcionais; `tipoDespacho` validado com `@IsIn(['TRANSPORTADORA','CORREIOS','EM_MAOS'])` |
| `dto/bulk-aparelho-destinatario.dto.ts` | `aparelhoIds`, `destinatarioProprietario`, `destinatarioClienteId?` |

**Endpoints e permissões:**

| Método | Path | Permissão | Código |
|--------|------|-----------|--------|
| GET | `/pedidos-rastreadores` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` | 200 |
| GET | `/pedidos-rastreadores/:id` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` | 200 |
| POST | `/pedidos-rastreadores` | `AGENDAMENTO.PEDIDO_RASTREADOR.CRIAR` | 201 |
| PATCH | `/pedidos-rastreadores/:id/status` | `AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR` | 200 |
| PATCH | `/pedidos-rastreadores/:id/despacho` | `AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR` | 200 |
| PATCH | `/pedidos-rastreadores/:id/kits` | `AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR` | 200 |
| POST | `/pedidos-rastreadores/:id/aparelhos-destinatarios` | `AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR` | **204** |
| GET | `/pedidos-rastreadores/:id/aparelhos-destinatarios` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` | 200 |
| DELETE | `/pedidos-rastreadores/:id/aparelhos-destinatarios/:aparelhoId` | `AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR` | **204** |
| DELETE | `/pedidos-rastreadores/:id` | `AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR` | 200 |

**Query params `GET /pedidos-rastreadores`:**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `page` | `string?` (convertido com `+`) | Paginação |
| `limit` | `string?` | **`maxLimit: 500`, `defaultLimit: 500`** — listagem pode retornar até 500 itens por padrão |
| `status` | `StatusPedidoRastreador?` | Filtro exato |
| `search` | `string?` | Busca insensitive em: `codigo`, `tecnico.nome`, `cliente.nome`, `subcliente.nome`, `subcliente.cliente.nome`, `itens[].cliente.nome` |

**Enums Prisma usados:**

- `TipoDestinoPedido`: `TECNICO` | `CLIENTE` | `MISTO`
- `StatusPedidoRastreador`: `SOLICITADO` | `EM_CONFIGURACAO` | `CONFIGURADO` | `DESPACHADO` | `ENTREGUE`
- `UrgenciaPedido`: `BAIXA` | `MEDIA` | `ALTA` | `URGENTE`
- `ProprietarioTipo`: `INFINITY` | `CLIENTE`

**Modelos Prisma (campos-chave):**

- `PedidoRastreador`: `id`, `codigo` (formato `PED-0001`, gerado via `MAX+1` com até 5 retries em race P2002), `tipoDestino` (`TipoDestinoPedido`), `status` (`StatusPedidoRastreador`), `urgencia` (`UrgenciaPedido`, default `MEDIA`), `dataSolicitacao`, `quantidade`, `tecnicoId?`, `clienteId?`, `subclienteId?`, `deClienteId?`, `marcaEquipamentoId?`, `modeloEquipamentoId?`, `operadoraId?`, `kitIds` (`Json?`), `observacao?`, `entregueEm?`, `tipoDespacho?` (`VarChar(20)`, valores `TRANSPORTADORA`/`CORREIOS`/`EM_MAOS`), `transportadora?` (`VarChar(200)`), `numeroNf?` (`VarChar(100)`), `criadoPorId?`, `criadoEm`, `atualizadoEm`.
- `PedidoRastreadorHistorico`: `id`, `pedidoRastreadorId`, `statusAnterior`, `statusNovo`, `observacao?`, `criadoEm`.
- `PedidoRastreadorItem`: `id`, `pedidoRastreadorId`, `proprietario` (`ProprietarioTipo`), `clienteId?`, `quantidade`, `marcaEquipamentoId?`, `modeloEquipamentoId?`, `operadoraId?`.
- `PedidoRastreadorAparelho`: vínculo aparelho ↔ pedido com destinatário; campos `aparelhoId`, `pedidoRastreadorId`, `destinatarioProprietario`, `destinatarioClienteId?`.

**Regras de negócio críticas:**

**Criação (`create` / `createOnce`):**
- `codigo` = `PED-XXXX` (4 dígitos); derivado do último registro por `id desc`; até 5 retries em `P2002`.
- `tipoDestino = MISTO`: `quantidade` = soma de `itens[].quantidade`; cria `PedidoRastreadorItem` aninhados; `tecnicoId` obrigatório mesmo em MISTO.
- `tipoDestino = TECNICO` ou `CLIENTE`: usa `quantidade` do DTO; sem itens.
- `dataSolicitacao`: default `new Date()` se omitido; `urgencia`: default `MEDIA`.
- Validação custom `DestinatarioClienteConstraint`: se `CLIENTE`, exige `clienteId || subclienteId`.

**`bulkSetDestinatarios`:**
- Encontra o `PedidoRastreadorItem` correspondente ao destinatário: match por `proprietario` e (se CLIENTE) `clienteId = destinatarioClienteId`.
- Controla **cota**: conta assignments existentes fora dos `aparelhoIds` enviados; `jaAtribuidos + aparelhoIds.length` não pode exceder `item.quantidade`.
- `upsert` em `PedidoRastreadorAparelho` (sem erro silencioso — lança se cota ultrapassada).

**`getAparelhosDestinatarios`:**
- Retorna `{ assignments, quotaUsage }`.
- `quotaUsage`: por item, conta linhas com mesmo `proprietario` + `clienteId`; exibe `'Infinity'` para INFINITY.

**`removeAparelhoDestinatario`:**
- `deleteMany` silencioso (não lança se zero linhas removidas; não valida pedido).

**`updateStatus` — máquina de estados e efeitos:**
1. **Idempotência:** se `dto.status === statusAtual`, retorna `findOne` sem transação.
2. **Fluxo linear:** definido por `ORDEM_STATUS_PEDIDO_RASTREADOR` em `pedidos-rastreadores.constants.ts` — `SOLICITADO → EM_CONFIGURACAO → CONFIGURADO → DESPACHADO → ENTREGUE`. Retroagir de `DESPACHADO` é bloqueado explicitamente. `ENTREGUE → CONFIGURADO` é permitido e **reseta** aparelhos.
3. **`entregueEm`:** setado em `new Date()` ao ir para `ENTREGUE`; zerado (`null`) ao voltar para `CONFIGURADO`.
4. **`kitIds`:** pode vir no DTO ou ser lido de `pedido.kitIds` (campo `Json?`, parseado por `extrairKitIds` em `pedidos-rastreadores-kit-ids.helper.ts`). Persistido se não vazio; **preserva** kits existentes se DTO não trouxer novos.
5. **Kits (`Kit.kitConcluido`):**
   - Status `CONFIGURADO`, `DESPACHADO`, `ENTREGUE` + `kitIds` → `kit.updateMany { kitConcluido: true }`.
   - Regressão para `SOLICITADO`/`EM_CONFIGURACAO` → para cada kitId antigo não presente em outros pedidos restritivos, `kit.kitConcluido = false`.
6. **Mapeamento status pedido → status aparelho:**
   - `DESPACHADO` → `StatusAparelho.DESPACHADO`
   - `ENTREGUE` → `StatusAparelho.COM_TECNICO`
   - `CONFIGURADO` (vindo de ENTREGUE) → `StatusAparelho.CONFIGURADO`
   - Outros → sem atualização de aparelhos.
7. **Validação de despacho antes de `DESPACHADO`:** antes de persistir a transição, verifica `pedido.tipoDespacho`:
   - `'TRANSPORTADORA'` → exige `transportadora` e `numeroNf` preenchidos (trim); caso contrário lança `BadRequestException`.
   - `'CORREIOS'` → exige `numeroNf` preenchido; caso contrário lança `BadRequestException`.
   - `null` / outros → sem validação de campos de despacho.
8. **MISTO + ENTREGUE/DESPACHADO com COM_TECNICO/DESPACHADO:** exige que **todos** os rastreadores dos kits tenham entrada em `PedidoRastreadorAparelho`; caso contrário lança `BadRequestException` com contagem faltante.
8. **Débitos:** `PedidosRastreadoresProprietarioDebitoHelper.consolidarDebitoSeProprietarioMudou` chama `DebitosRastreadoresService.consolidarDebitoTx` quando proprietário/cliente de origem e destino diferem e o aparelho tem `marca`/`modelo` (strings). Resolução de IDs de marca/modelo no banco usa **cache por par (marca, modelo) dentro da mesma transação** para evitar N+1. Destino não-MISTO usa os helpers em `pedidos-rastreadores-destino.helpers.ts`. Em pedido não-MISTO + `DESPACHADO`, a atualização de ownership do aparelho segue a mesma condição de antes (inclui exigência de `marca`/`modelo` no aparelho). `pedidoId` segue sendo passado ao histórico de débito.
10. **SIM vinculado:** replica o mesmo `novoStatusAparelho` no SIM vinculado (`simVinculadoId`).
11. Toda lógica de aparelhos, kits e débitos ocorre **dentro de `prisma.$transaction`**.

**`updateDespacho`:**
- `findOne` + `prisma.pedidoRastreador.update`; cada campo do DTO é aplicado só se não for `undefined`; `transportadora` e `numeroNf` são `trim()` — string vazia vira `null`.

**`updateKitIds`:**
- `findOne` → `prisma.pedidoRastreador.update({ data: { kitIds } })`.

**`remove`:**
- `findOne` + `prisma.pedidoRastreador.delete`; filhos com `onDelete: Cascade` no schema são removidos automaticamente (histórico, itens, vínculos aparelho).

**`PEDIDO_RASTREADOR_INCLUDE_BASE` (`pedidos-rastreadores-include.ts`):**
- Shape de includes padrão: `tecnico`, `cliente`, `subcliente`, `deCliente`, `marcaEquipamento`, `modeloEquipamento`, `operadora`, `criadoPor`, `itens` (com `cliente`, `marcaEquipamento`, `modeloEquipamento`, `operadora`).
- `findOne` faz spread desse objeto e adiciona `historico` (50 registros, desc).

**Integrações com outros domínios:**

- **`DebitosRastreadoresService`:** consumido por `PedidosRastreadoresProprietarioDebitoHelper`; `consolidarDebitoTx` é chamado dentro da transação de `updateStatus` quando há mudança de proprietário elegível.
- **`Kit`:** `kitConcluido` sincronizado em `updateStatus` nos dois sentidos.
- **`Aparelho` / `AparelhoHistorico`:** status de rastreadores e SIMs nos kits atualizados em `updateStatus`.

**Testes unitários (`server/test/unit/pedidos-rastreadores/`):**

| Arquivo | Escopo |
|---------|--------|
| `pedidos-rastreadores.service.spec.ts` | `findAll`, `findOne`, `create`, `updateStatus` (incl. idempotência, MISTO, débito com cache marca/modelo, destino CLIENTE/subcliente/TECNICO+DTO, `bulkSetDestinatarios`, `getAparelhosDestinatarios`, `removeAparelhoDestinatario`, `updateKitIds`, `remove`) |
| `pedidos-rastreadores.controller.spec.ts` | Delegação do controller ao service |

O módulo de teste do service registra `PedidosRastreadoresProprietarioDebitoHelper` e mock de `DebitosRastreadoresService` (`consolidarDebitoTx`).

