# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `equipamentos`

**Arquivos do módulo (`server/src/equipamentos/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `equipamentos.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`; **exporta `EquipamentosService`** |
| `equipamentos.controller.ts` | Rotas em `/equipamentos`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('equipamentos')` |
| `equipamentos.service.ts` | CRUD completo de 5 sub-recursos: marcas, modelos, operadoras, marcas-simcard, planos-simcard |
| `dto/create-marca.dto.ts` | `nome: string` (MaxLength 100) |
| `dto/update-marca.dto.ts` | `nome?: string`, `ativo?: boolean` |
| `dto/create-modelo.dto.ts` | `nome: string`, `marcaId: number`, `minCaracteresImei?: number` |
| `dto/update-modelo.dto.ts` | `nome?: string`, `ativo?: boolean`, `minCaracteresImei?: number` |
| `dto/create-operadora.dto.ts` | `nome: string` (MaxLength 100) |
| `dto/update-operadora.dto.ts` | `nome?: string` |
| `dto/create-marca-simcard.dto.ts` | `nome: string`, `operadoraId: number`, `temPlanos?: boolean`, `minCaracteresIccid?: number` |
| `dto/update-marca-simcard.dto.ts` | `nome?`, `operadoraId?`, `temPlanos?`, `ativo?`, `minCaracteresIccid?` |
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
- `ModeloEquipamento`: `id`, `nome`, `marcaId`, `ativo`, `minCaracteresImei?`. Unique: `(marcaId, nome)`.
- `Operadora`: `id`, `nome` (unique).
- `MarcaSimcard`: `id`, `nome`, `operadoraId`, `temPlanos` (bool), `ativo`, `minCaracteresIccid?`. Unique: `(operadoraId, nome)`.
- `PlanoSimcard`: `id`, `marcaSimcardId`, `planoMb`, `ativo`. Unique: `(marcaSimcardId, planoMb)`.

**Regras de negócio críticas:**

- Unicidade validada via `assertUnique` (helper privado) antes de criar/editar — lança `ConflictException` se conflito.
- `findAllMarcas` inclui `_count: { modelos }` no retorno.
- `findAllMarcasSimcard` inclui apenas `planos` com `ativo=true`; `findOneMarcaSimcard` inclui todos os planos.
- `createPlanoSimcard` executa em `prisma.$transaction`: cria o plano e seta `marcaSimcard.temPlanos = true` atomicamente.
- `deletePlanoSimcard` é **soft delete** (`ativo=false`), não hard delete. Após desativar, conta planos ainda ativos: se zero, atualiza `marcaSimcard.temPlanos = false`.
- Unique key `(marcaSimcardId, planoMb)` é composta — Prisma a referencia como `marcaSimcardId_planoMb` no `findUnique`.
- `updateMarcaSimcard` valida nova `operadoraId` antes de checar unicidade do nome (lança `NotFoundException` se operadora não existe).

**Testes unitários (`server/test/unit/equipamentos/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `equipamentos.controller.spec.ts` | Delegação e parsing de id para marcas, modelos e operadoras; filtros `marcaId`/`operadoraId` em listagens; CRUD de marcas-simcard. **Sem cobertura de PlanoSimcard no controller** |
| `equipamentos.service.spec.ts` | CRUD completo de marcas, modelos, operadoras, marcas-simcard e planos-simcard; `NotFoundException` e `ConflictException`; `createPlanoSimcard` usa transação e atualiza `temPlanos`; `deletePlanoSimcard` desativa e atualiza `temPlanos` quando sem planos ativos |

> **Gap conhecido:** `equipamentos.controller.spec.ts` não testa as rotas de `planos-simcard`.

---

