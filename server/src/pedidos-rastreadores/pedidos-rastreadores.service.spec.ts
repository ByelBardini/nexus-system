import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosRastreadoresService } from './pedidos-rastreadores.service';
import { CreatePedidoRastreadorDto } from './dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto';
import {
  StatusPedidoRastreador,
  StatusAparelho,
  TipoDestinoPedido,
  UrgenciaPedido,
} from '@prisma/client';

describe('PedidosRastreadoresService', () => {
  let service: PedidosRastreadoresService;
  let prisma: PrismaService;

  const prismaMock = {
    pedidoRastreador: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    pedidoRastreadorHistorico: {
      create: jest.fn(),
    },
    aparelho: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    aparelhoHistorico: {
      create: jest.fn(),
    },
    kit: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(prismaMock),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosRastreadoresService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PedidosRastreadoresService>(PedidosRastreadoresService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retorna lista paginada de pedidos', async () => {
      const pedidos = [
        {
          id: 1,
          codigo: 'PED-0001',
          tipoDestino: TipoDestinoPedido.TECNICO,
          tecnicoId: 1,
          clienteId: null,
          subclienteId: null,
          quantidade: 5,
          status: StatusPedidoRastreador.SOLICITADO,
          urgencia: UrgenciaPedido.MEDIA,
          dataSolicitacao: new Date(),
          tecnico: { id: 1, nome: 'João Silva' },
          cliente: null,
          subcliente: null,
          marcaEquipamento: null,
          modeloEquipamento: null,
          operadora: null,
          deCliente: null,
        },
      ];
      (prisma.pedidoRastreador.findMany as jest.Mock).mockResolvedValue(pedidos);
      (prisma.pedidoRastreador.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 15 });

      expect(result).toEqual({
        data: pedidos,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(prisma.pedidoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 15,
          orderBy: expect.any(Object),
        }),
      );
      expect(prisma.pedidoRastreador.count).toHaveBeenCalled();
    });

    it('filtra por status quando informado', async () => {
      (prisma.pedidoRastreador.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.pedidoRastreador.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 15,
        status: StatusPedidoRastreador.EM_CONFIGURACAO,
      });

      expect(prisma.pedidoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: StatusPedidoRastreador.EM_CONFIGURACAO,
          }),
        }),
      );
    });

    it('busca por codigo ou destinatário quando search informado', async () => {
      (prisma.pedidoRastreador.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.pedidoRastreador.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 15, search: 'PED-0042' });

      expect(prisma.pedidoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando pedido não existe', async () => {
      (prisma.pedidoRastreador.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Pedido de rastreador não encontrado',
      );
    });

    it('retorna pedido quando encontrado', async () => {
      const pedido = {
        id: 1,
        codigo: 'PED-0001',
        tipoDestino: TipoDestinoPedido.TECNICO,
        tecnicoId: 1,
        subclienteId: null,
        quantidade: 5,
        tecnico: { id: 1, nome: 'João Silva' },
        subcliente: null,
        historico: [],
      };
      (prisma.pedidoRastreador.findUnique as jest.Mock).mockResolvedValue(
        pedido,
      );

      const result = await service.findOne(1);

      expect(result).toEqual(pedido);
      expect(prisma.pedidoRastreador.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({
          tecnico: true,
          subcliente: expect.any(Object),
          historico: expect.any(Object),
        }),
      });
    });
  });

  describe('create', () => {
    it('gera codigo PED-XXXX sequencial e cria pedido com tipo TECNICO', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: TipoDestinoPedido.TECNICO,
        tecnicoId: 1,
        quantidade: 10,
        urgencia: UrgenciaPedido.URGENTE,
      };
      (prisma.pedidoRastreador.findFirst as jest.Mock).mockResolvedValue({
        codigo: 'PED-0041',
      });
      const pedidoCriado = {
        id: 42,
        codigo: 'PED-0042',
        ...dto,
        tecnico: { id: 1, nome: 'João' },
      };
      (prisma.pedidoRastreador.create as jest.Mock).mockResolvedValue(
        pedidoCriado,
      );

      const result = await service.create(dto, 100);

      expect(result.codigo).toMatch(/^PED-\d{4}$/);
      expect(result.tecnico).toBeDefined();
      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipoDestino: TipoDestinoPedido.TECNICO,
            tecnicoId: 1,
            subclienteId: null,
            quantidade: 10,
            criadoPorId: 100,
          }),
        }),
      );
    });

    it('cria pedido com tipo CLIENTE (subclienteId)', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: TipoDestinoPedido.CLIENTE,
        subclienteId: 5,
        quantidade: 4,
      };
      (prisma.pedidoRastreador.findFirst as jest.Mock).mockResolvedValue(null);
      const pedidoCriado = {
        id: 1,
        codigo: 'PED-0001',
        ...dto,
        subcliente: { id: 5, nome: 'Cliente X', cliente: {} },
      };
      (prisma.pedidoRastreador.create as jest.Mock).mockResolvedValue(
        pedidoCriado,
      );

      const result = await service.create(dto);

      expect(result.subcliente).toBeDefined();
      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipoDestino: TipoDestinoPedido.CLIENTE,
            tecnicoId: null,
            clienteId: null,
            subclienteId: 5,
          }),
        }),
      );
    });

    it('cria pedido com tipo CLIENTE (clienteId)', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: TipoDestinoPedido.CLIENTE,
        clienteId: 3,
        quantidade: 2,
      };
      (prisma.pedidoRastreador.findFirst as jest.Mock).mockResolvedValue(null);
      const pedidoCriado = {
        id: 1,
        codigo: 'PED-0001',
        ...dto,
        cliente: { id: 3, nome: 'Associação XYZ' },
      };
      (prisma.pedidoRastreador.create as jest.Mock).mockResolvedValue(
        pedidoCriado,
      );

      const result = await service.create(dto);

      expect(result.cliente).toBeDefined();
      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipoDestino: TipoDestinoPedido.CLIENTE,
            tecnicoId: null,
            clienteId: 3,
            subclienteId: null,
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('atualiza status e registra no histórico', async () => {
      const pedidoExistente = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.SOLICITADO,
        tecnico: {},
        subcliente: null,
        historico: [],
      };
      (prisma.pedidoRastreador.findUnique as jest.Mock)
        .mockResolvedValueOnce(pedidoExistente)
        .mockResolvedValueOnce({
          ...pedidoExistente,
          status: StatusPedidoRastreador.EM_CONFIGURACAO,
        });
      (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
      (prisma.pedidoRastreador.update as jest.Mock).mockResolvedValue({});

      const dto: UpdateStatusPedidoDto = {
        status: StatusPedidoRastreador.EM_CONFIGURACAO,
        observacao: 'Iniciando configuração',
      };

      await service.updateStatus(1, dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.pedidoRastreadorHistorico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            pedidoRastreadorId: 1,
            statusAnterior: StatusPedidoRastreador.SOLICITADO,
            statusNovo: StatusPedidoRastreador.EM_CONFIGURACAO,
            observacao: 'Iniciando configuração',
          },
        }),
      );
      expect(prisma.pedidoRastreador.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: StatusPedidoRastreador.EM_CONFIGURACAO }),
      });
    });

    it('preenche entregueEm quando status é ENTREGUE', async () => {
      const pedidoExistente = {
        id: 1,
        status: StatusPedidoRastreador.DESPACHADO,
        tecnico: {},
        subcliente: null,
        historico: [],
      };
      (prisma.pedidoRastreador.findUnique as jest.Mock)
        .mockResolvedValueOnce(pedidoExistente)
        .mockResolvedValueOnce({
          ...pedidoExistente,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
      (prisma.pedidoRastreador.update as jest.Mock).mockResolvedValue({});

      const dto: UpdateStatusPedidoDto = {
        status: StatusPedidoRastreador.ENTREGUE,
      };

      await service.updateStatus(1, dto);

      expect(prisma.pedidoRastreador.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: StatusPedidoRastreador.ENTREGUE,
          entregueEm: expect.any(Date),
        }),
      });
    });

    it('ao retroceder de DESPACHADO para CONFIGURADO, atualiza aparelhos dos kits para CONFIGURADO (Em Kit)', async () => {
      const pedidoDespachado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        kitIds: [10, 11],
        tecnicoId: null,
        tecnico: null,
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        { id: 101, kitId: 10, status: StatusAparelho.DESPACHADO, tipo: 'RASTREADOR' },
        { id: 102, kitId: 10, status: StatusAparelho.DESPACHADO, tipo: 'RASTREADOR' },
      ];
      (prisma.pedidoRastreador.findUnique as jest.Mock)
        .mockResolvedValueOnce(pedidoDespachado)
        .mockResolvedValueOnce({
          ...pedidoDespachado,
          status: StatusPedidoRastreador.CONFIGURADO,
        });
      (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
      (prisma.pedidoRastreador.update as jest.Mock).mockResolvedValue({});
      (prisma.aparelho.findMany as jest.Mock).mockResolvedValue(aparelhosNoKit);
      (prisma.aparelhoHistorico.create as jest.Mock).mockResolvedValue({});
      (prisma.aparelho.update as jest.Mock).mockResolvedValue({});

      const dto: UpdateStatusPedidoDto = {
        status: StatusPedidoRastreador.CONFIGURADO,
      };

      await service.updateStatus(1, dto);

      expect(prisma.aparelho.findMany).toHaveBeenCalledWith({
        where: {
          kitId: { in: [10, 11] },
          tipo: 'RASTREADOR',
        },
      });
      expect(prisma.aparelho.update).toHaveBeenCalledTimes(2);
      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { status: StatusAparelho.CONFIGURADO, tecnicoId: null, clienteId: null },
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 102 },
        data: { status: StatusAparelho.CONFIGURADO, tecnicoId: null, clienteId: null },
      });
    });

    it('ao retroceder de ENTREGUE para CONFIGURADO, atualiza aparelhos dos kits para CONFIGURADO (Em Kit)', async () => {
      const pedidoEntregue = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.ENTREGUE,
        kitIds: [10],
        tecnicoId: 5,
        tecnico: { id: 5 },
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        { id: 201, kitId: 10, status: StatusAparelho.COM_TECNICO, tipo: 'RASTREADOR' },
      ];
      (prisma.pedidoRastreador.findUnique as jest.Mock)
        .mockResolvedValueOnce(pedidoEntregue)
        .mockResolvedValueOnce({
          ...pedidoEntregue,
          status: StatusPedidoRastreador.CONFIGURADO,
        });
      (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
      (prisma.pedidoRastreador.update as jest.Mock).mockResolvedValue({});
      (prisma.aparelho.findMany as jest.Mock).mockResolvedValue(aparelhosNoKit);
      (prisma.aparelhoHistorico.create as jest.Mock).mockResolvedValue({});
      (prisma.aparelho.update as jest.Mock).mockResolvedValue({});

      const dto: UpdateStatusPedidoDto = {
        status: StatusPedidoRastreador.CONFIGURADO,
      };

      await service.updateStatus(1, dto);

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: { status: StatusAparelho.CONFIGURADO, tecnicoId: null, clienteId: null },
      });
    });
  });
});
