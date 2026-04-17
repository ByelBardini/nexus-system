---
name: nexus-backend
description: Backend specialist for Nexus System NestJS API. Covers stack (NestJS 11, Prisma 7, MariaDB), architecture (Controller→Service→PrismaService), conventions, TDD workflow (tests ALWAYS first in test/unit/, then implementation in a separate prompt). Use when working on server/, backend, API endpoints, modules, services, or Prisma.
---

# Nexus Backend

## Stack e Arquitetura

- **Stack:** NestJS 11, TypeScript 5.7, Prisma 7, MariaDB, JWT, class-validator, Swagger, Pino
- **Arquitetura:** 2 camadas — `Controller → Service → PrismaService` (sem Repository layer)
- **Testes:** Jest + ts-jest (unit), Supertest (E2E)

## Fluxo TDD Obrigatório — 2 Prompts Separados

**Os testes SEMPRE vêm primeiro, em um prompt separado da implementação.**

### Prompt 1 — Escrever os testes (Red)

1. Ler o código existente relevante
2. Criar os arquivos de teste em `test/unit/<modulo>/`
3. Rodar `npm run test` e confirmar que os testes **falham** (Red)
4. Reportar os erros de falha ao usuário e aguardar o próximo prompt

### Prompt 2 — Implementar (Green → Refactor)

1. Implementar o código mínimo para os testes passarem
2. Rodar `npm run test` e confirmar que os testes **passam** (Green)
3. Refatorar se necessário (mantendo testes verdes)

> **NUNCA escreva implementação e testes no mesmo prompt.**
> Se o usuário pedir implementação sem testes, responder:
> *"Seguindo o TDD, precisamos escrever os testes primeiro. Vou criar os arquivos em `test/unit/<modulo>/` e só no próximo prompt aplicamos a implementação."*

Checklist a seguir em todo ciclo TDD:

```
TDD Progress:
- [ ] Testes escritos em test/unit/<modulo>/
- [ ] Testes falham (Red)
--- aguarda próximo prompt ---
- [ ] Implementação aplicada
- [ ] Testes passam (Green)
- [ ] Refatoração (se necessário)
```

## Estrutura de Arquivos

### Módulo (`src/`)

```
src/
  <modulo>/
    <modulo>.module.ts
    <modulo>.controller.ts
    <modulo>.service.ts
    dto/
      create-<modulo>.dto.ts
      update-<modulo>.dto.ts
```

> Nenhum arquivo `*.spec.ts` dentro de `src/`. Os testes ficam SEMPRE em `test/unit/`.

### Testes (`test/`)

```
test/
  unit/
    helpers/
      prisma-mock.ts           ← mock centralizado, NUNCA recriar inline
    <modulo>/
      <modulo>.service.spec.ts   ← CRIAR PRIMEIRO (Prompt 1)
      <modulo>.controller.spec.ts ← CRIAR PRIMEIRO (Prompt 1)
  jest-e2e.json
  app.e2e-spec.ts
  <modulo>.e2e-spec.ts
```

### Configuração Jest (`package.json`)

```json
"jest": {
  "rootDir": ".",
  "roots": ["<rootDir>/test/unit"],
  "testRegex": ".*\\.spec\\.ts$",
  "moduleNameMapper": { "^src/(.*)$": "<rootDir>/src/$1" }
}
```

- Unit: `test/unit/<modulo>/*.spec.ts` — roda com `npm run test`
- E2E: `test/*.e2e-spec.ts` — roda com `npm run test:e2e`

## Imports nos Arquivos de Teste

Usar sempre o alias `src/`:

```typescript
import { ClientesService } from 'src/clientes/clientes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from '../helpers/prisma-mock';
```

## O Que Fazer

- **TDD sempre:** testes primeiro (Prompt 1), implementação depois (Prompt 2)
- **Testes em `test/unit/<modulo>/`** — nunca dentro de `src/`
- **Usar `createPrismaMock()`** de `test/unit/helpers/prisma-mock.ts` — nunca criar mock inline
- Nomes em **português** (arquivos, classes, entidades Prisma, mensagens de erro)
- Arquivos em **kebab-case**, classes em **PascalCase**
- `PATCH` para atualizar (nunca `PUT`); soft delete com `ativo: false` (evitar `DELETE`)
- `@Param('id') id: string` → converter com unary plus `+id`
- Paginação: `Promise.all([findMany, count])` e retornar `{ items, total, page, limit, totalPages }`
- `senhaHash` nunca retornado — desestruturar: `const { senhaHash: _, ...rest } = user; return rest;`
- Swagger em todos os controllers: `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`
- Transações com `this.prisma.$transaction(async (tx) => {...})` para operações atômicas
- Exceções NestJS: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`
- DTOs com `class-validator` e `@ApiProperty`/`@ApiPropertyOptional`
- Controller: `@UseGuards(PermissionsGuard)` + `@RequirePermissions('SETOR.ENTIDADE.ACAO')`

## O Que Não Fazer

- Não criar arquivos `*.spec.ts` dentro de `src/` — testes ficam em `test/unit/`
- Não criar mock do Prisma inline — usar sempre `createPrismaMock()` do helper
- Não implementar antes de ter testes falhando
- Não escrever testes e implementação no mesmo prompt
- Não criar camada de Repository — Service usa `PrismaService` direto
- Não retornar `senhaHash` em nenhuma resposta
- Não usar `parseInt()` — usar unary plus `+id`
- Não usar `PUT` nem `DELETE` HTTP — `PATCH` e soft delete
- Não colocar lógica de negócio no controller — fica no service

## Convenções de Permissões

Padrão: `SETOR.ENTIDADE.ACAO`

Exemplos: `AGENDAMENTO.CLIENTE.LISTAR`, `ADMINISTRATIVO.USUARIO.EDITAR`

Rotas públicas usam `@Public()`; demais exigem JWT + `@RequirePermissions()`.

## Referência

Para templates de testes, uso do `createPrismaMock`, padrões de DTO, tratamento de erros e paginação, ver [reference.md](reference.md).
