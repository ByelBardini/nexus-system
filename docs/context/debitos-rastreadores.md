# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `debitos-rastreadores`

**Arquivos do módulo (`server/src/debitos-rastreadores/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `debitos-rastreadores.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`; **exporta `DebitosRastreadoresService`** (consumido por `AparelhosModule`, `PedidosRastreadoresModule`, `OrdensServicoModule`, etc.) |
| `debitos-rastreadores.controller.ts` | Rotas em `/debitos-rastreadores`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('debitos-rastreadores')`; `GET :id` usa `ParseIntPipe` |
| `debitos-rastreadores.service.ts` | `findAll`, `findOne`, `consolidarDebitoTx` (método transacional exportado para outros serviços) |
| `debito-rastreador.include.ts` | Include Prisma compartilhado: relações `devedorCliente` / `credorCliente` / `marca` / `modelo`; `buildDebitoRastreadorFindInclude(incluirHistoricos)` adiciona ou omite `historicos` aninhados |
| `dto/list-debitos.dto.ts` | Query params de listagem; validação `page`/`limit` ≥ 1; filtros por tipo de proprietário; flag `incluirHistoricos` |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/debitos-rastreadores` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` |
| GET | `/debitos-rastreadores/:id` | `AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR` |

> Não há rotas de criação, edição ou exclusão: débitos são gerados exclusivamente via `consolidarDebitoTx` chamado por outros serviços (ex.: `PedidosRastreadoresProprietarioDebitoHelper`, `pareamento.service`, `lotes.service`, `aparelhos.service`, `ordem-servico-status-side-effects.service`).

**`ListDebitosDto` — query params:**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `page` | `number?` | Default `1` no service; validação **`>= 1`** |
| `limit` | `number?` | Default `100` no service; validação **`>= 1`**; máximo absoluto `500` |
| `devedorTipo` | `ProprietarioTipo?` | Filtro exato (`INFINITY` \| `CLIENTE`) |
| `credorTipo` | `ProprietarioTipo?` | Filtro exato |
| `devedorClienteId` | `number?` | Filtro exato |
| `credorClienteId` | `number?` | Filtro exato |
| `marcaId` | `number?` | Filtro exato |
| `modeloId` | `number?` | Filtro exato |
| `status` | `'aberto' \| 'quitado'?` | `aberto` → `quantidade > 0`; `quitado` → `quantidade <= 0` |
| `incluirHistoricos` | `boolean?` | Query: `true` / `false` (strings aceitas após transform). **Default `false`** — listagem não carrega histórico por linha (menos carga). Use `true` quando a UI precisar de movimentações (ex.: página de débitos equipamentos). |

**`findAll` — inclui no retorno:**
- Sempre: `devedorCliente` `{ id, nome }`, `credorCliente` `{ id, nome }`, `marca` `{ id, nome }`, `modelo` `{ id, nome }` (definidos em `debito-rastreador.include.ts`).
- **Somente se `incluirHistoricos=true`:** `historicos` (ordenados por `criadoEm asc`) com join em `pedido { id, codigo }`, `lote { id, referencia }`, `aparelho { id, identificador }`, `ordemServico { id, numero }`.
- Ordenação: `atualizadoEm desc`.

**`findOne` — inclui:** mesmas quatro relações de cliente/marca/modelo que o include base (**sem** históricos). Lança `NotFoundException` se não encontrado.

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
   - Se existir com `quantidade > 0` e **`delta` ≤ saldo reverso** → **decrementa** o reverso em `delta`, um histórico no registro reverso com `delta = -delta`.
   - Se existir com `quantidade > 0` e **`delta` > saldo reverso** → **zera** o reverso (`quantidade = 0`); histórico no registro reverso com `delta = -saldoReverso`; calcula `remainder = delta - saldoReverso` e, se `remainder > 0`, **incrementa ou cria** o débito no sentido **direto** com `remainder`, com **segundo** histórico `delta = +remainder` (mesmos metadados `pedidoId` / `loteId` / `aparelhoId` / `ordemServicoId` nos dois lançamentos).
   - Se não existir reverso com saldo > 0 → busca débito no sentido **direto**.
     - Se existir → **incrementa** (`delta`).
     - Se não existir → **cria** novo registro com `quantidade = delta`.
     - Grava **um** `HistoricoDebitoRastreador` com `delta` positivo no `debitoId` do sentido direto.
3. Nos fluxos com um único lançamento no fim (abatimento parcial/total sem estouro, ou sentido direto sem reverso), aplica-se um único `HistoricoDebitoRastreador` como acima.

> **Atenção:** Upsert direto do Prisma não é usado porque campos nullable em chave única não suportam `upsert` no MySQL — o código faz `findFirst` + `update`/`create` manualmente.

**Modelos Prisma (campos-chave):**

- `DebitoRastreador`: `id`, `devedorTipo` (`ProprietarioTipo`), `devedorClienteId` (null = Infinity), `credorTipo`, `credorClienteId`, `marcaId`, `modeloId`, `quantidade`, `criadoEm`, `atualizadoEm`.
- `HistoricoDebitoRastreador`: `id`, `debitoId`, `pedidoId?`, `loteId?`, `aparelhoId?`, `ordemServicoId?`, `delta` (positivo = nova dívida no sentido do registro alvo, negativo = abatimento no registro reverso), `criadoEm`.

**Quem chama `consolidarDebitoTx`:**

- `pareamento.service` — pareamento com mudança de proprietário.
- `PedidosRastreadoresProprietarioDebitoHelper` — transição de status do pedido quando o proprietário do aparelho muda.
- `lotes.service` — cadastro em lote com abate de débito.
- `aparelhos.service` — cadastro individual com abate de débito.
- `ordem-servico-status-side-effects.service` — efeitos colaterais de status de OS quando aplicável.
- Sempre **dentro de** `prisma.$transaction` (`Prisma.TransactionClient`).

**Testes unitários (`server/test/unit/debitos-rastreadores/`):**

| Arquivo | Conteúdo |
|---------|----------|
| `debitos-rastreadores.service.spec.ts` | `consolidarDebitoTx` (auto-dívida, criação, incremento, abate reverso parcial/total, **delta maior que saldo** com zera + resto no sentido direto, incremento do direto existente, metadados nos dois históricos); `findAll` (defaults, **sem** `historicos` por padrão, **com** `incluirHistoricos`, filtros por tipo, `totalPages` com cap 500); `findOne` + include compartilhado |
| `list-debitos.dto.spec.ts` | `page`/`limit` mínimos, enums, `incluirHistoricos`, `status` |
| `debitos-rastreadores.controller.spec.ts` | Delegação `findAll` / `findOne` |
| `debito-rastreador.include.spec.ts` | Shape do include com e sem histórico |

| Cenário coberto (service — resumo) |
|-----------------------------------|
| Não cria débito quando devedor = credor (mesmo tipo e clienteId) |
| Não cria quando ambos são `INFINITY` |
| Cria novo registro quando não há débito nem reverso |
| Incrementa débito direto existente |
| Abate reverso quando `delta` ≤ saldo |
| Quando `delta` > saldo reverso: zera reverso, cria/incrementa direto com resto e dois históricos |
| Não abate reverso com saldo 0 — cria novo débito direto |
| Histórico positivo/negativo e rastreabilidade (`pedidoId`, `loteId`, `aparelhoId`, `ordemServicoId`) |

---
