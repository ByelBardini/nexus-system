# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `equipamentos`

**Arquivos do módulo (`server/src/equipamentos/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `equipamentos.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`; **exporta `EquipamentosService`** |
| `equipamentos.controller.ts` | Rotas em `/equipamentos`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('equipamentos')`. **IDs de rota** (`:id`) usam `ParseIntPipe` — valor não inteiro → **400** (Bad Request). **Query opcionais** `marcaId`, `operadoraId`, `marcaSimcardId` usam `ParseIntPipe({ optional: true })` — ausente = ok; string inválida → **400** |
| `equipamentos.service.ts` | CRUD completo de 5 sub-recursos: marcas, modelos, operadoras, marcas-simcard, planos-simcard |
| `dto/create-marca.dto.ts` | `nome: string` (MaxLength 100) |
| `dto/update-marca.dto.ts` | `nome?: string`, `ativo?: boolean` |
| `dto/create-modelo.dto.ts` | `nome: string`, `marcaId: number`, `quantidadeCaracteresImei?: number` |
| `dto/update-modelo.dto.ts` | `nome?: string`, `ativo?: boolean`, `quantidadeCaracteresImei?: number` |
| `dto/create-operadora.dto.ts` | `nome: string` (MaxLength 100) |
| `dto/update-operadora.dto.ts` | `nome?: string`, `ativo?: boolean` |
| `dto/create-marca-simcard.dto.ts` | `nome: string`, `operadoraId: number`, `temPlanos?: boolean`, `quantidadeCaracteresIccid?: number` |
| `dto/update-marca-simcard.dto.ts` | `nome?`, `operadoraId?`, `temPlanos?`, `ativo?`, `quantidadeCaracteresIccid?` |
| `dto/create-plano-simcard.dto.ts` | `marcaSimcardId: number`, `planoMb: number` |
| `dto/update-plano-simcard.dto.ts` | `planoMb?: number`, `ativo?: boolean` |

**Endpoints e permissões** (todos usam `CONFIGURACAO.EQUIPAMENTO.*`):

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/equipamentos/marcas` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| GET | `/equipamentos/marcas/:id` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| POST | `/equipamentos/marcas` | `CONFIGURACAO.EQUIPAMENTO.CRIAR` |
| PATCH | `/equipamentos/marcas/:id` | `CONFIGURACAO.EQUIPAMENTO.EDITAR` |
| DELETE | `/equipamentos/marcas/:id` | `CONFIGURACAO.EQUIPAMENTO.EXCLUIR` |
| GET | `/equipamentos/modelos` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| GET | `/equipamentos/modelos/:id` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| POST | `/equipamentos/modelos` | `CONFIGURACAO.EQUIPAMENTO.CRIAR` |
| PATCH | `/equipamentos/modelos/:id` | `CONFIGURACAO.EQUIPAMENTO.EDITAR` |
| DELETE | `/equipamentos/modelos/:id` | `CONFIGURACAO.EQUIPAMENTO.EXCLUIR` |
| GET | `/equipamentos/operadoras` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| GET | `/equipamentos/operadoras/:id` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| POST | `/equipamentos/operadoras` | `CONFIGURACAO.EQUIPAMENTO.CRIAR` |
| PATCH | `/equipamentos/operadoras/:id` | `CONFIGURACAO.EQUIPAMENTO.EDITAR` |
| DELETE | `/equipamentos/operadoras/:id` | `CONFIGURACAO.EQUIPAMENTO.EXCLUIR` |
| GET | `/equipamentos/marcas-simcard` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| GET | `/equipamentos/marcas-simcard/:id` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| POST | `/equipamentos/marcas-simcard` | `CONFIGURACAO.EQUIPAMENTO.CRIAR` |
| PATCH | `/equipamentos/marcas-simcard/:id` | `CONFIGURACAO.EQUIPAMENTO.EDITAR` |
| DELETE | `/equipamentos/marcas-simcard/:id` | `CONFIGURACAO.EQUIPAMENTO.EXCLUIR` |
| GET | `/equipamentos/planos-simcard` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| GET | `/equipamentos/planos-simcard/:id` | `CONFIGURACAO.EQUIPAMENTO.LISTAR` |
| POST | `/equipamentos/planos-simcard` | `CONFIGURACAO.EQUIPAMENTO.CRIAR` |
| PATCH | `/equipamentos/planos-simcard/:id` | `CONFIGURACAO.EQUIPAMENTO.EDITAR` |
| DELETE | `/equipamentos/planos-simcard/:id` | `CONFIGURACAO.EQUIPAMENTO.EXCLUIR` |

**Query params opcionais de listagem:**

| Endpoint | Param | Comportamento |
|----------|-------|--------------|
| `GET /modelos` | `marcaId` | Filtra por marca |
| `GET /marcas-simcard` | `operadoraId` | Filtra por operadora |
| `GET /planos-simcard` | `marcaSimcardId` | Filtra por marca de simcard |

**Modelos Prisma (campos-chave):**

- `MarcaEquipamento`: `id`, `nome` (unique), `ativo`, `modelos[]`.
- `ModeloEquipamento`: `id`, `nome`, `marcaId`, `ativo`, `quantidadeCaracteresImei?`. Unique: `(marcaId, nome)`.
- `Operadora`: `id`, `nome` (unique).
- `MarcaSimcard`: `id`, `nome`, `operadoraId`, `temPlanos` (bool), `ativo`, `quantidadeCaracteresIccid?`. Unique: `(operadoraId, nome)`.
- `PlanoSimcard`: `id`, `marcaSimcardId`, `planoMb`, `ativo`. Unique: `(marcaSimcardId, planoMb)`.

**Regras de negócio críticas:**

- Unicidade validada via `assertUnique` (helper privado) antes de criar/editar — lança `ConflictException` se conflito.
- `findAllMarcas` inclui `_count: { modelos }` no retorno.
- `findAllMarcasSimcard` inclui apenas `planos` com `ativo=true`; `findOneMarcaSimcard` inclui todos os planos.
- `createPlanoSimcard` executa em `prisma.$transaction`: cria o plano e seta `marcaSimcard.temPlanos = true` atomicamente.
- `deletePlanoSimcard` é **soft delete** (`ativo=false`), não hard delete. Após desativar, conta planos ainda ativos: se zero, atualiza `marcaSimcard.temPlanos = false`.
- Unique key `(marcaSimcardId, planoMb)` é composta — Prisma a referencia como `marcaSimcardId_planoMb` no `findUnique`.
- `updateMarcaSimcard`: se `dto.operadoraId` vier no PATCH, valida existência da operadora (`NotFoundException` se não existir). **Unicidade `(operadoraId, nome)`** é verificada **sempre** com o par efetivo após o merge (`operadoraIdFinal` / `nomeFinal`) — inclui alteração só de `operadoraId`, só de `nome`, só de `ativo`, etc.; evita conflito com outra marca da mesma operadora que já use o mesmo nome.

**Testes (`server/test/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `unit/equipamentos/equipamentos.controller.spec.ts` | Delegação ao service com **ids numéricos** (espelho do contrato pós-`ParseIntPipe` na rota HTTP); filtros opcionais `marcaId` / `operadoraId` / `marcaSimcardId`; marcas, modelos, operadoras, marcas-simcard e **planos-simcard** |
| `unit/equipamentos/equipamentos.service.spec.ts` | CRUD completo; `updateMarcaSimcard` inclui conflito ao mudar **só** `operadoraId`, sucesso só com `operadoraId`, e validação de unicidade ao alterar **só** `ativo` |
| `equipamentos.e2e-spec.ts` | Smoke de validação HTTP: `GET .../marcas/:id` com id não numérico → 400; `GET .../modelos?marcaId=xyz` → 400; `GET .../planos-simcard?marcaSimcardId=bad` → 400; listagem de modelos sem query → 200 |

---

