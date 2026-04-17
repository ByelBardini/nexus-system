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

  describe('findAll', () => {
    it('retorna lista de clientes sem subclientes por padrão', async () => {
      const clientes = [
        {
          id: 1,
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

    it('inclui subclientes quando includeSubclientes é true', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      await service.findAll({ includeSubclientes: true });

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ subclientes: true }),
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
  });

  describe('create', () => {
    it('cria cliente sem contatos', async () => {
      const dto = { nome: 'Novo Cliente', cnpj: '12.345.678/0001-99' };
      const created = { id: 1, ...dto, contatos: [] };
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
        id: 1,
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
        id: 1,
        nome: 'Cliente A',
        contatos: [],
        subclientes: [],
      };
      prisma.cliente.findUnique.mockResolvedValue(cliente);
      const updated = { id: 1, nome: 'Cliente Atualizado', contatos: [] };
      prisma.cliente.update.mockResolvedValue(updated);

      const result = await service.update(1, { nome: 'Cliente Atualizado' });

      expect(result).toEqual(updated);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('atualiza contatos via transação quando contatos são informados', async () => {
      const cliente = {
        id: 1,
        nome: 'Cliente A',
        contatos: [],
        subclientes: [],
      };
      prisma.cliente.findUnique.mockResolvedValue(cliente);
      prisma.contatoCliente.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contatoCliente.create.mockResolvedValue({ id: 1, nome: 'Novo' });
      const updated = {
        id: 1,
        nome: 'Cliente A',
        contatos: [{ id: 1, nome: 'Novo' }],
      };
      prisma.cliente.update.mockResolvedValue(updated);

      await service.update(1, {
        contatos: [{ nome: 'Novo', celular: '11999' }],
      } as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
