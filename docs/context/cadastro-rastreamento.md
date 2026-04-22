# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `cadastro-rastreamento`

**Arquivos do módulo (`server/src/cadastro-rastreamento/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `cadastro-rastreamento.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule` (`UsersModule` é necessário porque `PermissionsGuard` injeta `UsersService` para resolver permissões) |
| `cadastro-rastreamento.controller.ts` | Rotas em `/cadastro-rastreamento`; `@UseGuards(PermissionsGuard)` no controller; `:id` nas rotas PATCH usa `ParseIntPipe` (string não numérica → 400, validação strict de inteiro) |
| `cadastro-rastreamento.service.ts` | `findPendentes`, `iniciarCadastro`, `concluirCadastro` e métodos privados por `TipoOS`; criação de `OSHistorico` na conclusão centralizada em `_criarHistoricoConclusaoCadastro` (chamada dentro de cada `$transaction` de conclusão) |
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

> **Atenção:** o service só aplica filtro de `criadoEm` quando **as duas** datas (`dataInicio` e `dataFim`) vêm preenchidas; se apenas uma for enviada, o intervalo é ignorado (comportamento silencioso no backend).

> **Atenção:** `findPendentes` retorna `{ data, total }` — **não** inclui `page`, `limit` nem `totalPages` no objeto de resposta (diferente do helper `paginate` padrão).

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/cadastro-rastreamento` | `CADASTRO_RASTREAMENTO.LISTAR` |
| PATCH | `/cadastro-rastreamento/:id/iniciar` | `CADASTRO_RASTREAMENTO.EDITAR` |
| PATCH | `/cadastro-rastreamento/:id/concluir` | `CADASTRO_RASTREAMENTO.EDITAR` |

**Parâmetro `:id`:** resolvido com `ParseIntPipe` — `id` deve ser um inteiro em string (sem decimais, sem espaços; ver comportamento do Nest). Evita `NaN` no service.

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
- Cada conclusão bem-sucedida cria **exatamente um** registro em `oSHistorico` com `statusAnterior=AGUARDANDO_CADASTRO` e `statusNovo=FINALIZADO` (lógica compartilhada no service).
- `REVISAO` exige `idEntrada` preenchido na OS; lança `BadRequestException` se ausente.
- Se aparelho não existe no banco durante `RETIRADA` ou `REVISAO` (aparelho antigo), ele é **criado automaticamente** com `status=EM_ESTOQUE` e `observacao='aparelho usado'`.
- A função auxiliar `normIdent` (interna ao service) normaliza strings: `trim()` + retorna `null` se vazio.

### Frontend (`client/src/pages/cadastro-rastreamento/` e `client/src/lib/`)

| Recurso | Notas |
|---------|--------|
| `CadastroRastreamentoPage.tsx` | Lista OS do endpoint GET; painel de ação, filtros, cópia para área de transferência; inicia/conclui via PATCH. |
| `lib/cadastro-rastreamento-tipo-mappers.ts` | Mapeia `os.tipo` (string da API) para categoria de UI (`CADASTRO` / `REVISAO` / `RETIRADA` / `OUTRO`). Tipos desconhecidos caem em **`OUTRO`** (não se assume retirada). Rótulos de serviço, botões e toasts de “iniciar” (`toastIniciado`) ficam centralizados aqui para testes e evitar mensagens inválidas (ex.: concatenação `…do!`). |
| `lib/cadastro-rastreamento-periodo.ts` | Monta `dataInicio` / `dataFim` em ISO para a query (ver doc específica se existir). |

**Mapeamento `TipoOS` → UI:** apenas `INSTALACAO_COM_BLOQUEIO`, `INSTALACAO_SEM_BLOQUEIO`, `REVISAO` e `RETIRADA` têm categoria explícita; qualquer outro valor vindo do backend usa `OUTRO` com rótulo derivado do enum (ex.: `NOVO_TIPO` → texto legível) e estilo neutro na tela.

### Testes

- **Backend:** `server/test/unit/cadastro-rastreamento/` — service (incl. `findPendentes` enriquecido, conclusão por tipo, histórico), controller, e `cadastro-rastreamento-id-param.pipe.spec.ts` (`ParseIntPipe` / bordas de `:id`).
- **Frontend:** `client/src/__tests__/lib/cadastro-rastreamento-tipo-mappers.test.ts` (mapeamento, rótulos, regressão de toasts).

---

