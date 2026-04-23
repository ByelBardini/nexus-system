# Context — Nexus System

Ver índice em `AGENTS.md`.

## Backend (`server/`)

- **Entrada de módulos:** `server/src/app.module.ts` — lista feature modules e guards globais (`JwtAuthGuard`, `ThrottlerGuard`).
- **Padrão por domínio:** `server/src/<domínio>/` — `*.module.ts`, `*.controller.ts`, `*.service.ts`; DTOs e tipos junto do domínio quando existirem.
- **Infra compartilhada:** `server/src/prisma/`, `server/src/auth/` (guards, estratégias), `server/src/common/`.

### Configuração de boot (`main.ts` / `app.module.ts`)

**`main.ts`**

| Configuração | Valor / detalhe |
|-------------|----------------|
| `ValidationPipe` global | `whitelist: true`, `transform: true` (class-transformer ativo; `@Type()` nos DTOs é obrigatório para conversão de tipos) |
| CORS | Apenas `http://localhost:5173` e `http://127.0.0.1:5173`; `credentials: true` |
| Swagger | Montado em **`/api`** com `DocumentBuilder` + `addBearerAuth()` |
| Logger | `nestjs-pino`; `app.useLogger(app.get(Logger))` |
| Prefixo global | **Nenhum** — rotas começam diretamente em `/auth`, `/users`, etc. |

**`app.module.ts`**

| Configuração | Valor / detalhe |
|-------------|----------------|
| `ConfigModule` | `forRoot({ isGlobal: true })` — disponível em todo app sem importar |
| **Throttler** | Dois buckets: `short` → 100 req / 60 s; `medium` → 300 req / 300 s. `ThrottlerGuard` é `APP_GUARD` global |
| **Pino** | `LoggerModule.forRoot` com `pinoHttp.autoLogging: false` — **não loga cada HTTP request** automaticamente |
| `JwtAuthGuard` | Segundo `APP_GUARD` global — protege todas as rotas exceto `@Public()` |
| `PermissionsGuard` | **Não** é global — aplicado por controller via `@UseGuards(PermissionsGuard)` |

**Rota de health check:** `GET /` com `@Public()` → `AppService.getHello()` → `"Hello World!"`.

**Armadilhas de roteamento (importante):** Certos controllers declaram `@Get(':id')` antes de rotas estáticas de um segmento. O NestJS resolve por ordem de declaração no arquivo — um path como `GET /roles/users` pode ser capturado por `:id = "users"` (um único segmento após `/roles`). No **`RolesController`**, `:id` e `:userId` usam **`ParseIntPipe`**: esse caso devolve **400** (id não inteiro), em vez de chegar ao Prisma com `NaN`. Ainda assim, ao adicionar novas rotas **estáticas** de um segmento em controllers que tenham `@Get(':id')`, prefira declarar a rota estática **antes** do `:id`. Outro ponto de atenção: sub-rotas de `/aparelhos/pareamento`.

---

### Prisma (dados e CLI)

- **Versão:** Prisma 7. O `datasource` em `server/prisma/schema.prisma` declara apenas `provider = "mysql"`; a **URL** vem de `server/prisma.config.ts` (`defineConfig` + `datasource.url`), não fica duplicada no `.schema`.
- **Diretório de trabalho:** Rodar qualquer comando `prisma` a partir de **`server/`** (ou `npm run <script> --prefix server`). Caminhos no config são relativos a `server/`: `prisma/schema.prisma`, `prisma/migrations`, seed `npx ts-node prisma/seed.ts`.
- **`DATABASE_URL`:** Obrigatório no formato **`mysql://`** (validação no `prisma.config.ts`). O config tenta `dotenv` em `server/.env` e na raiz do repo; se a URL vier “crua” no arquivo, há fallback que extrai uma linha `mysql://...`.
- **Runtime (NestJS):** `PrismaService` (`server/src/prisma/prisma.service.ts`) estende `PrismaClient` e implementa `OnModuleInit` (`$connect()`) e `OnModuleDestroy` (`$disconnect()`). No construtor lê `DATABASE_URL` via `config.getOrThrow` (falha no boot se ausente) e passa as credenciais ao adapter `PrismaMariaDb`. A função interna `parseDatabaseUrl` substitui `mysql://` por `mariadb://` e usa a API nativa `URL` para extrair `host`, `port` (default 3306), `user`, `password` e `database` (pathname sem barras). O adapter é criado com `acquireTimeout: 30000` (30 s). `PrismaModule` é **`@Global()`** — injete `PrismaService` nos services dos domínios; **nunca** importe `PrismaModule` diretamente nos módulos de domínio, pois já está disponível globalmente.
- **Cliente gerado:** `generator client { provider = "prisma-client-js" }`. Imports: `@prisma/client`. Delegates em **camelCase** a partir do model (ex.: model `OrdemServico` → `prisma.ordemServico`).
- **Nomes no código vs. banco:** Models e campos em português no schema; **tabelas e colunas SQL** usam `@@map` / `@map` em **snake_case** (ex.: `Usuario` → tabela `usuarios`, `senhaHash` → `senha_hash`). Em SQL manual ou leitura de migration, usar sempre o nome mapeado.
- **`migration_lock.toml`:** `provider = "mysql"` (alinhado ao datasource).

**Modelos (lista compacta — detalhes no schema):**

`Usuario`, `Setor`, `Cargo`, `Permissao`, `CargoPermissao`, `UsuarioCargo`, `RegistroAuditoria`, `Cliente`, `ContatoCliente`, `Subcliente`, `Tecnico`, `PrecoTecnico`, `Veiculo`, `OrdemServico`, `OSHistorico`, `MarcaEquipamento`, `ModeloEquipamento`, `Operadora`, `MarcaSimcard`, `PlanoSimcard`, `Kit`, `Aparelho`, `LoteAparelho`, `AparelhoHistorico`, `PedidoRastreador`, `PedidoRastreadorHistorico`, `PedidoRastreadorItem`, `PedidoRastreadorAparelho`, `DebitoRastreador`, `HistoricoDebitoRastreador`.

Enums principais incluem `SetorUsuario`, `CategoriaCargo`, `TipoContrato`, `StatusCliente`, `GeocodingPrecision`, `TipoOS`, `StatusOS`, `StatusCadastro`, `Plataforma`, `TipoAparelho`, `StatusAparelho`, `ProprietarioTipo`, `TipoDestinoPedido`, `StatusPedidoRastreador`, `UrgenciaPedido` — ver `schema.prisma` para valores.

**Enums locais (duplicam Prisma — atenção ao editar):**

| Arquivo | Enum local | Enum Prisma equivalente |
|---------|-----------|------------------------|
| `clientes/dto/create-cliente.dto.ts` | `TipoContrato`, `StatusCliente` | `TipoContrato`, `StatusCliente` (Prisma) |
| `users/dto/create-user.dto.ts`, `users/dto/update-user.dto.ts` | — | `SetorUsuario` no `@IsEnum` importado de `@prisma/client` (**sem** literais duplicados) |
| `aparelhos/dto/create-individual.dto.ts` | `ORIGEM_VALORES`, `STATUS_ENTRADA_VALORES`, `PROPRIETARIO_VALORES` (consts, não enums Prisma) | — |

> Ao renomear valores de enums Prisma, verifique também as cópias locais nos DTOs acima.

> **Clientes — update:** `clientes/dto/update-cliente.dto.ts` não duplica enums; `UpdateClienteDto` deriva de `CreateClienteDto` com `PartialType` + `OmitType` (`@nestjs/swagger`), e `UpdateContatoDto` estende `ContatoDto`. Alterações de enum ficam em `create-cliente.dto.ts` (ver também `docs/context/clientes.md`).

**Scripts (`server/package.json`):**

| Script | Uso |
|--------|-----|
| `npm run prisma:generate --prefix server` | Regenerar o client após mudanças no schema |
| `npm run prisma:migrate --prefix server` | `prisma migrate dev` — desenvolvimento |
| `npm run prisma:seed --prefix server` | `prisma db seed` → `prisma/seed.ts` |
| `npm run prisma:sync-permissions --prefix server` | Só permissões: upsert de `permission-codes.ts`, remove códigos obsoletos (`sync-permissions.ts`) |
| `npm run prisma:studio --prefix server` | Prisma Studio |

**Seed e permissões:** `server/prisma/seed.ts` usa o mesmo adapter MariaDB, sobe setores, permissões a partir de `server/prisma/permission-codes.ts`, cargo admin, etc. Ao **adicionar ou renomear códigos de permissão**, atualize `permission-codes.ts` e rode **`prisma:sync-permissions`** (ou o seed completo) — o sync também **apaga** permissões que saíram da lista (efeito em cascata nas relações conforme o schema).

**Testes:** Em unitários, mock do client: `server/test/unit/helpers/prisma-mock.ts` (`createPrismaMock`).

### Domínios (pastas em `server/src/`)

`auth`, `users`, `roles`, `clientes`, `tecnicos`, `veiculos`, `ordens-servico`, `aparelhos`, `equipamentos`, `pedidos-rastreadores`, `debitos-rastreadores`, `cadastro-rastreamento`, `common` (ex.: geocoding).

---

### Infra compartilhada: `common`

**`server/src/common/constants.ts`**

| Constante | Valor | Onde é usada |
|-----------|-------|-------------|
| `CLIENTE_INFINITY_ID` | `1` | Filtrado de listagens de clientes (`clientes.service`); ID do cliente reservado para aparelhos próprios da Infinity |
| `PRAZO_EXPIRACAO_SENHA_MESES` | `6` | Prazo para nova `senhaExpiradaEm` após `trocarSenha` (`auth.service`) |

---

**`server/src/common/pagination.helper.ts`**

Utilitário central de paginação — usar sempre que o endpoint retornar lista paginada.

| Símbolo | Tipo | Descrição |
|---------|------|-----------|
| `PaginateParams` | interface | `{ page?: number; limit?: number }` |
| `PaginateOptions` | interface | `{ maxLimit?: number; defaultLimit?: number }` — defaults: `maxLimit=100`, `defaultLimit=15` |
| `PaginatedResult<T>` | interface | `{ data: T[]; total: number; page: number; limit: number; totalPages: number }` |
| `paginateParams(params, options?)` | função | Clamp e calcula `{ page, limit, skip }` |
| `paginate(findManyFn, countFn, params, options?)` | função async | Executa `findManyFn` e `countFn` em `Promise.all`; retorna `PaginatedResult<T>` |

Padrão de uso num service:

```ts
import { paginate } from '../common/pagination.helper';

const result = await paginate(
  (skip, take) => this.prisma.entidade.findMany({ skip, take, where }),
  () => this.prisma.entidade.count({ where }),
  { page, limit },
);
```

---

**`server/src/common/geocoding/`**

`GeocodingModule` (não-global) exporta `GeocodingService`. Para usar num domínio: importar `GeocodingModule` no `*.module.ts` e injetar `GeocodingService` no constructor do service.

| Símbolo | Descrição |
|---------|-----------|
| `EnderecoGeocoding` | Interface de entrada: `{ logradouro?, numero?, bairro?, cep?, cidade?, uf? }` (todos opcionais) |
| `GeocodingResult` | `{ lat: number; lng: number; precision: 'EXATO' \| 'CIDADE' }` |
| `GeocodingService.geocode(endereco)` | Retorna `GeocodingResult \| null`; tenta endereço completo, cai para cidade/UF como fallback |

Regras de uso:
- Timeout por requisição: **3 s**; throttle mínimo de **1 s** entre chamadas (fila interna — seguro para chamadas paralelas).
- Precisão `EXATO`: logradouro + cidade + UF resolvidos; `CIDADE`: apenas cidade/UF.
- Retorna `null` (sem lançar exceção) se endereço insuficiente ou Nominatim falhar em ambas as tentativas — loga `warn`/`error` via Logger do NestJS.
- API externa: `https://nominatim.openstreetmap.org/search` (apenas Brasil, `countrycodes=br`).
- `User-Agent` fixo nas requisições: `NexusSystem/1.0 (contato@nexus-system.local)`.
- O tipo interno que representa a precisão no código TypeScript chama-se `GeocodingPrecisaoLevel` (distinto do enum Prisma `GeocodingPrecision` — mas ambos têm os mesmos valores `EXATO` e `CIDADE`).

---

### Testes backend

- Unit: `server/test/unit/<domínio>/` — espelha o domínio; mock Prisma: `server/test/unit/helpers/prisma-mock.ts` (`createPrismaMock`).
- E2E: `server/test/*.e2e-spec.ts`, config em `server/test/jest-e2e.json`.
- Comando: `cd server && npm run test`.
