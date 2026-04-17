import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PedidosRastreadoresService } from 'src/pedidos-rastreadores/pedidos-rastreadores.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { CreatePedidoRastreadorDto } from 'src/pedidos-rastreadores/dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from 'src/pedidos-rastreadores/dto/update-status-pedido.dto';
import {
  StatusPedidoRastreador,
  StatusAparelho,
  TipoDestinoPedido,
  UrgenciaPedido,
} from '@prisma/client';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('PedidosRastreadoresService', () => {
  let service: PedidosRastreadoresService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosRastreadoresService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: DebitosRastreadoresService,
          useValue: { consolidarDebitoTx: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PedidosRastreadoresService>(
      PedidosRastreadoresService,
    );
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
      prisma.pedidoRastreador.findMany.mockResolvedValue(pedidos);
      prisma.pedidoRastreador.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 15 });

      expect(result).toEqual({
        data: pedidos,
        total: 1,
        page: 1,
        limit: 15,
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
      prisma.pedidoRastreador.findMany.mockResolvedValue([]);
      prisma.pedidoRastreador.count.mockResolvedValue(0);

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
      prisma.pedidoRastreador.findMany.mockResolvedValue([]);
      prisma.pedidoRastreador.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 15, search: 'PED-0042' });

      expect(prisma.pedidoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('busca por nome do cliente de um item MISTO inclui pedidos mistos no resultado', async () => {
      prisma.pedidoRastreador.findMany.mockResolvedValue([]);
      prisma.pedidoRastreador.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 15, search: 'Cliente XYZ' });

      expect(prisma.pedidoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                itens: {
                  some: {
                    cliente: {
                      nome: { contains: 'Cliente XYZ', mode: 'insensitive' },
                    },
                  },
                },
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando pedido não existe', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue(null);

      const promise = service.findOne(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
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
      prisma.pedidoRastreador.findUnique.mockResolvedValue(pedido);

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
      prisma.pedidoRastreador.findFirst.mockResolvedValue({
        codigo: 'PED-0041',
      });
      const pedidoCriado = {
        id: 42,
        codigo: 'PED-0042',
        ...dto,
        tecnico: { id: 1, nome: 'João' },
      };
      prisma.pedidoRastreador.create.mockResolvedValue(pedidoCriado);

      const result = await service.create(dto, 100);

      expect(result.codigo).toMatch(/^PED-\d{4}$/);
      expect(result.tecnico).toMatchObject({ id: 1, nome: 'João' });
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
      prisma.pedidoRastreador.findFirst.mockResolvedValue(null);
      const pedidoCriado = {
        id: 1,
        codigo: 'PED-0001',
        ...dto,
        subcliente: { id: 5, nome: 'Cliente X', cliente: {} },
      };
      prisma.pedidoRastreador.create.mockResolvedValue(pedidoCriado);

      const result = await service.create(dto);

      expect(result.subcliente).toMatchObject({ id: 5, nome: 'Cliente X' });
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
      prisma.pedidoRastreador.findFirst.mockResolvedValue(null);
      const pedidoCriado = {
        id: 1,
        codigo: 'PED-0001',
        ...dto,
        cliente: { id: 3, nome: 'Associação XYZ' },
      };
      prisma.pedidoRastreador.create.mockResolvedValue(pedidoCriado);

      const result = await service.create(dto);

      expect(result.cliente).toMatchObject({ id: 3, nome: 'Associação XYZ' });
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

    it('cria pedido MISTO com quantidade derivada da soma dos itens', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        itens: [
          { proprietario: 'INFINITY' as any, quantidade: 5 },
          { proprietario: 'CLIENTE' as any, clienteId: 3, quantidade: 3 },
        ],
        urgencia: UrgenciaPedido.MEDIA,
      } as any;
      prisma.pedidoRastreador.findFirst.mockResolvedValue({
        codigo: 'PED-0010',
      });
      prisma.pedidoRastreador.create.mockResolvedValue({
        id: 11,
        codigo: 'PED-0011',
        quantidade: 8,
        itens: [],
      });

      await service.create(dto, 1);

      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipoDestino: 'MISTO',
            quantidade: 8,
            tecnicoId: undefined,
            clienteId: null,
            subclienteId: null,
            itens: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  proprietario: 'INFINITY',
                  quantidade: 5,
                  clienteId: null,
                }),
                expect.objectContaining({
                  proprietario: 'CLIENTE',
                  clienteId: 3,
                  quantidade: 3,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it('item INFINITY nunca envia clienteId ao banco mesmo que presente no DTO', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        itens: [
          { proprietario: 'INFINITY' as any, clienteId: 99, quantidade: 2 },
        ],
      } as any;
      prisma.pedidoRastreador.findFirst.mockResolvedValue(null);
      prisma.pedidoRastreador.create.mockResolvedValue({
        id: 1,
        codigo: 'PED-0001',
        quantidade: 2,
        itens: [],
      });

      await service.create(dto);

      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itens: {
              create: [
                expect.objectContaining({
                  proprietario: 'INFINITY',
                  clienteId: null,
                }),
              ],
            },
          }),
        }),
      );
    });

    it('cria pedido MISTO com marca/modelo/operadora independentes por item', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        itens: [
          {
            proprietario: 'CLIENTE' as any,
            clienteId: 1,
            quantidade: 4,
            marcaEquipamentoId: 10,
            modeloEquipamentoId: 20,
            operadoraId: 5,
          },
          { proprietario: 'INFINITY' as any, quantidade: 2 },
        ],
      } as any;
      prisma.pedidoRastreador.findFirst.mockResolvedValue(null);
      prisma.pedidoRastreador.create.mockResolvedValue({
        id: 1,
        codigo: 'PED-0001',
        quantidade: 6,
        itens: [],
      });

      await service.create(dto);

      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itens: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  proprietario: 'CLIENTE',
                  clienteId: 1,
                  marcaEquipamentoId: 10,
                  modeloEquipamentoId: 20,
                  operadoraId: 5,
                }),
                expect.objectContaining({
                  proprietario: 'INFINITY',
                  marcaEquipamentoId: null,
                  modeloEquipamentoId: null,
                  operadoraId: null,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it('cria pedido MISTO com 3 itens e quantidade total correta', async () => {
      const dto: CreatePedidoRastreadorDto = {
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        itens: [
          { proprietario: 'INFINITY' as any, quantidade: 5 },
          { proprietario: 'CLIENTE' as any, clienteId: 1, quantidade: 3 },
          { proprietario: 'CLIENTE' as any, clienteId: 2, quantidade: 7 },
        ],
      } as any;
      prisma.pedidoRastreador.findFirst.mockResolvedValue(null);
      prisma.pedidoRastreador.create.mockResolvedValue({
        id: 1,
        codigo: 'PED-0001',
        quantidade: 15,
        itens: [],
      });

      await service.create(dto);

      expect(prisma.pedidoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantidade: 15 }),
        }),
      );
      const chamada = prisma.pedidoRastreador.create.mock.calls[0][0];
      expect(chamada.data.itens.create).toHaveLength(3);
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
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoExistente)
        .mockResolvedValueOnce({
          ...pedidoExistente,
          status: StatusPedidoRastreador.EM_CONFIGURACAO,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});

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
        data: expect.objectContaining({
          status: StatusPedidoRastreador.EM_CONFIGURACAO,
        }),
      });
    });

    it('preenche entregueEm quando status é ENTREGUE', async () => {
      const pedidoExistente = {
        id: 1,
        status: StatusPedidoRastreador.EM_CONFIGURACAO,
        tecnico: {},
        subcliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoExistente)
        .mockResolvedValueOnce({
          ...pedidoExistente,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});

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

    it('ao retroceder de DESPACHADO para CONFIGURADO, lança BadRequestException', async () => {
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
      prisma.pedidoRastreador.findUnique.mockResolvedValueOnce(
        pedidoDespachado,
      );

      const dto: UpdateStatusPedidoDto = {
        status: StatusPedidoRastreador.CONFIGURADO,
      };

      await expect(service.updateStatus(1, dto)).rejects.toThrow(
        'Não é possível retroceder um pedido que já foi despachado.',
      );
    });

    it('ao retroceder de ENTREGUE para CONFIGURADO, atualiza aparelhos dos kits', async () => {
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
        {
          id: 201,
          kitId: 10,
          status: StatusAparelho.COM_TECNICO,
          tipo: 'RASTREADOR',
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoEntregue)
        .mockResolvedValueOnce({
          ...pedidoEntregue,
          status: StatusPedidoRastreador.CONFIGURADO,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      const dto: UpdateStatusPedidoDto = {
        status: StatusPedidoRastreador.CONFIGURADO,
      };

      await service.updateStatus(1, dto);

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: {
          status: StatusAparelho.CONFIGURADO,
          tecnicoId: null,
          clienteId: null,
        },
      });
    });

    it('MISTO ao atingir ENTREGUE não vincula clienteId nem tecnicoId nos aparelhos', async () => {
      const pedidoDespachado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.EM_CONFIGURACAO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: null,
        clienteId: null,
        tecnico: null,
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 201,
          kitId: 10,
          status: StatusAparelho.DESPACHADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoDespachado)
        .mockResolvedValueOnce({
          ...pedidoDespachado,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      (prisma as any).pedidoRastreadorAparelho.findMany.mockResolvedValue([
        {
          aparelhoId: 201,
          destinatarioProprietario: 'INFINITY',
          destinatarioClienteId: null,
        },
      ]);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: expect.objectContaining({
          status: StatusAparelho.COM_TECNICO,
          clienteId: null,
          tecnicoId: null,
        }),
      });
    });

    it('MISTO ao retroceder de DESPACHADO para CONFIGURADO lança BadRequestException', async () => {
      const pedidoDespachado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: null,
        tecnico: null,
        subcliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique.mockResolvedValueOnce(
        pedidoDespachado,
      );

      await expect(
        service.updateStatus(1, { status: StatusPedidoRastreador.CONFIGURADO }),
      ).rejects.toThrow(
        'Não é possível retroceder um pedido que já foi despachado.',
      );
    });
  });

  describe('remove', () => {
    it('lança NotFoundException quando pedido não existe', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prisma.pedidoRastreador.delete).not.toHaveBeenCalled();
    });

    it('deleta pedido existente', async () => {
      const pedido = {
        id: 1,
        codigo: 'PED-0001',
        tipoDestino: TipoDestinoPedido.TECNICO,
        tecnicoId: 1,
        tecnico: { id: 1, nome: 'João' },
        cliente: null,
        subcliente: null,
        marcaEquipamento: null,
        modeloEquipamento: null,
        operadora: null,
        deCliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique.mockResolvedValue(pedido);
      prisma.pedidoRastreador.delete.mockResolvedValue(pedido as never);

      await service.remove(1);

      expect(prisma.pedidoRastreador.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
