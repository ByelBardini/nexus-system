---
name: nexus-backend
description: Backend specialist for Nexus System NestJS API. Covers stack (NestJS 11, Prisma 7, MariaDB), architecture (Controller→Service→PrismaService), conventions, PDD workflow (tests ALWAYS first, then implementation). Use when working on server/, backend, API endpoints, modules, services, or Prisma.
---

# Nexus Backend

## Stack e Arquitetura

- **Stack:** NestJS 11, TypeScript 5.7, Prisma 7, MariaDB, JWT, class-validator, Swagger, Pino
- **Arquitetura:** 2 camadas — `Controller → Service → PrismaService` (sem Repository layer)
- **Testes:** Jest + ts-jest (unit), Supertest (E2E)

## Fluxo PDD Obrigatório

**Testes SEMPRE vêm primeiro.** Nenhuma implementação sem testes escritos e falhando antes.

1. Ler código existente relevante
2. Escrever `*.spec.ts` e/ou `*.e2e-spec.ts`
3. Rodar `npm run test` (ou `test:e2e`) e confirmar que os testes **falham**
4. Implementar até os testes passarem
5. Refatorar se necessário (mantendo testes verdes)

Checklist a seguir em toda feature/alteração:

```
PDD Progress:
- [ ] Testes escritos
- [ ] Testes falham (Red)
- [ ] Implementação aplicada
- [ ] Testes passam (Green)
```

## Estrutura de Módulo

```
<modulo>/
  <modulo>.module.ts
  <modulo>.controller.ts
  <modulo>.controller.spec.ts   ← CRIAR PRIMEIRO
  <modulo>.service.ts
  <modulo>.service.spec.ts     ← CRIAR PRIMEIRO
  dto/
    create-<modulo>.dto.ts
    update-<modulo>.dto.ts
```

- Unit: `*.spec.ts` em `src/`, `rootDir: src`, `testRegex: .*\.spec\.ts$`
- E2E: `*.e2e-spec.ts` em `test/`, config `test/jest-e2e.json`

## O Que Fazer

- **PDD sempre:** testar antes de implementar
- Nomes em **português** (arquivos, classes, entidades Prisma, mensagens de erro)
- Arquivos em **kebab-case**, classes em **PascalCase**
- `PATCH` para atualizar (nunca `PUT`); soft delete com `ativo: false` (evitar `DELETE`)
- `@Param('id') id: string` → converter com unary plus `+id`
- Paginação: `Promise.all([findMany, count])` e retornar `{ data, total, page, totalPages }`
- `senhaHash` nunca retornado — desestruturar: `const { senhaHash: _, ...rest } = user; return rest;`
- Swagger em todos os controllers: `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`
- Transações com `this.prisma.$transaction(async (tx) => {...})` para operações atômicas
- Exceções NestJS: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`
- DTOs com `class-validator` e `@ApiProperty`/`@ApiPropertyOptional`
- Controller: `@UseGuards(PermissionsGuard)` + `@RequirePermissions('SETOR.ENTIDADE.ACAO')`

## O Que Não Fazer

- Não criar camada de Repository — Service usa `PrismaService` direto
- Não implementar antes de ter testes falhando
- Não retornar `senhaHash` em nenhuma resposta
- Não usar `parseInt()` — usar unary plus `+id`
- Não usar `PUT` nem `DELETE` HTTP — `PATCH` e soft delete
- Não colocar lógica de negócio no controller — fica no service

## Convenções de Permissões

Padrão: `SETOR.ENTIDADE.ACAO`

Exemplos: `AGENDAMENTO.CLIENTE.LISTAR`, `ADMINISTRATIVO.USUARIO.EDITAR`

Rotas públicas usam `@Public()`; demais exigem JWT + `@RequirePermissions()`.

## Referência

Para templates de testes, mocks do Prisma, padrões de DTO, tratamento de erros e paginação, ver [reference.md](reference.md).
