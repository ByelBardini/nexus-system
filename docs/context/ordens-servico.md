# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `ordens-servico`

**Arquivos do módulo (`server/src/ordens-servico/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `ordens-servico.module.ts` | Registra controller + services; importa `PrismaModule`, `UsersModule`, `DebitosRastreadoresModule`; providers: `OrdensServicoService`, `HtmlOrdemServicoGenerator`, `PdfOrdemServicoGenerator` |
| `ordens-servico.controller.ts` | Rotas em `/ordens-servico`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('ordens-servico')` |
| `ordens-servico.service.ts` | CRUD, listagem, atualização de status/aparelho, geração de HTML/PDF, lógica de negócio de testes |
| `html-ordem-servico.generator.ts` | Gera string HTML completa da OS para impressão |
| `pdf-ordem-servico.generator.ts` | Gera PDF via Puppeteer — ver detalhes abaixo |

**`PdfOrdemServicoGenerator` — Puppeteer:**
- Browser **headless singleton lazy** (criado na primeira chamada, compartilhado entre requisições).
- Args: `--no-sandbox`, `--disable-setuid-sandbox` (necessário em ambientes containerizados).
- `waitUntil: 'networkidle0'` ao carregar HTML.
- Timeout: `PDF_TIMEOUT_MS = 30000` (30 s).
- `page` sempre fechada no `finally` (sem leak de aba).
- `onModuleDestroy` fecha o browser (cleanup em desligamento do NestJS).
| `dto/create-ordem-servico.dto.ts` | Criação de OS + subcliente inline; define `CreateSubclienteDto` |
| `dto/update-ordem-servico.dto.ts` | `idEntrada?`, `aparelhoEncontrado?` |
| `dto/update-status.dto.ts` | `status`, `observacao?`, `localInstalacao?`, `posChave?` |
| `dto/update-id-aparelho.dto.ts` | `idAparelho: string` |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/ordens-servico/resumo` | `AGENDAMENTO.OS.LISTAR` |
| GET | `/ordens-servico/cliente-infinity` | `AGENDAMENTO.OS.LISTAR` |
| GET | `/ordens-servico/testando` | `AGENDAMENTO.TESTES.LISTAR` **+** `AGENDAMENTO.OS.LISTAR` |
| GET | `/ordens-servico` | `AGENDAMENTO.OS.LISTAR` |
| GET | `/ordens-servico/:id/impressao` | `AGENDAMENTO.OS.LISTAR` |
| GET | `/ordens-servico/:id/pdf` | `AGENDAMENTO.OS.LISTAR` |
| GET | `/ordens-servico/:id` | `AGENDAMENTO.OS.LISTAR` |
| POST | `/ordens-servico` | `AGENDAMENTO.OS.CRIAR` |
| PATCH | `/ordens-servico/:id` | `AGENDAMENTO.OS.EDITAR` |
| PATCH | `/ordens-servico/:id/status` | `AGENDAMENTO.OS.EDITAR` |
| PATCH | `/ordens-servico/:id/aparelho` | `AGENDAMENTO.TESTES.EXECUTAR` **+** `AGENDAMENTO.OS.EDITAR` |

**Máquina de estados (`TRANSICOES_VALIDAS`):**

```
AGENDADO          → EM_TESTES, CANCELADO
EM_TESTES         → TESTES_REALIZADOS, AGENDADO, CANCELADO
TESTES_REALIZADOS → AGUARDANDO_CADASTRO, AGENDADO, CANCELADO
AGUARDANDO_CADASTRO → FINALIZADO, AGENDADO, CANCELADO
FINALIZADO        → (nenhuma)
CANCELADO         → AGENDADO
```

> Exceção: OS do tipo `RETIRADA` permite `AGENDADO → AGUARDANDO_CADASTRO` diretamente (sem passar por testes).

**`GET /ordens-servico` — query params:**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `page` | `number?` | Default 1 |
| `limit` | `number?` | Default 15, max 100 |
| `status` | `StatusOS?` | Filtro exato |
| `search` | `string?` | Busca em: `numero` (se numérico), `cliente.nome`, `subcliente.nome`, `veiculo.placa`, `tecnico.nome` |

**`GET /ordens-servico/testando` — diferenças:**

- Retorna apenas OS com `status = EM_TESTES`; sem paginação.
- Inclui campo calculado `tempoEmTestesMin` (minutos desde entrada em `EM_TESTES`, via `OSHistorico`).
- Busca `search` adicional: `subclienteSnapshotNome`, `idAparelho`, `idEntrada`.
- OS do tipo `RETIRADA`: os campos `veiculo`, `subcliente` e `subclienteSnapshotNome` são zerados no retorno (não há veículo/subcliente a exibir).

**`POST /ordens-servico` — lógica de criação (`CreateOrdemServicoDto`):**

| Campos enviados | Comportamento |
|----------------|--------------|
| `subclienteCreate` preenchido | Cria novo `Subcliente` + OS em transação; snapshot capturado de `subclienteCreate` |
| `subclienteId` + `subclienteUpdate` | Atualiza subcliente existente + cria OS em transação; snapshot capturado de `subclienteUpdate` |
| `subclienteId` (sem update) | Busca subcliente e captura snapshot atual; cria OS |
| Nenhum dos anteriores | Cria OS sem subcliente; sem snapshot |

- `numero` gerado via `MAX(numero) + 1` dentro da transação (sem sequence).
- Retry automático (até 5×) em caso de erro `P2002` (unique constraint race condition no `numero`).
- `status` default: `AGENDADO`.
- `idAparelho` e `localInstalacao` recebem `.trim()` na persistência.

**`PATCH /:id/status` — efeitos colaterais em `updateStatus`:**

1. Valida transição via `TRANSICOES_VALIDAS` (lança `BadRequestException` se inválida).
2. Ao transitar para `AGUARDANDO_CADASTRO`: grava `statusCadastro = AGUARDANDO`.
3. Campo `localInstalacao`/`posChave`: em OS do tipo `REVISAO`, vai para `localInstalacaoEntrada`/`posChaveEntrada` (não sobrescreve campos de emissão).
4. Campo `observacao`: prefixado com `"Observações do Teste:"` e concatenado a `os.observacoes` existente.
5. Ao transitar para `TESTES_REALIZADOS` em `REVISAO` ou `RETIRADA` — **aparelho de saída** (`idAparelho`): se existir e estiver vinculado ao mesmo `veiculoId` da OS, muda status para `COM_TECNICO`, desvincula `veiculoId` e `subclienteId`, cria `AparelhoHistorico`.
6. Ao transitar para `TESTES_REALIZADOS` em `INSTALACAO_*` ou `REVISAO` — **aparelho novo** (rastreador `idAparelho` ou `idEntrada` em REVISAO): muda status para `INSTALADO` e replica no SIM vinculado; cria `AparelhoHistorico` para ambos.
7. Débito: se rastreador novo tem `proprietario = INFINITY` ou `proprietario = CLIENTE` mas `clienteId ≠ os.clienteId`, chama `debitosService.consolidarDebitoTx` com `devedorClienteId = os.clienteId` e `credorClienteId` do aparelho. Lança `BadRequestException` se marca/modelo não encontrados no catálogo.

**`PATCH /:id/aparelho` — `updateIdAparelho`:**

- OS do tipo `REVISAO`: grava em `idEntrada` (não `idAparelho`); auto-resolve `iccidEntrada` buscando o `simVinculado.identificador` do aparelho.
- Demais tipos: grava em `idAparelho`.

**`GET /:id/impressao` e `GET /:id/pdf`:**

- `/impressao`: retorna HTML com `Content-Type: text/html; charset=utf-8`.
- `/pdf`: retorna `StreamableFile` com `Content-Type: application/pdf`; filename `ordem-servico-{numero}.pdf`; gerado via Puppeteer (singleton de browser no processo NestJS).

**`GET /cliente-infinity`:**

- Retorna `{ clienteId: number }`.
- Busca cliente com `id = CLIENTE_INFINITY_ID`; fallback por `nome = 'Infinity'`; fallback cria o registro.
- Usa transação `Serializable` com retry automático (5× em `P2034` — serialization failure).

**`GET /resumo`:**

- Retorna contagens: `{ agendado, emTestes, testesRealizados, aguardandoCadastro, finalizado }`.
- **Não** conta `CANCELADO`.

**Snapshot de subcliente (campos na OS):**

Todos os campos abaixo são gravados no momento da criação da OS e não se alteram com mudanças posteriores no subcliente:

`subclienteSnapshotNome`, `subclienteSnapshotCep`, `subclienteSnapshotLogradouro`, `subclienteSnapshotNumero`, `subclienteSnapshotComplemento`, `subclienteSnapshotBairro`, `subclienteSnapshotCidade`, `subclienteSnapshotEstado`, `subclienteSnapshotCpf`, `subclienteSnapshotEmail`, `subclienteSnapshotTelefone`, `subclienteSnapshotCobrancaTipo`.

**Modelo Prisma `OrdemServico` (campos-chave):**

`id`, `numero` (unique, auto-incrementado via MAX+1), `tipo` (`TipoOS`), `status` (`StatusOS`), `statusCadastro` (`StatusCadastro?`), `clienteId`, `subclienteId?`, `veiculoId?`, `tecnicoId?`, `criadoPorId?`, `concluidoPorId?`, `concluidoEm?`, `idAparelho?`, `idEntrada?`, `iccidEntrada?`, `localInstalacao?`, `localInstalacaoEntrada?`, `posChave?`, `posChaveEntrada?`, `aparelhoEncontrado?` (bool), `observacoes?`, `subclienteSnapshot*` (12 campos), `criadoEm`, `atualizadoEm`.

**`OSHistorico`:** `id`, `ordemServicoId`, `statusAnterior`, `statusNovo`, `observacao?`, `criadoEm`.

**Frontend — páginas do domínio:**

| Arquivo | Função |
|---------|--------|
| `client/src/pages/OrdensServicoPage.tsx` | Lista principal de OS; filtros por status/search; paginação |
| `client/src/pages/ordens-servico/OrdensServicoCriacaoPage.tsx` | Criação de OS com seleção de subcliente/create/update inline |
| `client/src/pages/testes/TestesPage.tsx` | Bancada de testes; ver seção **"Página: TestesPage — Bancada de Testes"** para detalhes completos |

**`OrdensServicoCriacaoPage` — detalhes de implementação:**

Permissão exigida: `AGENDAMENTO.OS.CRIAR` (via `hasPermission` de `useAuth`). Sem ela o botão "Emitir Ordem" fica desabilitado.

**Modos de ordem (`ordemInstalacao`):**

| Valor | Comportamento |
|-------|--------------|
| `INFINITY` | `clienteId` resolvido via `GET /ordens-servico/cliente-infinity`; subclientes listados do cliente Infinity; `cobrancaTipo` fixado em `"INFINITY"` |
| `CLIENTE` | `clienteId` selecionado via `SelectClienteSearch`; subclientes do cliente selecionado; campo de cobrança (`INFINITY` / `CLIENTE`) visível |

**Fluxo de subcliente:**

- `SubclienteNomeAutocomplete` permite selecionar existente ou criar novo. `isNovoSubcliente` + `subclienteId` controlam o branch.
- Seleção de existente → preenche todos os campos do formulário (snapshot do cadastro). Ao submeter com dados alterados, gera `subclienteUpdate` (atualiza cadastro + grava snapshot na OS).
- Novo subcliente → gera `subclienteCreate` se `nome + cep + cidade + estado + telefone (≥10 dígitos)` preenchidos.
- `subclienteCreate` e `subclienteUpdate` têm a mesma forma; ao enviar `subclienteCreate`, `subclienteId` é omitido.

**Veículo:**

- `InputPlaca` dispara `useConsultaPlaca` (debounce implícito no hook). Sucesso preenche `marca/modelo/ano/cor/tipo` automaticamente via `toast.success`.
- Antes de criar a OS, a página chama `POST /veiculos/criar-ou-buscar` com `{ placa, marca, modelo, ano, cor }` para obter `veiculoId`. Falha nessa chamada não bloqueia a criação (continua sem `veiculoId`).
- Validação Zod: se `veiculoPlaca` preenchida, os quatro campos complementares são obrigatórios.

**Tipos de serviço (`tipo`):**

| Valor | Notas |
|-------|-------|
| `INSTALACAO_COM_BLOQUEIO` | Default ao clicar "Instalação" |
| `INSTALACAO_SEM_BLOQUEIO` | Sub-opção de instalação |
| `REVISAO` | Exibe seção "ID Instalado / Local de Instalação / Pós Chave" |
| `RETIRADA` | Idem acima |

Mapeamento `tipoToPrecoKey` converte `tipo` → chave em `PrecoTecnico` para exibir preço do técnico.

**Formulário (react-hook-form + Zod):**

- Schema: `client/src/pages/ordens-servico/OrdensServicoCriacaoPage.tsx` (inline, `z.object(...).refine(...)`).
- Validação mínima para habilitar "Emitir Ordem": `temCliente` (subcliente completo + cliente resolvido) **E** `temTipo`.
- `temTecnico` e `temVeiculo` contribuem apenas para o checklist visual na sidebar — não bloqueiam submissão.

**Sidebar fixa (resumo + checklist):**

- `fixed top-20 right-0 w-96` — posicionada fora do scroll principal; `pr-96` no container garante que o conteúdo não fique atrás da sidebar.
- Exibe: cliente selecionado, técnico, veículo (placa + marca + modelo), tipo de serviço.
- Checklist: Dados do Cliente ✓, Técnico Selecionado ✓, Dados do Veículo ✓, Tipo de Serviço ✓.
- Campo KM para calcular deslocamento (preço/km × km estimado). Cálculo é **visual apenas** — não enviado na criação da OS.
- Valor total aproximado = preço do serviço + total deslocamento.

**Queries e mutações:**

| queryKey | Endpoint | Uso |
|----------|----------|-----|
| `["clientes", "subclientes"]` | `GET /clientes?subclientes=1` | Lista clientes + seus subclientes (modo CLIENTE) |
| `["ordens-servico", "cliente-infinity"]` | `GET /ordens-servico/cliente-infinity` | Resolve ID do cliente Infinity |
| `["clientes", clienteInfinityId, "subclientes"]` | `GET /clientes/:id` | Subclientes do cliente Infinity |
| `["tecnicos"]` | `GET /tecnicos` | Lista técnicos com preços |
| `["aparelhos"]` | `GET /aparelhos` | Filtra rastreadores `INSTALADO` com identificador preenchido para campo "ID Instalado" |

Mutação `POST /ordens-servico` invalida `["ordens-servico"]`; se `subclienteUpdate` presente, invalida também `["clientes"]`. Sucesso navega para `/`.

**Componentes especializados usados:**

`InputPlaca`, `InputCEP` (preenche endereço via ViaCEP ao perder foco), `InputTelefone`, `InputCPFCNPJ`, `SelectUF` + `SelectCidade` (dados via `useBrasilAPI`), `SelectTecnicoSearch` (busca por nome/cidade/estado), `SelectClienteSearch`, `SubclienteNomeAutocomplete`, `IdAparelhoSearch`.

**Testes unitários (`server/test/unit/ordens-servico/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `ordens-servico.controller.spec.ts` | Delegação controller → service; parsing de ids; `findTestando` com/sem search; `updateIdAparelho` trim; `getPdf` retorna `StreamableFile` |
| `ordens-servico.service.spec.ts` | `findAll` (paginação, filtros), `findOne` (NotFoundException), `create` (todos os fluxos de subcliente), `updateStatus` (máquina de estados, efeitos em aparelhos, débitos), `updateIdAparelho` (REVISAO vs demais), `getResumo`, `getClienteInfinityOuCriar`, `findTestando` |
| `html-ordem-servico.generator.spec.ts` | Geração de HTML por tipo de OS |

---

