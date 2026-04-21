# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `debitos-rastreadores`

**Arquivos do módulo (`server/src/debitos-rastreadores/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `debitos-rastreadores.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`; **exporta `DebitosRastreadoresService`** (consumido por `AparelhosModule`) |
| `debitos-rastreadores.controller.ts` | Rotas em `/debitos-rastreadores`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('debitos-rastreadores')` |
| `debitos-rastreadores.service.ts` | `findAll`, `findOne`, `consolidarDebitoTx` (método transacional exportado para outros serviços) |
| `dto/list-debitos.dto.ts` | Query params de listagem; `status?: 'aberto' | 'quitado'` |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/debitos-rastreadores` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` |
| GET | `/debitos-rastreadores/:id` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` |

> Não há rotas de criação, edição ou exclusão: débitos são gerados exclusivamente via `consolidarDebitoTx` chamado por outros serviços (ex.: `PedidosRastreadoresService`, `pareamento.service`).

**`ListDebitosDto` — query params:**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `page` | `number?` | Default `1` |
| `limit` | `number?` | Default `100`; máximo absoluto `500` |
| `devedorClienteId` | `number?` | Filtro exato |
| `credorClienteId` | `number?` | Filtro exato |
| `marcaId` | `number?` | Filtro exato |
| `modeloId` | `number?` | Filtro exato |
| `status` | `'aberto' \| 'quitado'?` | `aberto` → `quantidade > 0`; `quitado` → `quantidade <= 0` |

**`findAll` — inclui no retorno:**
- `devedorCliente` `{ id, nome }`, `credorCliente` `{ id, nome }`, `marca` `{ id, nome }`, `modelo` `{ id, nome }`.
- `historicos` (ordenados por `criadoEm asc`) com join em `pedido { id, codigo }`, `lote { id, referencia }`, `aparelho { id, identificador }`, `ordemServico { id, numero }`.
- Ordenação: `atualizadoEm desc`.

**`findOne` — inclui:** `devedorCliente`, `credorCliente`, `marca`, `modelo` (sem históricos). Lança `NotFoundException` se não encontrado.

**Interface `ConsolidarDebitoParams`:**

```ts
interface ConsolidarDebitoParams {
  devedorTipo: ProprietarioTipo;       // 'INFINITY' | 'CLIENTE'
  devedorClienteId: number | null;
  credorTipo: ProprietarioTipo;
  credorClienteId: number | null;
  marcaId: number;
  modeloId: number;
  delta: number;                        // quantidade de aparelhos
  pedidoId?: number | null;
  loteId?: number | null;
  aparelhoId?: number | null;
  ordemServicoId?: number | null;
}
```

**`consolidarDebitoTx(tx, params)` — algoritmo:**

1. Se `devedorTipo === credorTipo && devedorClienteId === credorClienteId` → retorna sem fazer nada (sem auto-dívida).
2. Busca débito no sentido **inverso** (`devedorTipo`↔`credorTipo`, `devedorClienteId`↔`credorClienteId`, mesma marca/modelo).
   - Se existir com `quantidade > 0` → **decrementa** o reverso (`delta`), registra histórico com `delta = -delta` (devolução).
   - Se não existir (ou saldo ≤ 0) → busca débito no sentido **direto**.
     - Se existir → **incrementa** (`delta`).
     - Se não existir → **cria** novo registro com `quantidade = delta`.
3. Sempre grava um `HistoricoDebitoRastreador` com o `debitoId` resultante e os IDs de rastreabilidade (`pedidoId`, `loteId`, `aparelhoId`, `ordemServicoId` — `null` quando não informados).

> **Atenção:** Upsert direto do Prisma não é usado porque campos nullable em chave única não suportam `upsert` no MySQL — o código faz `findFirst` + `update`/`create` manualmente.

**Modelos Prisma (campos-chave):**

- `DebitoRastreador`: `id`, `devedorTipo` (`ProprietarioTipo`), `devedorClienteId` (null = Infinity), `credorTipo`, `credorClienteId`, `marcaId`, `modeloId`, `quantidade`, `criadoEm`, `atualizadoEm`.
- `HistoricoDebitoRastreador`: `id`, `debitoId`, `pedidoId?`, `loteId?`, `aparelhoId?`, `ordemServicoId?`, `delta` (positivo = nova dívida, negativo = devolução), `criadoEm`.

**Quem chama `consolidarDebitoTx`:**

- `pareamento.service` (`server/src/aparelhos/`) — durante pareamento de rastreadores com mudança de proprietário.
- Potencialmente `PedidosRastreadoresService` (`server/src/pedidos-rastreadores/`) durante transição de status.
- Sempre chamado **dentro de uma transação Prisma** existente (`Prisma.TransactionClient`).

**Testes unitários (`server/test/unit/debitos-rastreadores/debitos-rastreadores.service.spec.ts`):**

| Cenário coberto |
|----------------|
| Não cria débito quando devedor = credor (mesmo tipo e clienteId) |
| Não cria quando ambos são `INFINITY` |
| Cria novo registro quando não há débito nem reverso |
| Incrementa débito direto existente |
| Abate (decrementa) dívida reversa existente com saldo > 0 |
| Não abate reverso com saldo 0 — cria novo débito direto |
| Histórico com `delta` positivo ao criar / negativo ao abater reverso |
| Rastreabilidade: `pedidoId`, `loteId`, `aparelhoId`, `ordemServicoId` propagados ao histórico |
| `findAll` — paginação, filtros por `devedorClienteId`/`credorClienteId`, `status aberto/quitado`, cap de 500 |
| `findOne` — retorno correto e `NotFoundException` |

---

