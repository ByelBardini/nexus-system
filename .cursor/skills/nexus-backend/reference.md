# Nexus Backend — Referência Detalhada

## Templates de Testes

### Unit — Service com PrismaService mock

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientesService } from './clientes.service';

describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: PrismaService;

  const prismaMock = {
    cliente: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('lança NotFoundException quando cliente não existe', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Cliente não encontrado');
    });

    it('retorna cliente quando encontrado', async () => {
      const cliente = { id: 1, nome: 'Cliente Teste' };
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(cliente);

      const result = await service.findOne(1);
      expect(result).toEqual(cliente);
      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });
  });
});
```

### Unit — Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

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
      providers: [
        { provide: ClientesService, useValue: serviceMock },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientesController>(ClientesController);
    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('converte id de string para número e chama o service', async () => {
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

  it('GET /clientes/:id com id inválido retorna 400', () => {
    return request(app.getHttpServer())
      .get('/clientes/abc')
      .set('Authorization', 'Bearer <token>')
      .expect(400);
  });
});
```

## Padrões de Mock — PrismaService

Para métodos usados no service, mockar apenas o que é necessário:

```typescript
const prismaMock = {
  cliente: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(prismaMock)), // passa o mock como tx
};
```

Para `$transaction`, o padrão é chamar o callback com o próprio mock quando a transação é síncrona no teste.

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

// Enums para status/tipo
export enum StatusCliente {
  ATIVO = 'ATIVO',
  PENDENTE = 'PENDENTE',
  INATIVO = 'INATIVO',
}

export class CreateClienteDto {
  @ApiProperty({ example: 'Empresa ABC' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ enum: StatusCliente })
  @IsOptional()
  @IsEnum(StatusCliente)
  status?: StatusCliente;

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

| Situação            | Exceção                | Exemplo de mensagem        |
|---------------------|------------------------|----------------------------|
| Recurso não existe  | `NotFoundException`    | `'Cliente não encontrado'` |
| Duplicidade         | `ConflictException`    | `'Email já cadastrado'`    |
| Dados inválidos     | `BadRequestException`  | `'Quantidade deve ser maior que zero'` |
| Sem permissão       | `ForbiddenException`   | `'Sem permissão para esta ação'`       |
| Credenciais inválidas | `UnauthorizedException` | `'Credenciais inválidas'` |

Mensagens sempre em português brasileiro.

## Padrão de Paginação

```typescript
async findAllPaginated(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { search, page = 1, limit = 15 } = params;
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    this.prisma.entidade.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
      include: { /* ... */ },
    }),
    this.prisma.entidade.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

## Convenções de Permissões

Padrão: `SETOR.ENTIDADE.ACAO`

| Setor           | Entidades típicas | Ações           |
|-----------------|-------------------|-----------------|
| AGENDAMENTO     | CLIENTE, TECNICO, ORDEM_SERVICO | LISTAR, CRIAR, EDITAR |
| ADMINISTRATIVO  | USUARIO, CARGO    | LISTAR, CRIAR, EDITAR |
| CONFIGURACAO    | EQUIPAMENTO       | LISTAR, CRIAR, EDITAR |

Exemplo no controller:

```typescript
@Get()
@RequirePermissions('AGENDAMENTO.CLIENTE.LISTAR')
@ApiOperation({ summary: 'Listar clientes' })
findAll() {
  return this.clientesService.findAll();
}
```
