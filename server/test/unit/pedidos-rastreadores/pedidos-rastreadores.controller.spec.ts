import { Test, TestingModule } from '@nestjs/testing';
import { PedidosRastreadoresController } from 'src/pedidos-rastreadores/pedidos-rastreadores.controller';
import { PedidosRastreadoresService } from 'src/pedidos-rastreadores/pedidos-rastreadores.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { StatusPedidoRastreador, TipoDestinoPedido } from '@prisma/client';

describe('PedidosRastreadoresController', () => {
  let controller: PedidosRastreadoresController;
  let service: PedidosRastreadoresService;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updateKitIds: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosRastreadoresController],
      providers: [{ provide: PedidosRastreadoresService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PedidosRastreadoresController>(PedidosRastreadoresController);
    service = module.get<PedidosRastreadoresService>(PedidosRastreadoresService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('converte id de string para número com unary plus e chama o service', async () => {
      const pedido = { id: 1, codigo: 'PED-0001', tipoDestino: TipoDestinoPedido.TECNICO };
      (service.findOne as jest.Mock).mockResolvedValue(pedido);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(pedido);
    });

    it('passa id numérico corretamente para findOne', async () => {
      (service.findOne as jest.Mock).mockResolvedValue({ id: 42 });

      await controller.findOne('42');

      expect(service.findOne).toHaveBeenCalledWith(42);
    });
  });

  describe('findAll', () => {
    it('chama o service com parâmetros de paginação e filtros', async () => {
      const lista = { data: [], total: 0, page: 1, totalPages: 0 };
      (service.findAll as jest.Mock).mockResolvedValue(lista);

      await controller.findAll('2', '20', StatusPedidoRastreador.SOLICITADO, 'PED-0042');

      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        status: StatusPedidoRastreador.SOLICITADO,
        search: 'PED-0042',
      });
    });

    it('passa undefined para parâmetros omitidos', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({});

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: undefined,
        search: undefined,
      });
    });
  });

  describe('create', () => {
    it('chama o service create com o DTO e criadoPorId do usuário logado', async () => {
      const dto = { tipoDestino: TipoDestinoPedido.TECNICO, tecnicoId: 1, quantidade: 5 };
      const criado = { id: 1, codigo: 'PED-0001', ...dto };
      (service.create as jest.Mock).mockResolvedValue(criado);

      const result = await controller.create(dto, 100);

      expect(service.create).toHaveBeenCalledWith(dto, 100);
      expect(result).toEqual(criado);
    });
  });

  describe('updateStatus', () => {
    it('converte id com unary plus e chama o service updateStatus', async () => {
      const dto = { status: StatusPedidoRastreador.EM_CONFIGURACAO };
      (service.updateStatus as jest.Mock).mockResolvedValue({});

      await controller.updateStatus('7', dto);

      expect(service.updateStatus).toHaveBeenCalledWith(7, dto);
    });
  });

  describe('updateKitIds', () => {
    it('converte id com unary plus e chama o service updateKitIds com os kitIds', async () => {
      (service.updateKitIds as jest.Mock).mockResolvedValue({});

      await controller.updateKitIds('3', { kitIds: [10, 20] });

      expect(service.updateKitIds).toHaveBeenCalledWith(3, [10, 20]);
    });
  });
});
