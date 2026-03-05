import { Test, TestingModule } from '@nestjs/testing';
import { OrdensServicoController } from 'src/ordens-servico/ordens-servico.controller';
import { OrdensServicoService } from 'src/ordens-servico/ordens-servico.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { StatusOS } from '@prisma/client';

describe('OrdensServicoController', () => {
  let controller: OrdensServicoController;
  let service: OrdensServicoService;

  const serviceMock = {
    getResumo: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdensServicoController],
      providers: [{ provide: OrdensServicoService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdensServicoController>(OrdensServicoController);
    service = module.get<OrdensServicoService>(OrdensServicoService);
    jest.clearAllMocks();
  });

  describe('getResumo', () => {
    it('delega para service.getResumo', async () => {
      const resumo = { agendado: 5, emTestes: 3, testesRealizados: 2, aguardandoCadastro: 1, finalizado: 10 };
      (service.getResumo as jest.Mock).mockResolvedValue(resumo);

      const result = await controller.getResumo();

      expect(service.getResumo).toHaveBeenCalled();
      expect(result).toEqual(resumo);
    });
  });

  describe('findAll', () => {
    it('converte page e limit para número e repassa parâmetros', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      await controller.findAll('2', '20', StatusOS.AGENDADO, 'Carlos');

      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        status: StatusOS.AGENDADO,
        search: 'Carlos',
      });
    });

    it('passa undefined quando page e limit não informados', async () => {
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

  describe('findOne', () => {
    it('converte id para número e chama service', async () => {
      const os = { id: 7, numero: 7 };
      (service.findOne as jest.Mock).mockResolvedValue(os);

      const result = await controller.findOne('7');

      expect(service.findOne).toHaveBeenCalledWith(7);
      expect(result).toEqual(os);
    });
  });

  describe('create', () => {
    it('chama service.create com o DTO sem criadoPorId', async () => {
      const dto = { tipo: 'INSTALACAO', clienteId: 1 };
      (service.create as jest.Mock).mockResolvedValue({ id: 1, numero: 1 });

      await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateStatus', () => {
    it('converte id e chama service.updateStatus', async () => {
      const dto = { status: StatusOS.EM_TESTES };
      (service.updateStatus as jest.Mock).mockResolvedValue({ id: 3, status: StatusOS.EM_TESTES });

      await controller.updateStatus('3', dto);

      expect(service.updateStatus).toHaveBeenCalledWith(3, dto);
    });
  });
});
