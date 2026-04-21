# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Domínio: `auth`

**Arquivos do módulo (`server/src/auth/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `auth.module.ts` | Registra `AuthService`, `JwtStrategy`, `AuthController`; importa `UsersModule`, `PassportModule` (strategy `jwt`), `JwtModule` (async, `JWT_SECRET` via `ConfigService`, expira em **7d**); exporta `AuthService` e `JwtModule` |
| `auth.controller.ts` | Rotas em `/auth`; `@ApiTags('auth')` |
| `auth.service.ts` | `login`, `trocarSenha`, `validateUser`; usa `bcrypt` e `UsersService` |
| `jwt.strategy.ts` | `PassportStrategy(Strategy)` — extrai token do `Authorization: Bearer`; chama `authService.validateUser(sub)`; rejeita usuários inativos |
| `guards/jwt-auth.guard.ts` | `AuthGuard('jwt')` global (registrado em `app.module.ts`); respeita `@Public()` — rotas marcadas com `@Public()` passam sem validação JWT |
| `guards/permissions.guard.ts` | Lê `PERMISSIONS_KEY` via `Reflector`; busca permissões do usuário via `usersService.getPermissions()`; exige **todas** as permissões declaradas (AND lógico); lança `ForbiddenException` se faltar alguma |
| `decorators/public.decorator.ts` | `@Public()` — marca rota como pública (`IS_PUBLIC_KEY = 'isPublic'`) |
| `decorators/require-permissions.decorator.ts` | `@RequirePermissions(...codes)` — define `PERMISSIONS_KEY` na metadata; `codes` são strings livres (ex.: `'CONFIGURACAO.APARELHO.LISTAR'`) |
| `decorators/current-user.decorator.ts` | `@CurrentUser(field?)` — param decorator; sem argumento retorna `request.user` completo; com argumento retorna `request.user[field]` (ex.: `@CurrentUser('id') userId: number`) |
| `dto/login.dto.ts` | `{ email: string (IsEmail), password: string (MinLength 1) }` |
| `dto/login-response.dto.ts` | `{ accessToken, user: {id, nome, email}, permissions: string[], exigeTrocaSenha?: boolean }` |
| `dto/trocar-senha.dto.ts` | `{ senhaAtual: string, novaSenha: string }` — `novaSenha` exige ≥8 chars, ≥1 número, ≥1 caractere especial (`SENHA_FORTE_REGEX`) |

**Endpoints:**

| Método | Path | Guard | Descrição |
|--------|------|-------|-----------|
| POST | `/auth/login` | `@Public()` + `@Throttle(5/60s)` | Login; retorna `LoginResponseDto` |
| POST | `/auth/trocar-senha` | JWT obrigatório | Troca senha do usuário autenticado (`@CurrentUser('id')`) |

**Fluxo de autenticação:**

1. `POST /auth/login` → `AuthService.login` → valida `ativo`, compara `bcrypt`, chama `updateLastLogin`, monta `JwtPayload { sub: id, email }`, assina token (7d), retorna `permissions` (array de strings) e flag `exigeTrocaSenha`.
2. `exigeTrocaSenha = true` quando `senhaExpiradaEm` é `null` ou já passou — frontend deve redirecionar para troca obrigatória.
3. Cada requisição autenticada passa por `JwtStrategy.validate(payload)` → `authService.validateUser(sub)` → `usersService.findById(id)` — se usuário não existe ou `ativo=false`, lança `UnauthorizedException`.
4. `PermissionsGuard` é **aplicado por domínio** (não global): adicionar `@UseGuards(PermissionsGuard)` no controller e `@RequirePermissions(...)` em cada rota.

**Regras de negócio críticas:**

- `JWT_SECRET` deve estar em `server/.env` (lido via `ConfigService`). Sem ele o módulo falha no boot.
- Senhas são hasheadas com `bcrypt` (salt rounds = 10).
- Expiração de senha: após `trocarSenha`, nova `senhaExpiradaEm` = data atual + **6 meses** (`PRAZO_EXPIRACAO_SENHA_MESES` em `server/src/common/constants.ts`).
- `PermissionsGuard` faz **nova query** a cada requisição (`usersService.findByEmail`) — não usa o user do JWT diretamente para permissões, garantindo permissões sempre atualizadas.
- `@Public()` **só** ignora JWT; `PermissionsGuard` ainda exigiria permissões se aplicado separadamente (não é o caso das rotas públicas atuais).

**Variáveis de ambiente relevantes:**

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Obrigatório; segredo de assinatura JWT (`ConfigService.getOrThrow`) |
| `DATABASE_URL` | Indiretamente usado pelo `UsersService` via Prisma |

---

