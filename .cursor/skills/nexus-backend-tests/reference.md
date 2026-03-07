# Testes — Referência Detalhada

## createPrismaMock — Tabelas e Métodos Disponíveis

O helper `test/unit/helpers/prisma-mock.ts` expõe todas as entidades do schema com `jest.fn()` para cada operação.

**Entidades disponíveis:**
`usuario` · `cargo` · `setor` · `permissao` · `cargoPermissao` · `usuarioCargo` · `cliente` · `subcliente` · `contatoCliente` · `tecnico` · `precoTecnico` · `veiculo` · `marcaEquipamento` · `modeloEquipamento` · `operadora` · `aparelho` · `aparelhoHistorico` · `loteAparelho` · `kit` · `ordemServico` · `oSHistorico` · `pedidoRastreador` · `pedidoRastreadorHistorico`

**Métodos por entidade:**
`findMany` · `findUnique` · `findFirst` · `findUniqueOrThrow` · `create` · `createMany` · `update` · `updateMany` · `delete` · `deleteMany` · `count` · `aggregate` · `groupBy`

**`$transaction` pré-configurado:**
```typescript
mock.$transaction.mockImplementation((arg) => {
  if (typeof arg === 'function') return arg(mock); // callback recebe o mock como tx
  if (Array.isArray(arg)) return Promise.all(arg);
});
```

---

## mockResolvedValueOnce — Chamadas Múltiplas na Mesma Operação

```typescript
// count chamado 5 vezes seguidas (getResumo)
prisma.ordemServico.count
  .mockResolvedValueOnce(5)   // 1ª → agendado
  .mockResolvedValueOnce(3)   // 2ª → emTestes
  .mockResolvedValueOnce(2)   // 3ª → testesRealizados
  .mockResolvedValueOnce(1)   // 4ª → aguardandoCadastro
  .mockResolvedValueOnce(10); // 5ª → finalizado

// findUnique chamado antes e depois de uma operação (updateStatus)
prisma.ordemServico.findUnique
  .mockResolvedValueOnce(os)                              // busca inicial
  .mockResolvedValueOnce({ ...os, status: 'EM_TESTES' }); // busca pós-atualização
```

---

## Padrão: Histórico de Mudança de Status

Recorrente em OS, Aparelhos, Pedidos. Testar três cenários:

```typescript
describe('updateStatus', () => {
  it('lança NotFoundException quando entidade não existe', async () => {
    prisma.ordemServico.findUnique.mockResolvedValue(null);

    await expect(service.updateStatus(999, { status: StatusOS.EM_TESTES }))
      .rejects.toThrow(NotFoundException);
  });

  it('retorna sem alterar quando status já é o mesmo', async () => {
    const os = { id: 1, status: StatusOS.AGENDADO, historico: [] };
    prisma.ordemServico.findUnique.mockResolvedValue(os);

    const result = await service.updateStatus(1, { status: StatusOS.AGENDADO });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result).toEqual(os);
  });

  it('registra histórico e atualiza status quando novo status é diferente', async () => {
    const os = { id: 1, status: StatusOS.AGENDADO, historico: [] };
    prisma.ordemServico.findUnique
      .mockResolvedValueOnce(os)
      .mockResolvedValueOnce({ ...os, status: StatusOS.EM_TESTES });
    prisma.oSHistorico.create.mockResolvedValue({});
    prisma.ordemServico.update.mockResolvedValue({});

    const result = await service.updateStatus(1, { status: StatusOS.EM_TESTES });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toMatchObject({ status: StatusOS.EM_TESTES });
  });
});
```

---

## Padrão: Número Sequencial

```typescript
describe('create', () => {
  it('gera número sequencial com base no último registro', async () => {
    prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 41 } });
    prisma.ordemServico.create.mockResolvedValue({ id: 1, numero: 42 });

    await service.create({ tipo: 'INSTALACAO', clienteId: 1 } as any, 100);

    expect(prisma.ordemServico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numero: 42, criadoPorId: 100 }),
      }),
    );
  });

  it('usa número 1 quando não há registros anteriores', async () => {
    prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: null } });
    prisma.ordemServico.create.mockResolvedValue({ id: 1, numero: 1 });

    await service.create({ tipo: 'INSTALACAO' } as any);

    expect(prisma.ordemServico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numero: 1 }),
      }),
    );
  });
});
```

---

## Padrão: Transação com Criação Aninhada

```typescript
it('cria subcliente e OS na mesma transação quando subclienteCreate é informado', async () => {
  const createdSub = { id: 10, clienteId: 1, nome: 'Sub Novo' };
  const createdOS = { id: 1, numero: 6, subclienteId: 10 };
  prisma.subcliente.create.mockResolvedValue(createdSub);
  prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 5 } });
  prisma.ordemServico.create.mockResolvedValue(createdOS);

  const result = await service.create({
    tipo: 'INSTALACAO',
    clienteId: 1,
    subclienteCreate: { nome: 'Sub Novo', cep: '12345-678', cidade: 'SP', estado: 'SP' },
  } as any);

  expect(prisma.$transaction).toHaveBeenCalled();
  expect(prisma.subcliente.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ clienteId: 1, nome: 'Sub Novo' }),
  });
  expect(prisma.ordemServico.create).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ subclienteId: 10 }) }),
  );
  expect(result).toEqual(createdOS);
});
```

---

## Padrão: updateRolePermissions (deleteMany + createMany em transação)

```typescript
describe('updateRolePermissions', () => {
  it('limpa permissões existentes e insere as novas dentro de uma transação', async () => {
    prisma.cargoPermissao.deleteMany.mockResolvedValue({ count: 2 });
    prisma.cargoPermissao.createMany.mockResolvedValue({ count: 3 });
    prisma.cargo.findUniqueOrThrow.mockResolvedValue({ id: 1, cargoPermissoes: [] });

    await service.updateRolePermissions(1, [10, 11, 12]);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.cargo.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it('não chama createMany quando lista de permissões é vazia', async () => {
    prisma.cargoPermissao.deleteMany.mockResolvedValue({ count: 0 });
    prisma.cargo.findUniqueOrThrow.mockResolvedValue({ id: 1, cargoPermissoes: [] });

    await service.updateRolePermissions(1, []);

    expect(prisma.cargoPermissao.createMany).not.toHaveBeenCalled();
  });
});
```

---

## Padrão: groupBy para Resumos

```typescript
it('retorna total e contagens agrupadas por status e tipo', async () => {
  prisma.aparelho.count.mockResolvedValue(10);
  prisma.aparelho.groupBy
    .mockResolvedValueOnce([
      { status: 'EM_ESTOQUE', _count: { status: 7 } },
      { status: 'CONFIGURADO', _count: { status: 3 } },
    ])
    .mockResolvedValueOnce([
      { tipo: 'RASTREADOR', _count: { tipo: 6 } },
      { tipo: 'SIM', _count: { tipo: 4 } },
    ]);

  const result = await service.getResumo();

  expect(result.total).toBe(10);
  expect(result.porStatus).toMatchObject({ EM_ESTOQUE: 7, CONFIGURADO: 3 });
  expect(result.porTipo).toMatchObject({ RASTREADOR: 6, SIM: 4 });
});
```

---

## Padrão: Deduplicação de Permissões (Set)

```typescript
it('retorna permissões únicas mesmo com duplicatas entre cargos', () => {
  const user = {
    usuarioCargos: [
      { cargo: { cargoPermissoes: [{ permissao: { code: 'OS.LISTAR' } }] } },
      { cargo: { cargoPermissoes: [{ permissao: { code: 'OS.LISTAR' } }] } },
    ],
  } as unknown as NonNullable<Awaited<ReturnType<typeof service.findByEmail>>>;

  const permissions = service.getPermissions(user);

  expect(permissions).toHaveLength(1);
  expect(permissions).toContain('OS.LISTAR');
});

it('retorna lista vazia quando usuário não tem cargos', () => {
  const user = { usuarioCargos: [] } as unknown as NonNullable<
    Awaited<ReturnType<typeof service.findByEmail>>
  >;

  expect(service.getPermissions(user)).toEqual([]);
});
```

---

## Padrão: senhaHash nunca retornado

```typescript
it('retorna usuário sem senhaHash', async () => {
  const user = { id: 1, nome: 'Alice', senhaHash: 'bcrypt-hash', usuarioCargos: [] };
  prisma.usuario.findUnique.mockResolvedValue(user);

  const result = await service.findOne(1);

  expect(result).not.toHaveProperty('senhaHash');
  expect(result).toMatchObject({ id: 1, nome: 'Alice' });
});

it('findAll retorna lista sem senhaHash em nenhum item', async () => {
  const users = [
    { id: 1, nome: 'Alice', senhaHash: 'h1', usuarioCargos: [] },
    { id: 2, nome: 'Bob', senhaHash: 'h2', usuarioCargos: [] },
  ];
  prisma.usuario.findMany.mockResolvedValue(users);

  const result = await service.findAll();

  expect(result[0]).not.toHaveProperty('senhaHash');
  expect(result[1]).not.toHaveProperty('senhaHash');
});
```

---

## Padrão: Paginação Completa

```typescript
describe('findAll paginado', () => {
  it('retorna resultado com defaults page=1, limit=15', async () => {
    prisma.entidade.findMany.mockResolvedValue([]);
    prisma.entidade.count.mockResolvedValue(0);

    const result = await service.findAll({});

    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 15, totalPages: 0 });
    expect(prisma.entidade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 15 }),
    );
  });

  it('calcula skip correto para página 2 com limit 10', async () => {
    prisma.entidade.findMany.mockResolvedValue([]);
    prisma.entidade.count.mockResolvedValue(30);

    const result = await service.findAll({ page: 2, limit: 10 });

    expect(prisma.entidade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.totalPages).toBe(3);
  });

  it('garante page mínimo de 1', async () => {
    prisma.entidade.findMany.mockResolvedValue([]);
    prisma.entidade.count.mockResolvedValue(0);

    const result = await service.findAll({ page: 0 });

    expect(result.page).toBe(1);
  });

  it('limita ao máximo de 100 registros por página', async () => {
    prisma.entidade.findMany.mockResolvedValue([]);
    prisma.entidade.count.mockResolvedValue(0);

    const result = await service.findAll({ limit: 200 });

    expect(result.limit).toBe(100);
  });
});
```

---

## Padrão: Módulo com Múltiplas Entidades (CRUD Repetido)

Para módulos como `equipamentos` (marcas + modelos + operadoras), separar com comentários:

```typescript
describe('EquipamentosService', () => {
  // ...setup...

  // ============= MARCAS =============

  describe('findAllMarcas', () => { ... });
  describe('createMarca', () => { ... });
  describe('updateMarca', () => { ... });
  describe('deleteMarca', () => { ... });

  // ============= MODELOS =============

  describe('findAllModelos', () => { ... });
  describe('createModelo', () => { ... });
  describe('deleteModelo', () => { ... });

  // ============= OPERADORAS =============

  describe('findAllOperadoras', () => { ... });
  describe('createOperadora', () => { ... });
  describe('updateOperadora', () => { ... });
  describe('deleteOperadora', () => { ... });
});
```

---

## Padrão: mock de Módulo Externo (jest.mock + mockReset)

```typescript
// ANTES de qualquer import
jest.mock('api-placa-fipe', () => ({
  consultarPlaca: jest.fn(),
}));

import { consultarPlaca } from 'api-placa-fipe';

describe('VeiculosService', () => {
  beforeEach(async () => {
    // ...setup padrão...
    jest.clearAllMocks();
    (consultarPlaca as jest.Mock).mockReset(); // garante limpeza completa da implementação
  });

  it('retorna null quando placa tem menos de 7 caracteres alfanuméricos', async () => {
    const result = await service.consultaPlaca('ABC12');

    expect(result).toBeNull();
    expect(consultarPlaca).not.toHaveBeenCalled();
  });

  it('normaliza placa removendo caracteres especiais e convertendo para maiúsculas', async () => {
    (consultarPlaca as jest.Mock).mockResolvedValue(null);

    await service.consultaPlaca('abc-1d23');

    expect(consultarPlaca).toHaveBeenCalledWith('ABC1D23');
  });

  it('usa string vazia para campos ausentes na API', async () => {
    (consultarPlaca as jest.Mock).mockResolvedValue({});

    const result = await service.consultaPlaca('ABC1D23');

    expect(result).toEqual({ marca: '', modelo: '', ano: '', cor: '', tipo: '' });
  });
});
```

---

## Padrão: Propagação de Erro no Controller

```typescript
it('propaga UnauthorizedException do service', async () => {
  authServiceMock.login.mockRejectedValue(
    new UnauthorizedException('Credenciais inválidas')
  );

  await expect(
    controller.login({ email: 'x@x.com', password: 'errada' })
  ).rejects.toThrow('Credenciais inválidas');
});
```

---

## Template E2E Completo

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Clientes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /clientes retorna 401 sem token', () => {
    return request(app.getHttpServer()).get('/clientes').expect(401);
  });

  it('POST /clientes retorna 400 com body inválido', () => {
    return request(app.getHttpServer())
      .post('/clientes')
      .set('Authorization', 'Bearer <token>')
      .send({})
      .expect(400);
  });
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
| `it('testando findOne')` | `it('retorna cliente quando encontrado')` |
| Sem `jest.clearAllMocks()` no `beforeEach` | Sempre chamar para isolar testes |
| Sem `mockReset()` para módulos externos | Chamar após `clearAllMocks` |
| `let prisma: any` | `let prisma: ReturnType<typeof createPrismaMock>` |
| `expect(result).toBeTruthy()` | Asserção específica com valor esperado |
| Testar apenas caminho feliz | Cobrir todos os branches de erro e edge cases |
| Um `it` com múltiplos `Act` | Um único comportamento por `it` |
| Lógica condicional dentro de `it` | Separar em múltiplos `it` distintos |
| Comentários `// Arrange`, `// Act`, `// Assert` | Separação visual por linha em branco |
