---
description: Complete guide for writing unit and E2E tests in Nexus System backend (NestJS 11, Jest, Prisma 7). Covers file location, imports, createPrismaMock, AAA patterns, external module mocks, TypeScript typing, coverage, and anti-patterns.
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
  // Arrange
  const cliente = { id: 1, nome: 'Empresa ABC', contatos: [], subclientes: [] };
  prisma.cliente.findUnique.mockResolvedValue(cliente);

  // Act
  const result = await service.findOne(1);

  // Assert
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
describe('ClientesController', () => {
  let controller: ClientesController;
  let service: ClientesService;

  const serviceMock = {
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
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientesController>(ClientesController);
    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('converte id para número e chama service.findOne', async () => {
      const cliente = { id: 1, nome: 'Empresa ABC' };
      (service.findOne as jest.Mock).mockResolvedValue(cliente);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(cliente);
    });
  });
});
```

---

## Mocking de Módulos Externos (jest.mock)

```typescript
// NO TOPO DO ARQUIVO — antes de qualquer import
jest.mock('api-placa-fipe', () => ({
  consultarPlaca: jest.fn(),
}));

import { consultarPlaca } from 'api-placa-fipe';

describe('VeiculosService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (consultarPlaca as jest.Mock).mockReset();
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

Para cada método público do service:
1. **Caminho feliz** — retorno correto com dados válidos
2. **Recurso não encontrado** — `NotFoundException` + mensagem em português
3. **Conflito de unicidade** — `ConflictException` quando aplicável
4. **Validação de negócio** — `BadRequestException` para dados inválidos
5. **Valores padrão** — defaults de paginação, status, `ativo: true`, etc.
6. **Edge cases** — string vazia, whitespace, null/undefined, limites numéricos
7. **Transações** — verificar que `$transaction` é (ou não é) chamada

Para cada método de controller:
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
```

Regras:
- `describe` nível 1: nome exato da classe
- `describe` nível 2: nome exato do método público
- `it`: em **português**, com sujeito + verbo + condição
- **Nunca** usar "deve", "should", "test" — descrever o comportamento diretamente

---

## clearAllMocks vs mockReset

| `jest.clearAllMocks()` | `mockReset()` |
|---|---|
| Limpa histórico de chamadas | Limpa histórico + remove implementação |
| Mantém `mockResolvedValue` configurado | Remove `mockResolvedValue` configurado |
| Usar no `beforeEach` padrão | Usar em mocks externos (`jest.mock`) |

---

## createPrismaMock — Entidades e $transaction

```typescript
// Entidades disponíveis:
// usuario · cargo · setor · permissao · cargoPermissao · usuarioCargo · cliente
// subcliente · contatoCliente · tecnico · precoTecnico · veiculo
// marcaEquipamento · modeloEquipamento · operadora · aparelho · aparelhoHistorico
// loteAparelho · kit · ordemServico · oSHistorico · pedidoRastreador · pedidoRastreadorHistorico

// Métodos por entidade:
// findMany · findUnique · findFirst · findUniqueOrThrow · create · createMany
// update · updateMany · delete · deleteMany · count · aggregate · groupBy

// $transaction pré-configurado:
mock.$transaction.mockImplementation((arg) => {
  if (typeof arg === 'function') return arg(mock); // callback recebe o mock como tx
  if (Array.isArray(arg)) return Promise.all(arg);
});
```

---

## Anti-padrões — O Que Evitar

| Anti-padrão | Correto |
|---|---|
| `*.spec.ts` dentro de `src/` | Sempre em `test/unit/<modulo>/` |
| Mock inline `{ findMany: jest.fn() }` | Sempre `createPrismaMock()` |
| Import com caminho relativo `'../../src/...'` | Alias `'src/...'` |
| `describe('deve funcionar')` | Nome da classe: `'ClientesService'` |
| `it` em inglês | Descrição em português |
| Sem `jest.clearAllMocks()` no `beforeEach` | Sempre chamar para isolar testes |
| `let prisma: any` | `let prisma: ReturnType<typeof createPrismaMock>` |
| `expect(result).toBeTruthy()` | Asserção específica com valor esperado |
| Testar apenas caminho feliz | Cobrir todos os branches de erro e edge cases |
| Comentários `// Arrange`, `// Act`, `// Assert` | Separação visual por linha em branco |