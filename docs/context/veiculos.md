# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `veiculos`

**Arquivos do módulo (`server/src/veiculos/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `veiculos.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`; **não exporta** o service |
| `veiculos.controller.ts` | Rotas em `/veiculos`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('veiculos')` |
| `veiculos.service.ts` | `findAll`, `consultaPlaca`, `criarOuBuscarPorPlaca`; usa lib externa `api-placa-fipe` |
| `dto/criar-ou-buscar-veiculo.dto.ts` | `placa` (MinLength 7), `marca`, `modelo`, `ano`, `cor` (todos `string`, MinLength 1) |

**Endpoints e permissões:**

| Método | Path | Permissão |
|--------|------|-----------|
| GET | `/veiculos` | `AGENDAMENTO.OS.LISTAR` |
| POST | `/veiculos/criar-ou-buscar` | `AGENDAMENTO.OS.CRIAR` |
| GET | `/veiculos/consulta-placa/:placa` | `AGENDAMENTO.OS.CRIAR` |

**Modelo Prisma `Veiculo` (campos-chave):**

`id`, `placa` (unique, VarChar 10), `marca` (VarChar 100), `modelo` (VarChar 100), `ano` (`Int?`), `cor` (`String?`, VarChar 50). Relações: `ordensServico OrdemServico[]`, `aparelhos Aparelho[]`. Tabela: `veiculos`.

**Métodos do `VeiculosService`:**

| Método | Retorno | Notas |
|--------|---------|-------|
| `findAll(search?)` | `Veiculo[]` | Filtra por `placa contains search` (trim; ignora se só espaços); ordena `placa asc`; **cap fixo de 50 registros** |
| `consultaPlaca(placa)` | `{ marca, modelo, ano, cor, tipo } \| null` | Chama `api-placa-fipe`; normaliza placa antes; retorna `null` se `< 7 chars` ou API retornar null; lança `BadGatewayException` em falha de rede |
| `criarOuBuscarPorPlaca(dados)` | `Veiculo \| null` | `upsert` por `placa`; `update: {}` (não sobrescreve dados existentes); retorna `null` se `< 7 chars` |

**Regras de negócio críticas:**

- **`normalizarPlaca`** (privada): remove qualquer char não alfanumérico, converte para maiúsculas, trunca em 7 chars. Aplicada em **todos** os métodos antes de usar a placa.
- `criarOuBuscarPorPlaca`: `update: {}` — **nunca** atualiza um veículo já existente; apenas retorna o cadastro atual. Ideal para fluxo de criação de OS onde o veículo pode já existir.
- `ano`: recebido como `string` no DTO (`CriarOuBuscarVeiculoDto`), convertido para `Int` via `parseInt`; `NaN` vira `0`.
- Sem rota de atualização (`PATCH`) nem exclusão (`DELETE`) — veículos são imutáveis após criação.
- Dependência externa: `api-placa-fipe` — deve ser **mockada** em testes via `jest.mock('api-placa-fipe', ...)`.

**Testes unitários (`server/test/unit/veiculos/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `veiculos.controller.spec.ts` | `findAll` (sem/com search); `consultaPlaca` (delegação e retorno null) — **`criarOuBuscar` não testado no controller** |
| `veiculos.service.spec.ts` | `findAll` (sem filtro, com search, search só espaços, cap 50); `consultaPlaca` (placa curta, vazia, normalização, null da API, mapeamento completo, fallback `anoFabricacao`, campos ausentes); `criarOuBuscarPorPlaca` (placa curta, existente, nova, campos) |

---

