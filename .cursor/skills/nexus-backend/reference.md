# Nexus Backend — Referência Detalhada

## Helper de Mock do Prisma

O projeto usa um mock centralizado em `test/unit/helpers/prisma-mock.ts`.
**NUNCA crie mocks do Prisma inline nos testes.** Sempre importe `createPrismaMock`.

```typescript
import { createPrismaMock } from '../helpers/prisma-mock';

// Uso nos testes:
let prisma: ReturnType<typeof createPrismaMock>;
prisma = createPrismaMock();
```

O `createPrismaMock()` expõe todas as tabelas do Prisma com `jest.fn()` para cada método
(`findMany`, `findUnique`, `findFirst`, `create`, `update`, `delete`, `count`, etc.)
e um `$transaction` que executa o callback com o próprio mock.

## Templates de Testes

### Unit — Service

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Cliente não encontrado');
    });

    it('retorna cliente quando encontrado', async () => {
      const cliente = { id: 1, nome: 'Cliente Teste', contatos: [], subclientes: [] };
      prisma.cliente.findUnique.mockResolvedValue(cliente);

      const result = await service.findOne(1);

      expect(result).toEqual(cliente);
      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { contatos: true, subclientes: true },
      });
    });
  });
});
```

### Unit — Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from 'src/clientes/clientes.controller';
import { ClientesService } from 'src/clientes/clientes.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

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
      const cliente = { id: 1, nome: 'Teste' };
      (service.findOne as jest.Mock).mockResolvedValue(cliente);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(cliente);
    });
  });
});
```

### E2E — Supertest

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
});
```

## Padrões de Mock — $transaction

```typescript
// createPrismaMock() já configura $transaction corretamente:
mock.$transaction.mockImplementation((arg: unknown) => {
  if (typeof arg === 'function') return arg(mock); // callback recebe o mock como tx
  if (Array.isArray(arg)) return Promise.all(arg); // array de promises
  return Promise.resolve();
});

// Nos testes, verificar chamada:
expect(prisma.$transaction).toHaveBeenCalled();

// Para operações dentro da transação, mockar antes:
prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 0 });
prisma.contatoCliente.create.mockResolvedValue({ id: 1, nome: 'Novo' });
```

## Padrões de DTO

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClienteDto {
  @ApiProperty({ example: 'Empresa ABC' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ type: [ContatoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContatoDto)
  contatos?: ContatoDto[];
}
```

- `@ApiProperty` para campos obrigatórios, `@ApiPropertyOptional` para opcionais
- `@IsOptional()` antes de validadores em campos opcionais
- `@ValidateNested` + `@Type(() => Dto)` para objetos aninhados

## Padrões de Tratamento de Erro

| Situação              | Exceção                  | Exemplo de mensagem                    |
|-----------------------|--------------------------|----------------------------------------|
| Recurso não existe    | `NotFoundException`      | `'Cliente não encontrado'`             |
| Duplicidade           | `ConflictException`      | `'Email já cadastrado'`                |
| Dados inválidos       | `BadRequestException`    | `'Quantidade deve ser maior que zero'` |
| Sem permissão         | `ForbiddenException`     | `'Sem permissão para esta ação'`       |
| Credenciais inválidas | `UnauthorizedException`  | `'Credenciais inválidas'`              |

Mensagens sempre em português brasileiro.

## Padrão de Paginação

O retorno padrão de listas paginadas usa `{ items, total, page, limit, totalPages }`:

```typescript
async findAll(params: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 15 } = params;
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [{ nome: { contains: search } }] }
    : {};

  const [items, total] = await Promise.all([
    this.prisma.entidade.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
    }),
    this.prisma.entidade.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

## Convenções de Permissões

Padrão: `SETOR.ENTIDADE.ACAO`

| Setor          | Entidades típicas                      | Ações                    |
|----------------|----------------------------------------|--------------------------|
| AGENDAMENTO    | CLIENTE, TECNICO, ORDEM_SERVICO        | LISTAR, CRIAR, EDITAR    |
| ADMINISTRATIVO | USUARIO, CARGO                         | LISTAR, CRIAR, EDITAR    |
| CONFIGURACAO   | EQUIPAMENTO, APARELHO, OPERADORA       | LISTAR, CRIAR, EDITAR    |

Exemplo no controller:

```typescript
@Get()
@RequirePermissions('AGENDAMENTO.CLIENTE.LISTAR')
@ApiOperation({ summary: 'Listar clientes' })
findAll() {
  return this.clientesService.findAll();
}
```

## Comandos Úteis

```bash
# Rodar testes unitários
npm run test

# Rodar em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:cov

# Rodar testes E2E
npm run test:e2e

# Lint
npm run lint
```
