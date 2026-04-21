# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `cadastro-rastreamento`

**Arquivos do módulo (`server/src/cadastro-rastreamento/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `cadastro-rastreamento.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule` |
| `cadastro-rastreamento.controller.ts` | Rotas em `/cadastro-rastreamento`; `@UseGuards(PermissionsGuard)` no controller |
| `cadastro-rastreamento.service.ts` | `findPendentes`, `iniciarCadastro`, `concluirCadastro` e métodos privados por `TipoOS` |
| `dto/find-pendentes-query.dto.ts` | Query params — ver campos abaixo |
| `dto/concluir-cadastro.dto.ts` | Body de conclusão: `plataforma` (`Plataforma`, obrigatório) |

**`FindPendentesQueryDto` — campos:**

| Param | Tipo | Notas |
|-------|------|-------|
| `page` | `number?` | Default 1 |
| `limit` | `number?` | Default 20; máximo 100 |
| `statusCadastro` | `StatusCadastro?` | Filtro exato; sem ele traz `AGUARDANDO` sempre + `EM_CADASTRO`/`CONCLUIDO` opcionalmente via OR/AND |
| `plataforma` | `Plataforma?` | Filtro exato (`GETRAK`, `GEOMAPS`, `SELSYN`) |
| `dataInicio` | `Date?` | Convertido via `@Type(() => Date)`; aplica-se a `criadoEm` |
| `dataFim` | `Date?` | Idem; **exclusivo** (comparação `<`) |

> **Atenção:** `findPendentes` retorna `{ data, total }` — **não** inclui `page`, `limit` nem `totalPages` no objeto de resposta (diferente do helper `paginate` padrão).

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/cadastro-rastreamento` | `CADASTRO_RASTREAMENTO.LISTAR` |
| PATCH | `/cadastro-rastreamento/:id/iniciar` | `CADASTRO_RASTREAMENTO.EDITAR` |
| PATCH | `/cadastro-rastreamento/:id/concluir` | `CADASTRO_RASTREAMENTO.EDITAR` |

**Fluxo de estados (`StatusOS` × `StatusCadastro`):**

```
StatusOS: AGUARDANDO_CADASTRO  →  FINALIZADO
StatusCadastro: AGUARDANDO  →  EM_CADASTRO  →  CONCLUIDO
```

- `iniciarCadastro`: exige `StatusOS.AGUARDANDO_CADASTRO` + `StatusCadastro.AGUARDANDO`; move para `EM_CADASTRO`.
- `concluirCadastro`: exige `StatusCadastro.EM_CADASTRO`; move OS para `StatusOS.FINALIZADO` + `StatusCadastro.CONCLUIDO`; grava `OSHistorico`; registra `concluidoEm` e `concluidoPorId` (via `@CurrentUser('id')`).
- Tipos de OS **sem suporte** a cadastro lançam `BadRequestException`.

**Lógica de conclusão por `TipoOS` (método privado separado para cada):**

| Tipo OS | Método | Comportamento de aparelhos |
|---------|--------|---------------------------|
| `INSTALACAO_COM_BLOQUEIO` / `INSTALACAO_SEM_BLOQUEIO` | `_concluirInstalacao` | Aparelho `idAparelho` (IMEI) → `status=INSTALADO`, vincula `subclienteId` + `veiculoId` |
| `REVISAO` | `_concluirRevisao` | Aparelho antigo (`idAparelho`) → `EM_ESTOQUE`, desvincula subcliente/veículo; aparelho novo (`idEntrada`) → `INSTALADO`, vincula subcliente/veículo. Se aparelho antigo não existe no DB, cria-o com `observacao='aparelho usado'` |
| `RETIRADA` | `_concluirRetirada` | Aparelho (`idAparelho` ou `idEntrada`, tentativa nessa ordem) → `EM_ESTOQUE`, desvincula subcliente/veículo. Se não existe, cria com `observacao='aparelho usado'` |

**Semântica dos campos `idAparelho` / `idEntrada` na OS por tipo:**

| `TipoOS` | `idAparelho` | `idEntrada` |
|----------|-------------|------------|
| `INSTALACAO_*` | aparelho que **entra** no veículo | — |
| `REVISAO` | aparelho **antigo** (sai) | aparelho **novo** (entra) — obrigatório |
| `RETIRADA` | aparelho que **sai** (preferido) | fallback se `idAparelho` vazio |

**`findPendentes` — comportamento de filtro:**

- Retorna apenas OS onde `statusCadastro IS NOT NULL`.
- Sem `statusCadastro` no query: traz `AGUARDANDO` sempre + `EM_CADASTRO`/`CONCLUIDO` opcionalmente combinados com `dataInicio`/`dataFim` (via `OR`/`AND`).
- Com `statusCadastro` no query: filtra exato; `dataInicio`/`dataFim` aplicam-se a `criadoEm`.
- Paginação: `page` mínimo 1, `limit` máximo 100 (default 20).
- Inclui relações: `cliente`, `subcliente`, `tecnico`, `veiculo`, `criadoPor`, `concluidoPor`.
- Enriquece cada OS com `aparelhoEntrada` e `aparelhoSaida` (marca, modelo, iccid, operadora, marcaNome, planoMb) buscando `Aparelho` por `identificador` com join `simVinculado.marcaSimcard.operadora` + `planoSimcard`.

**Regras de negócio críticas:**

- Toda alteração de aparelho na conclusão ocorre dentro de `prisma.$transaction`.
- `REVISAO` exige `idEntrada` preenchido na OS; lança `BadRequestException` se ausente.
- Se aparelho não existe no banco durante `RETIRADA` ou `REVISAO` (aparelho antigo), ele é **criado automaticamente** com `status=EM_ESTOQUE` e `observacao='aparelho usado'`.
- A função auxiliar `normIdent` (interna ao service) normaliza strings: `trim()` + retorna `null` se vazio.
- Não há testes unitários para este domínio ainda (`server/test/unit/cadastro-rastreamento/` inexistente).

---

