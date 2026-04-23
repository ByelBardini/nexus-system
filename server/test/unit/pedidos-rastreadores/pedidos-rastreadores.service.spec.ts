import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PedidosRastreadoresService } from 'src/pedidos-rastreadores/pedidos-rastreadores.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { PedidosRastreadoresProprietarioDebitoHelper } from 'src/pedidos-rastreadores/pedidos-rastreadores-proprietario-debito.helper';
import { CreatePedidoRastreadorDto } from 'src/pedidos-rastreadores/dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from 'src/pedidos-rastreadores/dto/update-status-pedido.dto';
import { BulkAparelhoDestinatarioDto } from 'src/pedidos-rastreadores/dto/bulk-aparelho-destinatario.dto';
import {
  StatusPedidoRastreador,
  StatusAparelho,
  TipoDestinoPedido,
  UrgenciaPedido,
  ProprietarioTipo,
} from '@prisma/client';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('PedidosRastreadoresService', () => {
  let service: PedidosRastreadoresService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let consolidarDebitoTxMock: jest.Mock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    consolidarDebitoTxMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosRastreadoresService,
        PedidosRastreadoresProprietarioDebitoHelper,
        { provide: PrismaService, useValue: prisma },
        {
          provide: DebitosRastreadoresService,
          useValue: { consolidarDebitoTx: consolidarDebitoTxMock },
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
    it('quando status não muda, não abre transação e busca o pedido duas vezes', async () => {
      const pedido = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.SOLICITADO,
        tecnico: {},
        subcliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedido)
        .mockResolvedValueOnce(pedido);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.SOLICITADO,
      });

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.pedidoRastreador.findUnique).toHaveBeenCalledTimes(2);
    });

    it('MISTO ao ENTREGUE com dois aparelhos mesma marca/modelo consulta marca e modelo uma vez cada no tx', async () => {
      const pedidoBase = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: TipoDestinoPedido.MISTO,
        kitIds: [10],
        tecnicoId: 5,
        clienteId: null,
        tecnico: { id: 5, nome: 'Técnico' },
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 201,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: ProprietarioTipo.INFINITY,
          clienteId: null,
          marca: 'MarcaX',
          modelo: 'ModY',
        },
        {
          id: 202,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: ProprietarioTipo.INFINITY,
          clienteId: null,
          marca: 'MarcaX',
          modelo: 'ModY',
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoBase)
        .mockResolvedValueOnce({
          ...pedidoBase,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.kit.updateMany.mockResolvedValue({ count: 1 });
      prisma.marcaEquipamento.findFirst.mockResolvedValue({ id: 99 });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({ id: 88 });
      prisma.pedidoRastreadorAparelho.findMany.mockResolvedValue([
        {
          aparelhoId: 201,
          destinatarioProprietario: ProprietarioTipo.CLIENTE,
          destinatarioClienteId: 7,
        },
        {
          aparelhoId: 202,
          destinatarioProprietario: ProprietarioTipo.CLIENTE,
          destinatarioClienteId: 7,
        },
      ]);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(prisma.marcaEquipamento.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.modeloEquipamento.findFirst).toHaveBeenCalledTimes(1);
      expect(consolidarDebitoTxMock).toHaveBeenCalledTimes(2);
      expect(consolidarDebitoTxMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          marcaId: 99,
          modeloId: 88,
          devedorClienteId: 7,
          credorTipo: ProprietarioTipo.INFINITY,
        }),
      );
    });

    it('CLIENTE não-MISTO ao DESPACHAR consolida débito quando proprietário do aparelho difere do destino', async () => {
      const pedidoBase = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: TipoDestinoPedido.CLIENTE,
        clienteId: 50,
        subclienteId: null,
        subcliente: null,
        kitIds: [10],
        tecnicoId: null,
        tecnico: null,
        deClienteId: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 301,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: ProprietarioTipo.INFINITY,
          clienteId: null,
          marca: 'MarcaZ',
          modelo: 'ModZ',
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoBase)
        .mockResolvedValueOnce({
          ...pedidoBase,
          status: StatusPedidoRastreador.DESPACHADO,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValue({ id: 11 });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({ id: 22 });
      prisma.kit.updateMany.mockResolvedValue({ count: 1 });

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.DESPACHADO,
      });

      expect(consolidarDebitoTxMock).toHaveBeenCalledTimes(1);
      expect(consolidarDebitoTxMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          devedorTipo: ProprietarioTipo.CLIENTE,
          devedorClienteId: 50,
          credorTipo: ProprietarioTipo.INFINITY,
          marcaId: 11,
          modeloId: 22,
          pedidoId: 1,
        }),
      );
    });

    it('CLIENTE não-MISTO usa clienteId do subcliente quando clienteId do pedido é nulo', async () => {
      const pedidoBase = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: TipoDestinoPedido.CLIENTE,
        clienteId: null,
        subclienteId: 3,
        subcliente: { clienteId: 77 },
        kitIds: [10],
        tecnicoId: null,
        tecnico: null,
        deClienteId: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 401,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: ProprietarioTipo.INFINITY,
          clienteId: null,
          marca: 'M',
          modelo: 'Mo',
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoBase)
        .mockResolvedValueOnce({
          ...pedidoBase,
          status: StatusPedidoRastreador.DESPACHADO,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValue({ id: 1 });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({ id: 2 });
      prisma.kit.updateMany.mockResolvedValue({ count: 1 });

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.DESPACHADO,
      });

      expect(consolidarDebitoTxMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ devedorClienteId: 77 }),
      );
    });

    it('TECNICO não-MISTO usa deClienteId do DTO em preferência ao do pedido ao consolidar débito', async () => {
      const pedidoBase = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: TipoDestinoPedido.TECNICO,
        clienteId: null,
        subclienteId: null,
        subcliente: null,
        kitIds: [10],
        tecnicoId: 9,
        tecnico: { id: 9 },
        deClienteId: 100,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 601,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: ProprietarioTipo.INFINITY,
          clienteId: null,
          marca: 'Mt',
          modelo: 'Mot',
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoBase)
        .mockResolvedValueOnce({
          ...pedidoBase,
          status: StatusPedidoRastreador.DESPACHADO,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValue({ id: 3 });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({ id: 4 });
      prisma.kit.updateMany.mockResolvedValue({ count: 1 });

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.DESPACHADO,
        deClienteId: 200,
      });

      expect(consolidarDebitoTxMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ devedorClienteId: 200 }),
      );
    });

    it('MISTO não chama consolidar débito quando destinatário coincide com proprietário atual', async () => {
      const pedidoBase = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: TipoDestinoPedido.MISTO,
        kitIds: [10],
        tecnicoId: null,
        clienteId: null,
        tecnico: null,
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 501,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: ProprietarioTipo.INFINITY,
          clienteId: null,
          marca: 'A',
          modelo: 'B',
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoBase)
        .mockResolvedValueOnce({
          ...pedidoBase,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.pedidoRastreadorAparelho.findMany.mockResolvedValue([
        {
          aparelhoId: 501,
          destinatarioProprietario: ProprietarioTipo.INFINITY,
          destinatarioClienteId: null,
        },
      ]);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(consolidarDebitoTxMock).not.toHaveBeenCalled();
    });

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

    it('MISTO com técnico ao atingir ENTREGUE vincula tecnicoId nos aparelhos', async () => {
      const pedidoComTecnico = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: 5,
        clienteId: null,
        tecnico: { id: 5, nome: 'Ismael Vieira' },
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
        .mockResolvedValueOnce(pedidoComTecnico)
        .mockResolvedValueOnce({
          ...pedidoComTecnico,
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
          tecnicoId: 5,
        }),
      });
    });

    it('MISTO com técnico ao atingir ENTREGUE vincula tecnicoId em aparelhos de proprietário CLIENTE', async () => {
      const pedidoComTecnico = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: 5,
        clienteId: null,
        tecnico: { id: 5, nome: 'Ismael Vieira' },
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 301,
          kitId: 10,
          status: StatusAparelho.DESPACHADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: 'CLIENTE',
          clienteId: 7,
          marca: null,
          modelo: null,
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoComTecnico)
        .mockResolvedValueOnce({
          ...pedidoComTecnico,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});
      prisma.aparelho.findMany.mockResolvedValue(aparelhosNoKit);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      (prisma as any).pedidoRastreadorAparelho.findMany.mockResolvedValue([
        {
          aparelhoId: 301,
          destinatarioProprietario: 'CLIENTE',
          destinatarioClienteId: 7,
        },
      ]);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 301 },
        data: expect.objectContaining({
          status: StatusAparelho.COM_TECNICO,
          tecnicoId: 5,
        }),
      });
    });

    it('MISTO com técnico ao atingir ENTREGUE vincula tecnicoId em todos os aparelhos independente do proprietário', async () => {
      const pedidoComTecnico = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: 5,
        clienteId: null,
        tecnico: { id: 5, nome: 'Ismael Vieira' },
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
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        },
        {
          id: 202,
          kitId: 10,
          status: StatusAparelho.DESPACHADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: 'CLIENTE',
          clienteId: 7,
          marca: null,
          modelo: null,
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoComTecnico)
        .mockResolvedValueOnce({
          ...pedidoComTecnico,
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
        {
          aparelhoId: 202,
          destinatarioProprietario: 'CLIENTE',
          destinatarioClienteId: 7,
        },
      ]);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: expect.objectContaining({
          status: StatusAparelho.COM_TECNICO,
          tecnicoId: 5,
        }),
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 202 },
        data: expect.objectContaining({
          status: StatusAparelho.COM_TECNICO,
          tecnicoId: 5,
        }),
      });
    });

    it('MISTO com técnico ao atingir DESPACHADO não vincula tecnicoId nos aparelhos', async () => {
      const pedidoComTecnico = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: 5,
        clienteId: null,
        tecnico: { id: 5, nome: 'Ismael Vieira' },
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 201,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoComTecnico)
        .mockResolvedValueOnce({
          ...pedidoComTecnico,
          status: StatusPedidoRastreador.DESPACHADO,
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
        status: StatusPedidoRastreador.DESPACHADO,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: expect.objectContaining({
          status: StatusAparelho.DESPACHADO,
          tecnicoId: null,
        }),
      });
    });

    it('MISTO com técnico entregue em mãos (CONFIGURADO → ENTREGUE) vincula tecnicoId nos aparelhos', async () => {
      const pedidoConfigurado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.CONFIGURADO,
        tipoDestino: 'MISTO' as TipoDestinoPedido,
        kitIds: [10],
        tecnicoId: 5,
        clienteId: null,
        tecnico: { id: 5, nome: 'Ismael Vieira' },
        subcliente: null,
        historico: [],
      };
      const aparelhosNoKit = [
        {
          id: 201,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        },
        {
          id: 202,
          kitId: 10,
          status: StatusAparelho.CONFIGURADO,
          tipo: 'RASTREADOR',
          simVinculadoId: null,
          proprietario: 'CLIENTE',
          clienteId: 7,
          marca: null,
          modelo: null,
        },
      ];
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoConfigurado)
        .mockResolvedValueOnce({
          ...pedidoConfigurado,
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
        {
          aparelhoId: 202,
          destinatarioProprietario: 'CLIENTE',
          destinatarioClienteId: 7,
        },
      ]);

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: expect.objectContaining({
          status: StatusAparelho.COM_TECNICO,
          tecnicoId: 5,
        }),
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 202 },
        data: expect.objectContaining({
          status: StatusAparelho.COM_TECNICO,
          tecnicoId: 5,
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

    it('avança de DESPACHADO para ENTREGUE sem lançar exceção', async () => {
      const pedidoDespachado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        kitIds: null,
        tecnicoId: 5,
        tecnico: { id: 5 },
        subcliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique
        .mockResolvedValueOnce(pedidoDespachado)
        .mockResolvedValueOnce({
          ...pedidoDespachado,
          status: StatusPedidoRastreador.ENTREGUE,
        });
      prisma.pedidoRastreador.update.mockResolvedValue({});

      await service.updateStatus(1, {
        status: StatusPedidoRastreador.ENTREGUE,
      });

      expect(prisma.pedidoRastreador.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: StatusPedidoRastreador.ENTREGUE,
          entregueEm: expect.any(Date),
        }),
      });
    });

    it('retroceder de DESPACHADO para SOLICITADO lança BadRequestException', async () => {
      const pedidoDespachado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        kitIds: null,
        tecnicoId: null,
        tecnico: null,
        subcliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique.mockResolvedValueOnce(
        pedidoDespachado,
      );

      await expect(
        service.updateStatus(1, { status: StatusPedidoRastreador.SOLICITADO }),
      ).rejects.toThrow(
        'Não é possível retroceder um pedido que já foi despachado.',
      );
    });

    it('retroceder de DESPACHADO para EM_CONFIGURACAO lança BadRequestException', async () => {
      const pedidoDespachado = {
        id: 1,
        codigo: 'PED-0001',
        status: StatusPedidoRastreador.DESPACHADO,
        kitIds: null,
        tecnicoId: null,
        tecnico: null,
        subcliente: null,
        historico: [],
      };
      prisma.pedidoRastreador.findUnique.mockResolvedValueOnce(
        pedidoDespachado,
      );

      await expect(
        service.updateStatus(1, {
          status: StatusPedidoRastreador.EM_CONFIGURACAO,
        }),
      ).rejects.toThrow(
        'Não é possível retroceder um pedido que já foi despachado.',
      );
    });
  });

  describe('bulkSetDestinatarios', () => {
    it('lança NotFoundException quando pedido não existe', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue(null);

      const dto: BulkAparelhoDestinatarioDto = {
        aparelhoIds: [1],
        destinatarioProprietario: ProprietarioTipo.INFINITY,
      };

      await expect(service.bulkSetDestinatarios(9, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.bulkSetDestinatarios(9, dto)).rejects.toThrow(
        'Pedido não encontrado',
      );
    });

    it('lança BadRequestException quando destinatário não existe nos itens do pedido', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue({
        id: 1,
        itens: [
          {
            proprietario: ProprietarioTipo.CLIENTE,
            clienteId: 5,
            quantidade: 2,
            cliente: { id: 5, nome: 'A' },
          },
        ],
      });

      const dto: BulkAparelhoDestinatarioDto = {
        aparelhoIds: [10],
        destinatarioProprietario: ProprietarioTipo.CLIENTE,
        destinatarioClienteId: 99,
      };

      await expect(service.bulkSetDestinatarios(1, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.bulkSetDestinatarios(1, dto)).rejects.toThrow(
        'Destinatário não encontrado nos itens do pedido',
      );
    });

    it('lança BadRequestException quando quota do item seria excedida', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue({
        id: 1,
        itens: [
          {
            proprietario: ProprietarioTipo.INFINITY,
            clienteId: null,
            quantidade: 1,
            cliente: null,
          },
        ],
      });
      prisma.pedidoRastreadorAparelho.count.mockResolvedValue(0);

      const dto: BulkAparelhoDestinatarioDto = {
        aparelhoIds: [1, 2],
        destinatarioProprietario: ProprietarioTipo.INFINITY,
      };

      await expect(service.bulkSetDestinatarios(1, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.bulkSetDestinatarios(1, dto)).rejects.toThrow(
        /Quota excedida/,
      );
    });

    it('faz upsert de cada aparelho quando dentro da quota', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue({
        id: 1,
        itens: [
          {
            proprietario: ProprietarioTipo.CLIENTE,
            clienteId: 3,
            quantidade: 5,
            cliente: { id: 3, nome: 'C' },
          },
        ],
      });
      prisma.pedidoRastreadorAparelho.count.mockResolvedValue(0);
      prisma.pedidoRastreadorAparelho.upsert.mockResolvedValue({} as never);

      const dto: BulkAparelhoDestinatarioDto = {
        aparelhoIds: [10, 11],
        destinatarioProprietario: ProprietarioTipo.CLIENTE,
        destinatarioClienteId: 3,
      };

      await service.bulkSetDestinatarios(1, dto);

      expect(prisma.pedidoRastreadorAparelho.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.pedidoRastreadorAparelho.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            pedidoRastreadorId_aparelhoId: {
              pedidoRastreadorId: 1,
              aparelhoId: 10,
            },
          },
        }),
      );
    });
  });

  describe('getAparelhosDestinatarios', () => {
    it('lança NotFoundException quando pedido não existe', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue(null);

      await expect(service.getAparelhosDestinatarios(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna assignments e quotaUsage por item', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue({
        id: 1,
        itens: [
          {
            proprietario: ProprietarioTipo.INFINITY,
            clienteId: null,
            quantidade: 2,
            cliente: null,
          },
          {
            proprietario: ProprietarioTipo.CLIENTE,
            clienteId: 7,
            quantidade: 1,
            cliente: { id: 7, nome: 'Cliente Sete' },
          },
        ],
        aparelhosDestinatarios: [
          {
            aparelhoId: 100,
            destinatarioProprietario: ProprietarioTipo.INFINITY,
            destinatarioClienteId: null,
          },
          {
            aparelhoId: 101,
            destinatarioProprietario: ProprietarioTipo.CLIENTE,
            destinatarioClienteId: 7,
          },
        ],
      });

      const result = await service.getAparelhosDestinatarios(1);

      expect(result.assignments).toHaveLength(2);
      expect(result.quotaUsage).toEqual([
        expect.objectContaining({
          proprietario: ProprietarioTipo.INFINITY,
          clienteNome: 'Infinity',
          atribuido: 1,
          total: 2,
        }),
        expect.objectContaining({
          proprietario: ProprietarioTipo.CLIENTE,
          clienteId: 7,
          clienteNome: 'Cliente Sete',
          atribuido: 1,
          total: 1,
        }),
      ]);
    });
  });

  describe('removeAparelhoDestinatario', () => {
    it('remove vínculo pedido-aparelho', async () => {
      prisma.pedidoRastreadorAparelho.deleteMany.mockResolvedValue({
        count: 1,
      });

      await service.removeAparelhoDestinatario(1, 50);

      expect(prisma.pedidoRastreadorAparelho.deleteMany).toHaveBeenCalledWith({
        where: { pedidoRastreadorId: 1, aparelhoId: 50 },
      });
    });
  });

  describe('updateKitIds', () => {
    it('lança NotFoundException quando pedido não existe', async () => {
      prisma.pedidoRastreador.findUnique.mockResolvedValue(null);

      await expect(service.updateKitIds(1, [10])).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.pedidoRastreador.update).not.toHaveBeenCalled();
    });

    it('atualiza kitIds e retorna pedido com include base', async () => {
      const pedido = {
        id: 1,
        codigo: 'PED-0001',
        historico: [],
      };
      prisma.pedidoRastreador.findUnique.mockResolvedValue(pedido);
      const atualizado = { ...pedido, kitIds: [10, 11] };
      prisma.pedidoRastreador.update.mockResolvedValue(atualizado as never);

      const result = await service.updateKitIds(1, [10, 11]);

      expect(prisma.pedidoRastreador.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { kitIds: [10, 11] },
        include: expect.objectContaining({
          tecnico: true,
          itens: expect.any(Object),
        }),
      });
      expect(result).toEqual(atualizado);
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
