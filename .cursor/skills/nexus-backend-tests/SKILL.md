---
name: nexus-backend-tests
description: Guia completo para escrita de testes unitários e E2E no backend do Nexus System (NestJS 11, Jest, Prisma 7). Cobre localização de arquivos, imports, createPrismaMock, padrões AAA, mocks de módulos externos, tipagem TypeScript, cobertura e anti-padrões. Use quando criar, modificar ou revisar testes em test/unit/ ou test/*.e2e-spec.ts.
---

# Testes — Nexus Backend

## Regra Fundamental

Testes **NUNCA** ficam em `src/`. Ficam **SEMPRE** em `test/unit/<modulo>/`.

```
test/
  unit/
    helpers/
      prisma-mock.ts              ← mock centralizado (nunca recriar inline)
    <modulo>/
      <modulo>.service.spec.ts    ← TDD: criar ANTES da implementação
      <modulo>.controller.spec.ts ← TDD: criar ANTES da implementação
  app.e2e-spec.ts
  <modulo>.e2e-spec.ts
  jest-e2e.json
```

```bash
npm run test          # unit (test/unit/**)
npm run test:watch    # modo watch
npm run test:cov      # cobertura
npm run test:e2e      # E2E (test/*.e2e-spec.ts)
```

---

## Imports — Regras Obrigatórias

```typescript
// 1. Mocks de módulos externos: ANTES de qualquer import (hoisting do Jest)
jest.mock('api-placa-fipe', () => ({ consultarPlaca: jest.fn() }));

// 2. Imports do NestJS testing
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

// 3. Imports do projeto: SEMPRE com alias src/ (nunca caminho relativo ../../src)
import { ClientesService } from 'src/clientes/clientes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

// 4. Mock helper: SEMPRE relativo
import { createPrismaMock } from '../helpers/prisma-mock';

// 5. Enums do Prisma: direto do client
import { StatusOS, TipoDestinoPedido } from '@prisma/client';
```

---

## Padrão AAA (Arrange → Act → Assert)

**Cada `it` deve ter exatamente 3 seções lógicas:**

```typescript
it('retorna cliente quando encontrado', async () => {
  // Arrange — preparar dados e mocks
  const cliente = { id: 1, nome: 'Empresa ABC', contatos: [], subclientes: [] };
  prisma.cliente.findUnique.mockResolvedValue(cliente);

  // Act — executar o código sob teste
  const result = await service.findOne(1);

  // Assert — verificar o resultado
  expect(result).toEqual(cliente);
  expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
    where: { id: 1 },
    include: { contatos: true, subclientes: true },
  });
});
```

Regras AAA:
- Sem lógica entre `Act` e `Assert`
- Um único `Act` por `it`
- Separação visual por linha em branco (sem comentários `// Arrange`)

---

## Anatomia — Service com Prisma

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: ReturnType<typeof createPrismaMock>;   // tipagem correta — não usar any

  beforeEach(async () => {
    prisma = createPrismaMock();                     // novo mock a cada teste

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();                            // limpar histórico de chamadas
  });

  describe('findOne', () => {
    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Cliente não encontrado');
    });

    it('retorna cliente quando encontrado', async () => {
      const cliente = { id: 1, nome: 'Empresa ABC', contatos: [], subclientes: [] };
      prisma.cliente.findUnique.mockResolvedValue(cliente);

      const result = await service.findOne(1);

      expect(result).toEqual(cliente);
    });
  });
});
```

---

## Anatomia — Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from 'src/clientes/clientes.controller';
import { ClientesService } from 'src/clientes/clientes.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('ClientesController', () => {
  let controller: ClientesController;
  let service: ClientesService;

  const serviceMock = {              // objeto simples com jest.fn() — nunca createPrismaMock aqui
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [{ provide: ClientesService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)              // desativar guard — não testar auth aqui
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientesController>(ClientesController);
    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('converte id para número e chama service.findOne', async () => {
      const cliente = { id: 1, nome: 'Empresa ABC' };
      (service.findOne as jest.Mock).mockResolvedValue(cliente);  // cast para jest.Mock no controller

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);            // verifica conversão +id
      expect(result).toEqual(cliente);
    });
  });
});
```

---

## Service com Dependências Externas (não Prisma)

Quando o service injeta outros services (ex: `AuthService`):

```typescript
const usersServiceMock = {
  findByEmail: jest.fn(),
  updateLastLogin: jest.fn(),
  getPermissions: jest.fn(),
};
const jwtServiceMock = { sign: jest.fn() };

// No module:
providers: [
  AuthService,
  { provide: UsersService, useValue: usersServiceMock },
  { provide: JwtService, useValue: jwtServiceMock },
],
```

---

## Mocking de Módulos Externos (jest.mock)

Para bibliotecas externas (ex: `api-placa-fipe`), declarar `jest.mock` **ANTES** de qualquer import e chamar `.mockReset()` no `beforeEach`:

```typescript
// NO TOPO DO ARQUIVO — antes de qualquer import
jest.mock('api-placa-fipe', () => ({
  consultarPlaca: jest.fn(),
}));

import { consultarPlaca } from 'api-placa-fipe';

describe('VeiculosService', () => {
  beforeEach(async () => {
    // ...setup normal...
    jest.clearAllMocks();
    (consultarPlaca as jest.Mock).mockReset(); // reset completo do mock externo
  });

  it('normaliza placa antes de chamar a API', async () => {
    (consultarPlaca as jest.Mock).mockResolvedValue(null);

    await service.consultaPlaca('abc-1d23');

    expect(consultarPlaca).toHaveBeenCalledWith('ABC1D23');
  });
});
```

---

## Tabela de Asserções

| Cenário | Asserção |
|---|---|
| Objeto completo idêntico | `expect(result).toEqual({ id: 1, nome: 'X' })` |
| Objeto parcial (subset) | `expect(result).toMatchObject({ status: 'ATIVO' })` |
| Valor primitivo | `expect(result).toBe(42)` |
| Null | `expect(result).toBeNull()` |
| Tamanho de array | `expect(result).toHaveLength(3)` |
| Propriedade ausente | `expect(result).not.toHaveProperty('senhaHash')` |
| Array contém item | `expect(result).toContain('PERMISSAO.LISTAR')` |
| Exceção por classe | `await expect(fn()).rejects.toThrow(NotFoundException)` |
| Exceção por mensagem | `await expect(fn()).rejects.toThrow('Mensagem em português')` |
| Mock chamado com args exatos | `expect(mock).toHaveBeenCalledWith({ where: { id: 1 } })` |
| Mock com args parciais | `expect(mock).toHaveBeenCalledWith(expect.objectContaining({ nome: 'X' }))` |
| Mock com array parcial | `expect(mock).toHaveBeenCalledWith(expect.arrayContaining([{ numero: 42 }]))` |
| Mock chamado N vezes | `expect(mock).toHaveBeenCalledTimes(5)` |
| Mock não chamado | `expect(mock).not.toHaveBeenCalled()` |
| Transação usada | `expect(prisma.$transaction).toHaveBeenCalled()` |
| Transação não usada | `expect(prisma.$transaction).not.toHaveBeenCalled()` |

---

## Tipagem TypeScript nos Testes

```typescript
// Serviços do próprio projeto no controller: cast explícito
(service.findOne as jest.Mock).mockResolvedValue(data);

// Tipos complexos baseados no retorno real do service
const user = { ... } as unknown as NonNullable<Awaited<ReturnType<typeof service.findByEmail>>>;

// DTOs incompletos nos testes: usar as any
await service.create({ tipo: 'INSTALACAO', clienteId: 1 } as any);
```

---

## Casos de Teste Obrigatórios

Para cada método público do service, cobrir:

1. **Caminho feliz** — retorno correto com dados válidos
2. **Recurso não encontrado** — `NotFoundException` + mensagem em português
3. **Conflito de unicidade** — `ConflictException` quando aplicável
4. **Validação de negócio** — `BadRequestException` para dados inválidos
5. **Valores padrão** — defaults de paginação, status, `ativo: true`, etc.
6. **Edge cases** — string vazia, whitespace, null/undefined, limites numéricos
7. **Transações** — verificar que `$transaction` é (ou não é) chamada
8. **Callbacks relacionados** — histórico, tabelas secundárias criadas junto

Para cada método de controller, cobrir:

1. **Conversão de tipos** — `id: string → number` via unary plus
2. **Query params** — `page`, `limit`, flags `ativo`, filtros → números/booleanos corretos
3. **Delegação correta** — args passados ao service sem transformação indevida
4. **Propagação de erro** — exceções do service chegam ao cliente

---

## Convenções de Nomenclatura

```
describe('ClientesService')           ← nome exato da classe
  describe('findOne')                 ← nome exato do método
    it('retorna cliente quando encontrado')           ← caminho feliz
    it('lança NotFoundException quando não existe')   ← erro
    it('inclui subclientes quando includeSubclientes é true') ← branch

describe('ClientesController')
  describe('findOne')
    it('converte id para número e chama service.findOne')
    it('delega para service.findAll sem subclientes por padrão')
```

Regras:
- `describe` nível 1: nome exato da classe
- `describe` nível 2: nome exato do método público
- `it`: em **português**, com sujeito + verbo + condição quando relevante
- **Nunca** usar "deve", "should", "test" — descrever o comportamento diretamente
- Módulos com múltiplas entidades: separar com comentário `// ============= MARCAS =============`

---

## clearAllMocks vs mockReset

| `jest.clearAllMocks()` | `mockReset()` |
|---|---|
| Limpa histórico de chamadas | Limpa histórico + remove implementação |
| Mantém `mockResolvedValue` configurado | Remove `mockResolvedValue` configurado |
| Usar no `beforeEach` padrão | Usar em mocks externos (`jest.mock`) |

---

## Referência

Templates completos de E2E, padrões avançados (groupBy, $transaction complexo, múltiplos findUnique), anti-padrões e exemplos extraídos dos testes reais do sistema: [reference.md](reference.md).
