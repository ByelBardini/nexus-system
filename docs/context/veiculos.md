# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `veiculos`

**Arquivos do módulo (`server/src/veiculos/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `veiculos.module.ts` | Registra controller + service; importa `PrismaModule`, `UsersModule`; **não exporta** o service |
| `veiculos.controller.ts` | Rotas em `/veiculos`; `@UseGuards(PermissionsGuard)` no controller; `@ApiTags('veiculos')`; `criarOuBuscar` repassa o body como `CriarOuBuscarVeiculoDto` direto ao service (sem remapear campos) |
| `veiculos.service.ts` | `findAll`, `consultaPlaca`, `criarOuBuscarPorPlaca`; usa lib externa `api-placa-fipe`; assinatura `criarOuBuscarPorPlaca(dados: CriarOuBuscarVeiculoDto)` |
| `veiculos.helpers.ts` | `normalizarPlaca(placa)` e `placaNormalizadaOuNull(placa)` — regra única de placa para service e testes |
| `dto/criar-ou-buscar-veiculo.dto.ts` | `placa` (MinLength 7 no **texto bruto** do body), `marca`, `modelo`, `ano`, `cor` (todos `string`, MinLength 1) |

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
| `consultaPlaca(placa)` | `{ marca, modelo, ano, cor, tipo } \| null` | Chama `api-placa-fipe` com placa retornada por `placaNormalizadaOuNull`; se inválida, não chama a API e retorna `null`; lança `BadGatewayException` se a lib lançar |
| `criarOuBuscarPorPlaca(dados)` | `Veiculo \| null` | `upsert` por placa normalizada; `update: {}` (não sobrescreve dados existentes); retorna `null` se `placaNormalizadaOuNull` for `null` |

**Helpers (`veiculos.helpers.ts`):**

| Função | Comportamento |
|--------|----------------|
| `normalizarPlaca` | Remove caracteres não alfanuméricos, maiúsculas, **máx. 7 caracteres** (trunca o excedente) |
| `placaNormalizadaOuNull` | Aplica `normalizarPlaca`; retorna `null` se o resultado tiver **menos de 7** caracteres; caso contrário retorna a string normalizada |

`consultaPlaca` e `criarOuBuscarPorPlaca` usam **apenas** `placaNormalizadaOuNull` (não duplicam a checagem).

**Regras de negócio críticas:**

- **DTO vs normalização:** o `CriarOuBuscarVeiculoDto` exige `@MinLength(7)` na **string enviada** no JSON. É possível passar na validação uma placa com 7+ caracteres que, após remover separadores, vire **menos de 7** alfanuméricos — nesse caso o service retorna `null` e **não** chama o `upsert` (comportamento assíncrono com o pipe de validação).
- `criarOuBuscarPorPlaca`: `update: {}` — **nunca** atualiza um veículo já existente; apenas retorna o cadastro atual. Ideal para fluxo de criação de OS onde o veículo pode já existir.
- `ano`: recebido como `string` no DTO (`CriarOuBuscarVeiculoDto`), convertido para `Int` via `parseInt`; `NaN` vira `0`.
- Sem rota de atualização (`PATCH`) nem exclusão (`DELETE`) — veículos são imutáveis após criação.
- Dependência externa: `api-placa-fipe` — deve ser **mockada** em testes via `jest.mock('api-placa-fipe', ...)`.
- **POST** sem `@HttpCode`: resposta de sucesso do Nest para `POST` é **201** por padrão (incluindo quando o handler retorna `null`).

**Testes unitários (`server/test/unit/veiculos/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `veiculos.helpers.spec.ts` | `normalizarPlaca` e `placaNormalizadaOuNull` (separadores, truncagem, entradas curtas, edge `A-B-C-1-2`, etc.) |
| `veiculos.controller.spec.ts` | `findAll`; `consultaPlaca`; `criarOuBuscar` (delega o mesmo objeto DTO ao service; `null`) |
| `veiculos.service.spec.ts` | `findAll`; `consultaPlaca` (inclui `BadGatewayException` quando a API falha); `criarOuBuscarPorPlaca` (placa curta, normalização insuficiente após strip, upsert) |

**Testes E2E (`server/test/veiculos.e2e-spec.ts`):**

- Módulo isolado: `VeiculosModule` + `ConfigModule`; `PermissionsGuard` substituído por guard que libera tudo (padrão semelhante a `equipamentos.e2e-spec.ts`).
- `api-placa-fipe` mockada no arquivo.
- Usa Prisma real: placas de teste com prefixo `E2EV7`; `afterAll` faz `deleteMany` em `placa` `startsWith: 'E2EV7'`.
- Rodar só este arquivo: `npx jest --config ./test/jest-e2e.json test/veiculos.e2e-spec.ts` (requer `DATABASE_URL` válido).

---
