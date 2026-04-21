# Context — Nexus System

Ver índice em `AGENTS.md`.

### Domínio: `aparelhos`

**Arquivos do módulo (`server/src/aparelhos/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `aparelhos.module.ts` | Registra controller + services; importa `PrismaModule`, `UsersModule`, `DebitosRastreadoresModule` |
| `aparelhos.controller.ts` | Rotas em `/aparelhos`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('aparelhos')` |
| `aparelhos.service.ts` | Listagem, detalhe, resumo, criação individual, atualização de status, listagem para testes |
| `lotes.service.ts` | Criação de lote + aparelhos em massa; lotes disponíveis para pareamento |
| `kits.service.ts` | CRUD de kits; mover aparelho para kit; aparelhos disponíveis para kit |
| `pareamento.service.ts` | Preview e execução do pareamento rastreador+SIM |
| `dto/create-lote.dto.ts` | Criação em lote — ver campos abaixo |
| `dto/create-individual.dto.ts` | Entrada avulsa — ver campos abaixo |
| `dto/update-status.dto.ts` | PATCH de status |
| `dto/pareamento-preview.dto.ts` | Preview (`ParDto`: imei + iccid) |
| `dto/pareamento.dto.ts` | Execução pareamento (pares + lotes/manual + proprietário) |
| `dto/update-aparelho-kit.dto.ts` | `kitId` opcional/null (`@ValidateIf` para `@IsNumber` só quando não null) |
| `dto/create-kit.dto.ts` | `nome` string |

**`CreateIndividualDto` — campos relevantes:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `origem` | `'RETIRADA_CLIENTE' \| 'DEVOLUCAO_TECNICO' \| 'COMPRA_AVULSA'` | Origem do aparelho |
| `statusEntrada` | `'NOVO_OK' \| 'EM_MANUTENCAO' \| 'CANCELADO_DEFEITO'` | Estado físico na entrada |
| `responsavelEntrega` | `string?` | Quem entregou |
| `observacoes` | `string?` | |
| `proprietario` | `ProprietarioTipo` (`INFINITY \| CLIENTE`) | — |
| `notaFiscal` | `string?` | |
| `categoriaFalha` | `string?` | Só quando defeito |
| `destinoDefeito` | `string?` | Só quando defeito |
| `abaterDebitoId` | `number?` | ID do `DebitoRastreador` a decrementar |

**`CreateLoteDto` — campos adicionais:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `abaterDebitoId` | `number?` | ID do débito a abater |
| `abaterQuantidade` | `number?` | Quantidade a abater do débito |

**`PareamentoDto`:** controller aplica `?? 'INFINITY'` em `proprietario` caso não enviado (default no controller, não no DTO).

**Endpoints e permissões** (`PermissionsGuard` exige **todas** com AND):

| Método | Path | Permissões |
|--------|------|------------|
| GET | `/aparelhos` | `CONFIGURACAO.APARELHO.LISTAR` |
| GET | `/aparelhos/resumo` | `CONFIGURACAO.APARELHO.LISTAR` |
| GET | `/aparelhos/para-testes` | `AGENDAMENTO.TESTES.LISTAR` **+** `AGENDAMENTO.OS.LISTAR` |
| GET | `/aparelhos/pareamento/lotes-rastreadores` | `CONFIGURACAO.APARELHO.LISTAR` |
| GET | `/aparelhos/pareamento/lotes-sims` | `CONFIGURACAO.APARELHO.LISTAR` |
| GET | `/aparelhos/:id` | `CONFIGURACAO.APARELHO.LISTAR` |
| POST | `/aparelhos/lote` | `CONFIGURACAO.APARELHO.CRIAR` |
| POST | `/aparelhos/individual` | `CONFIGURACAO.APARELHO.CRIAR` |
| PATCH | `/aparelhos/:id/status` | `CONFIGURACAO.APARELHO.EDITAR` |
| POST | `/aparelhos/pareamento/preview` | `CONFIGURACAO.APARELHO.LISTAR` |
| POST | `/aparelhos/pareamento` | `CONFIGURACAO.APARELHO.CRIAR` |
| GET | `/aparelhos/pareamento/kits/detalhes` | `CONFIGURACAO.APARELHO.LISTAR` |
| GET | `/aparelhos/pareamento/kits/:id` | `CONFIGURACAO.APARELHO.LISTAR` |
| PATCH | `/aparelhos/pareamento/aparelho/:id/kit` | `CONFIGURACAO.APARELHO.EDITAR` |
| GET | `/aparelhos/pareamento/aparelhos-disponiveis` | `CONFIGURACAO.APARELHO.LISTAR` |
| POST | `/aparelhos/pareamento/kits` | `CONFIGURACAO.APARELHO.CRIAR` |

> `CONFIGURACAO.APARELHO.EXCLUIR` existe em `permission-codes.ts` mas **nenhuma rota** o usa hoje.

**Enums relevantes:**

- `TipoAparelho`: `RASTREADOR` | `SIM`
- `StatusAparelho`: `EM_ESTOQUE` | `CONFIGURADO` | `DESPACHADO` | `COM_TECNICO` | `INSTALADO`
- `ProprietarioTipo`: `INFINITY` | `CLIENTE`
- `Plataforma`: `GETRAK` | `GEOMAPS` | `SELSYN` (domínio de equipamentos/plataformas)

**Modelos Prisma (campos-chave):**

- `Aparelho`: `id`, `tipo` (`TipoAparelho`), `identificador`, `status` (`StatusAparelho`), `proprietario` (`ProprietarioTipo`), `clienteId`, `marca`, `modelo`, `operadora`, `marcaSimcardId`, `planoSimcardId`, `loteId`, `valorUnitario`, `tecnicoId`, `kitId`, `simVinculadoId`, `observacao`, `subclienteId`, `veiculoId`, `criadoEm`, `atualizadoEm`.
- `LoteAparelho`: `id`, `referencia`, `notaFiscal`, `dataChegada`, `tipo`, `proprietario`, `clienteId`, `marca`, `modelo`, `operadora`, `marcaSimcardId`, `planoSimcardId`, `quantidade`, `valorUnitario`, `valorTotal`, `criadoEm`.
- `AparelhoHistorico`: `id`, `aparelhoId`, `statusAnterior`, `statusNovo`, `observacao`, `criadoEm`.
- `Kit`: `id`, `nome` (unique), `criadoEm`, `kitConcluido`, relação `aparelhos`.

**Regras de negócio críticas:**

- SIM é **sempre** proprietário `INFINITY` — `clienteId` e abate de débito são ignorados na criação.
- `identificador` deve ser único (validado via `findFirst` antes de criar avulso).
- `updateStatus` em rastreador com `simVinculadoId` **replica** status e histórico no SIM vinculado (mesma transação).
- Pareamento: IMEI/ICCID normalizados (só dígitos, 1–50 chars); após pareamento SIM permanece `INFINITY`; mudança de proprietário do rastreador pode gerar `consolidarDebitoTx` se marca/modelo existirem no catálogo.
- Lote com `identificadores` preenchido: quantidade efetiva = tamanho do array; abate de débito aplica só nos primeiros N itens.
- Kit aceita apenas `RASTREADOR`; aparelho disponível para kit: `status=CONFIGURADO`, sem `kitId`, sem `tecnicoId`.
- `PedidoRastreador` com `kitIds` JSON pode bloquear entrada no kit (valida modelo/marca/operadora do SIM e cliente).


---

**Testes unitários (`server/test/unit/aparelhos/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `aparelhos.controller.spec.ts` | Delegação controller → services; parsing de ids; preview com/sem pares; `createKit` trim |
| `aparelhos.service.spec.ts` | `findParaTestes`, `findAll`, `findOne`, `createIndividual`, `updateStatus`, `getResumo` |
| `kits.service.spec.ts` | `getKitById`, `updateAparelhoKit`, `criarOuBuscarKitPorNome` |
| `lotes.service.spec.ts` | `createLote` (quantidade, SIM, identificadores), `getLotesParaPareamento` |
| `pareamento.service.spec.ts` | `pareamentoPreview`, `pareamento` (transação, débitos, SIM/lote/manual) |

> **Divergência conhecida:** `aparelhos.controller.spec.ts` espera `kitId`/`kitNome` no `pareamento` do controller, mas o controller atual não os envia. Teste possivelmente desatualizado.
> **Divergência conhecida:** `AparelhosPage.tsx` e `EquipamentosPage.tsx` chamam `GET /aparelhos/pareamento/kits` — rota **inexistente** no backend (existe `/kits/detalhes`, `/kits/:id`, `POST /kits`). Pode gerar 404.

