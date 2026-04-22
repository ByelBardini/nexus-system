import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { CLIENTE_INFINITY_ID } from 'src/common/constants';
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

  describe('findAll', () => {
    it('retorna lista de clientes sem subclientes por padrão', async () => {
      const clientes = [
        {
          id: 2,
          nome: 'Cliente A',
          contatos: [],
          _count: { ordensServico: 0 },
        },
      ];
      prisma.cliente.findMany.mockResolvedValue(clientes);

      const result = await service.findAll();

      expect(result).toEqual(clientes);
      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { nome: 'asc' } }),
      );
    });

    it('exclui o cliente com CLIENTE_INFINITY_ID da listagem', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { not: CLIENTE_INFINITY_ID } },
        }),
      );
    });

    it('inclui subclientes quando includeSubclientes é true', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      await service.findAll({ includeSubclientes: true });

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ subclientes: true }),
        }),
      );
    });

    it('não inclui subclientes quando includeSubclientes é false', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      await service.findAll({ includeSubclientes: false });

      const call = prisma.cliente.findMany.mock.calls[0][0];
      expect(call.include).not.toHaveProperty('subclientes');
    });

    it('inclui contatos e _count de ordensServico em todos os resultados', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            contatos: true,
            _count: { select: { ordensServico: true } },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      const promise = service.findOne(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Cliente não encontrado');
    });

    it('retorna cliente quando encontrado', async () => {
      const cliente = {
        id: 1,
        nome: 'Cliente A',
        contatos: [],
        subclientes: [],
      };
      prisma.cliente.findUnique.mockResolvedValue(cliente);

      const result = await service.findOne(1);

      expect(result).toEqual(cliente);
      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { contatos: true, subclientes: true },
      });
    });

    it('sempre inclui subclientes na busca por id', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });

      await service.findOne(2);

      expect(prisma.cliente.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ subclientes: true }),
        }),
      );
    });
  });

  describe('create', () => {
    it('cria cliente sem contatos', async () => {
      const dto = { nome: 'Novo Cliente', cnpj: '12.345.678/0001-99' };
      const created = { id: 2, ...dto, contatos: [] };
      prisma.cliente.create.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(result).toEqual(created);
      expect(prisma.cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nome: 'Novo Cliente' }),
          include: { contatos: true },
        }),
      );
    });

    it('cria cliente com contatos', async () => {
      const dto = {
        nome: 'Novo Cliente',
        contatos: [
          { nome: 'João', celular: '11999999999', email: 'joao@test.com' },
        ],
      };
      const created = {
        id: 2,
        nome: 'Novo Cliente',
        contatos: [{ id: 1, nome: 'João' }],
      };
      prisma.cliente.create.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(result.contatos).toHaveLength(1);
      expect(prisma.cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contatos: expect.objectContaining({ create: expect.any(Array) }),
          }),
        }),
      );
    });

    it('cria cliente com campo cor preenchido', async () => {
      const dto = { nome: 'Cliente Azul', cor: '#3b82f6' };
      const created = { id: 2, ...dto, contatos: [] };
      prisma.cliente.create.mockResolvedValue(created);

      await service.create(dto as any);

      expect(prisma.cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cor: '#3b82f6' }),
        }),
      );
    });

    it('cria cliente sem cor (cor undefined omitida dos dados)', async () => {
      const dto = { nome: 'Cliente Sem Cor' };
      prisma.cliente.create.mockResolvedValue({ id: 2, ...dto, contatos: [] });

      await service.create(dto as any);

      const callData = prisma.cliente.create.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('cor');
    });

    it('não chama create de contatos quando contatos é array vazio', async () => {
      const dto = { nome: 'Cliente', contatos: [] };
      prisma.cliente.create.mockResolvedValue({
        id: 2,
        nome: 'Cliente',
        contatos: [],
      });

      await service.create(dto as any);

      const callData = prisma.cliente.create.mock.calls[0][0].data;
      expect(callData.contatos).toBeUndefined();
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('atualiza cliente sem contatos (sem transação)', async () => {
      const cliente = {
        id: 2,
        nome: 'Cliente A',
        contatos: [],
        subclientes: [],
      };
      prisma.cliente.findUnique.mockResolvedValue(cliente);
      const updated = { id: 2, nome: 'Cliente Atualizado', contatos: [] };
      prisma.cliente.update.mockResolvedValue(updated);

      const result = await service.update(2, { nome: 'Cliente Atualizado' });

      expect(result).toEqual(updated);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('atualiza campo cor sem disparar transação de contatos', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'Cliente A',
        contatos: [],
        subclientes: [],
      });
      const updated = {
        id: 2,
        nome: 'Cliente A',
        cor: '#ef4444',
        contatos: [],
      };
      prisma.cliente.update.mockResolvedValue(updated);

      const result = await service.update(2, { cor: '#ef4444' });

      expect(result.cor).toBe('#ef4444');
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.cliente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cor: '#ef4444' }),
        }),
      );
    });

    it('atualiza contatos via transação quando contatos são informados', async () => {
      const cliente = {
        id: 2,
        nome: 'Cliente A',
        contatos: [],
        subclientes: [],
      };
      prisma.cliente.findUnique.mockResolvedValue(cliente);
      prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contatoCliente.create.mockResolvedValue({ id: 1, nome: 'Novo' });
      const updated = {
        id: 2,
        nome: 'Cliente A',
        contatos: [{ id: 1, nome: 'Novo' }],
      };
      prisma.cliente.update.mockResolvedValue(updated);

      await service.update(2, {
        contatos: [{ nome: 'Novo', celular: '11999' }],
      } as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deleteMany recebe notIn dos ids existentes enviados', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });
      prisma.contatoCliente.findFirst.mockResolvedValue({ id: 10 });
      prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 1 });
      prisma.contatoCliente.update.mockResolvedValue({});
      prisma.cliente.update.mockResolvedValue({ id: 2, contatos: [] });

      await service.update(2, {
        contatos: [
          { id: 10, nome: 'Manter', celular: '' },
          { nome: 'Novo', celular: '' },
        ],
      } as any);

      expect(prisma.contatoCliente.deleteMany).toHaveBeenCalledWith({
        where: {
          clienteId: 2,
          id: { notIn: [10] },
        },
      });
      expect(prisma.contatoCliente.findFirst).toHaveBeenCalledWith({
        where: { id: 10, clienteId: 2 },
        select: { id: true },
      });
    });

    it('contato com id existente é atualizado via contatoCliente.update', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });
      prisma.contatoCliente.findFirst.mockResolvedValue({ id: 5 });
      prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contatoCliente.update.mockResolvedValue({});
      prisma.cliente.update.mockResolvedValue({ id: 2, contatos: [] });

      await service.update(2, {
        contatos: [{ id: 5, nome: 'Existente', celular: '11888' }],
      } as any);

      expect(prisma.contatoCliente.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { nome: 'Existente', celular: '11888', email: undefined },
      });
      expect(prisma.contatoCliente.create).not.toHaveBeenCalled();
    });

    it('contato sem id é criado via contatoCliente.create', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });
      prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contatoCliente.create.mockResolvedValue({ id: 99, nome: 'Novo' });
      prisma.cliente.update.mockResolvedValue({ id: 2, contatos: [] });

      await service.update(2, {
        contatos: [{ nome: 'Novo Contato', email: 'novo@email.com' }],
      } as any);

      expect(prisma.contatoCliente.create).toHaveBeenCalledWith({
        data: {
          clienteId: 2,
          nome: 'Novo Contato',
          celular: undefined,
          email: 'novo@email.com',
        },
      });
    });

    it('array vazio de contatos deleta todos (notIn: [])', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });
      prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 3 });
      prisma.cliente.update.mockResolvedValue({ id: 2, contatos: [] });

      await service.update(2, { contatos: [] } as any);

      expect(prisma.contatoCliente.deleteMany).toHaveBeenCalledWith({
        where: {
          clienteId: 2,
          id: { notIn: [] },
        },
      });
    });

    it('campos de dados do cliente são passados para cliente.update', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'Old',
        contatos: [],
        subclientes: [],
      });
      prisma.cliente.update.mockResolvedValue({
        id: 2,
        nome: 'New',
        contatos: [],
      });

      await service.update(2, {
        nome: 'New',
        tipoContrato: 'AQUISICAO',
        cor: '#10b981',
      } as any);

      expect(prisma.cliente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({
            nome: 'New',
            tipoContrato: 'AQUISICAO',
            cor: '#10b981',
          }),
        }),
      );
    });

    it('lança BadRequest quando id de contato não pertence ao cliente (IDOR)', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });
      prisma.contatoCliente.findFirst.mockResolvedValue(null);

      await expect(
        service.update(2, {
          contatos: [{ id: 999, nome: 'Invasão' }],
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(2, {
          contatos: [{ id: 999, nome: 'Invasão' }],
        } as any),
      ).rejects.toThrow('Contato não pertence a este cliente');

      expect(prisma.contatoCliente.deleteMany).not.toHaveBeenCalled();
      expect(prisma.contatoCliente.update).not.toHaveBeenCalled();
    });

    it('falha na validação do segundo id antes de deleteMany (não apaga contatos)', async () => {
      prisma.cliente.findUnique.mockResolvedValue({
        id: 2,
        nome: 'X',
        contatos: [],
        subclientes: [],
      });
      prisma.contatoCliente.findFirst
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce(null);

      await expect(
        service.update(2, {
          contatos: [
            { id: 10, nome: 'Válido' },
            { id: 888, nome: 'Outro cliente' },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.contatoCliente.deleteMany).not.toHaveBeenCalled();
    });
  });
});
