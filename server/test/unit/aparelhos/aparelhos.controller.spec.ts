import { Test, TestingModule } from '@nestjs/testing';
import { AparelhosController } from 'src/aparelhos/aparelhos.controller';
import { AparelhosService } from 'src/aparelhos/aparelhos.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('AparelhosController', () => {
  let controller: AparelhosController;
  let service: AparelhosService;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getResumo: jest.fn(),
    createLote: jest.fn(),
    createIndividual: jest.fn(),
    updateStatus: jest.fn(),
    pareamentoPreview: jest.fn(),
    pareamento: jest.fn(),
    getKits: jest.fn(),
    getKitsComDetalhes: jest.fn(),
    getKitById: jest.fn(),
    updateAparelhoKit: jest.fn(),
    getAparelhosDisponiveisParaKit: jest.fn(),
    criarOuBuscarKitPorNome: jest.fn(),
    getLotesParaPareamento: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AparelhosController],
      providers: [{ provide: AparelhosService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AparelhosController>(AparelhosController);
    service = module.get<AparelhosService>(AparelhosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delega para service.findAll', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('converte id para número e chama service', async () => {
      const aparelho = { id: 5, identificador: '123' };
      (service.findOne as jest.Mock).mockResolvedValue(aparelho);

      const result = await controller.findOne('5');

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(aparelho);
    });
  });

  describe('getResumo', () => {
    it('delega para service.getResumo', async () => {
      const resumo = { total: 10, porStatus: {}, porTipo: {} };
      (service.getResumo as jest.Mock).mockResolvedValue(resumo);

      const result = await controller.getResumo();

      expect(service.getResumo).toHaveBeenCalled();
      expect(result).toEqual(resumo);
    });
  });

  describe('createLote', () => {
    it('chama service.createLote com o DTO', async () => {
      const dto = { referencia: 'LOT-001', quantidade: 10 };
      (service.createLote as jest.Mock).mockResolvedValue({ id: 1 });

      await controller.createLote(dto);

      expect(service.createLote).toHaveBeenCalledWith(dto);
    });
  });

  describe('createIndividual', () => {
    it('chama service.createIndividual com o DTO', async () => {
      const dto = { identificador: 'IMEI123', tipo: 'RASTREADOR' };
      (service.createIndividual as jest.Mock).mockResolvedValue({ id: 1 });

      await controller.createIndividual(dto);

      expect(service.createIndividual).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateStatus', () => {
    it('converte id e chama service.updateStatus com status e observacao', async () => {
      (service.updateStatus as jest.Mock).mockResolvedValue({});

      await controller.updateStatus('3', { status: 'CONFIGURADO', observacao: 'ok' });

      expect(service.updateStatus).toHaveBeenCalledWith(3, 'CONFIGURADO', 'ok');
    });
  });

  describe('pareamentoPreview', () => {
    it('chama service.pareamentoPreview com os pares', async () => {
      const pares = [{ imei: '123456789012345', iccid: '123456789012345678' }];
      (service.pareamentoPreview as jest.Mock).mockResolvedValue({ linhas: [], contadores: {} });

      await controller.pareamentoPreview({ pares });

      expect(service.pareamentoPreview).toHaveBeenCalledWith(pares);
    });

    it('passa lista vazia quando pares não informados', async () => {
      (service.pareamentoPreview as jest.Mock).mockResolvedValue({ linhas: [], contadores: {} });

      await controller.pareamentoPreview({} as any);

      expect(service.pareamentoPreview).toHaveBeenCalledWith([]);
    });
  });

  describe('getKits', () => {
    it('delega para service.getKits', async () => {
      (service.getKits as jest.Mock).mockResolvedValue([{ id: 1, nome: 'Kit-A' }]);

      await controller.getKits();

      expect(service.getKits).toHaveBeenCalled();
    });
  });

  describe('getKitById', () => {
    it('converte id para número e chama service', async () => {
      (service.getKitById as jest.Mock).mockResolvedValue({ id: 2, nome: 'Kit-B' });

      await controller.getKitById('2');

      expect(service.getKitById).toHaveBeenCalledWith(2);
    });
  });

  describe('updateAparelhoKit', () => {
    it('converte id e chama service.updateAparelhoKit', async () => {
      (service.updateAparelhoKit as jest.Mock).mockResolvedValue({});

      await controller.updateAparelhoKit('7', { kitId: 3 });

      expect(service.updateAparelhoKit).toHaveBeenCalledWith(7, 3);
    });
  });

  describe('getLotesRastreadores', () => {
    it('chama service.getLotesParaPareamento com tipo RASTREADOR', async () => {
      (service.getLotesParaPareamento as jest.Mock).mockResolvedValue([]);

      await controller.getLotesRastreadores();

      expect(service.getLotesParaPareamento).toHaveBeenCalledWith('RASTREADOR');
    });
  });

  describe('getLotesSims', () => {
    it('chama service.getLotesParaPareamento com tipo SIM', async () => {
      (service.getLotesParaPareamento as jest.Mock).mockResolvedValue([]);

      await controller.getLotesSims();

      expect(service.getLotesParaPareamento).toHaveBeenCalledWith('SIM');
    });
  });
});
