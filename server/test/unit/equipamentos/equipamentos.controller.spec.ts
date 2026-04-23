import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { EquipamentosController } from 'src/equipamentos/equipamentos.controller';
import { EquipamentosService } from 'src/equipamentos/equipamentos.service';

describe('EquipamentosController', () => {
  let controller: EquipamentosController;
  let service: EquipamentosService;

  const serviceMock = {
    findAllMarcas: jest.fn(),
    findOneMarca: jest.fn(),
    createMarca: jest.fn(),
    updateMarca: jest.fn(),
    deleteMarca: jest.fn(),
    findAllModelos: jest.fn(),
    findOneModelo: jest.fn(),
    createModelo: jest.fn(),
    updateModelo: jest.fn(),
    deleteModelo: jest.fn(),
    findAllOperadoras: jest.fn(),
    findOneOperadora: jest.fn(),
    createOperadora: jest.fn(),
    updateOperadora: jest.fn(),
    deleteOperadora: jest.fn(),
    findAllMarcasSimcard: jest.fn(),
    findOneMarcaSimcard: jest.fn(),
    createMarcaSimcard: jest.fn(),
    updateMarcaSimcard: jest.fn(),
    deleteMarcaSimcard: jest.fn(),
    findAllPlanosSimcard: jest.fn(),
    findOnePlanoSimcard: jest.fn(),
    createPlanoSimcard: jest.fn(),
    updatePlanoSimcard: jest.fn(),
    deletePlanoSimcard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipamentosController],
      providers: [{ provide: EquipamentosService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EquipamentosController>(EquipamentosController);
    service = module.get<EquipamentosService>(EquipamentosService);
    jest.clearAllMocks();
  });

  // ============= MARCAS =============

  describe('findAllMarcas', () => {
    it('delega para service.findAllMarcas', async () => {
      (service.findAllMarcas as jest.Mock).mockResolvedValue([
        { id: 1, nome: 'Queclink' },
      ]);

      await controller.findAllMarcas();

      expect(service.findAllMarcas).toHaveBeenCalled();
    });
  });

  describe('findOneMarca', () => {
    it('repassa id numérico ao service (ParseIntPipe na rota HTTP)', async () => {
      (service.findOneMarca as jest.Mock).mockResolvedValue({
        id: 3,
        nome: 'Teltonika',
      });

      await controller.findOneMarca(3);

      expect(service.findOneMarca).toHaveBeenCalledWith(3);
    });
  });

  describe('createMarca', () => {
    it('chama service.createMarca com o DTO', async () => {
      const dto = { nome: 'Nova Marca' };
      (service.createMarca as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      await controller.createMarca(dto);

      expect(service.createMarca).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateMarca', () => {
    it('repassa id numérico e DTO ao service', async () => {
      const dto = { nome: 'Atualizada' };
      (service.updateMarca as jest.Mock).mockResolvedValue({ id: 2, ...dto });

      await controller.updateMarca(2, dto);

      expect(service.updateMarca).toHaveBeenCalledWith(2, dto);
    });
  });

  describe('deleteMarca', () => {
    it('repassa id numérico ao service.deleteMarca', async () => {
      (service.deleteMarca as jest.Mock).mockResolvedValue({ id: 5 });

      await controller.deleteMarca(5);

      expect(service.deleteMarca).toHaveBeenCalledWith(5);
    });
  });

  // ============= MODELOS =============

  describe('findAllModelos', () => {
    it('passa undefined para marcaId quando não informado', async () => {
      (service.findAllModelos as jest.Mock).mockResolvedValue([]);

      await controller.findAllModelos(undefined);

      expect(service.findAllModelos).toHaveBeenCalledWith(undefined);
    });

    it('repassa marcaId numérico ao service', async () => {
      (service.findAllModelos as jest.Mock).mockResolvedValue([]);

      await controller.findAllModelos(3);

      expect(service.findAllModelos).toHaveBeenCalledWith(3);
    });
  });

  describe('findOneModelo', () => {
    it('repassa id numérico ao service', async () => {
      (service.findOneModelo as jest.Mock).mockResolvedValue({
        id: 7,
        nome: 'GV300',
      });

      await controller.findOneModelo(7);

      expect(service.findOneModelo).toHaveBeenCalledWith(7);
    });
  });

  describe('createModelo', () => {
    it('chama service.createModelo com o DTO', async () => {
      const dto = { nome: 'GV300', marcaId: 1 };
      (service.createModelo as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      await controller.createModelo(dto);

      expect(service.createModelo).toHaveBeenCalledWith(dto);
    });
  });

  describe('deleteModelo', () => {
    it('repassa id numérico ao service.deleteModelo', async () => {
      (service.deleteModelo as jest.Mock).mockResolvedValue({ id: 4 });

      await controller.deleteModelo(4);

      expect(service.deleteModelo).toHaveBeenCalledWith(4);
    });
  });

  // ============= OPERADORAS =============

  describe('findAllOperadoras', () => {
    it('delega para service.findAllOperadoras', async () => {
      (service.findAllOperadoras as jest.Mock).mockResolvedValue([
        { id: 1, nome: 'Vivo' },
      ]);

      await controller.findAllOperadoras();

      expect(service.findAllOperadoras).toHaveBeenCalled();
    });
  });

  describe('findOneOperadora', () => {
    it('repassa id numérico ao service', async () => {
      (service.findOneOperadora as jest.Mock).mockResolvedValue({
        id: 2,
        nome: 'Claro',
      });

      await controller.findOneOperadora(2);

      expect(service.findOneOperadora).toHaveBeenCalledWith(2);
    });
  });

  describe('createOperadora', () => {
    it('chama service.createOperadora com o DTO', async () => {
      const dto = { nome: 'Tim' };
      (service.createOperadora as jest.Mock).mockResolvedValue({
        id: 1,
        ...dto,
      });

      await controller.createOperadora(dto);

      expect(service.createOperadora).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateOperadora', () => {
    it('repassa id numérico ao service.updateOperadora', async () => {
      const dto = { nome: 'Oi' };
      (service.updateOperadora as jest.Mock).mockResolvedValue({
        id: 6,
        ...dto,
      });

      await controller.updateOperadora(6, dto);

      expect(service.updateOperadora).toHaveBeenCalledWith(6, dto);
    });
  });

  describe('deleteOperadora', () => {
    it('repassa id numérico ao service.deleteOperadora', async () => {
      (service.deleteOperadora as jest.Mock).mockResolvedValue({ id: 3 });

      await controller.deleteOperadora(3);

      expect(service.deleteOperadora).toHaveBeenCalledWith(3);
    });
  });

  // ============= MARCAS SIMCARD =============

  describe('findAllMarcasSimcard', () => {
    it('delega para service sem operadoraId', async () => {
      (service.findAllMarcasSimcard as jest.Mock).mockResolvedValue([
        { id: 1, nome: 'Getrak', operadora: { nome: 'Vivo' } },
      ]);

      await controller.findAllMarcasSimcard(undefined);

      expect(service.findAllMarcasSimcard).toHaveBeenCalledWith(undefined);
    });

    it('repassa operadoraId numérico ao service', async () => {
      (service.findAllMarcasSimcard as jest.Mock).mockResolvedValue([]);

      await controller.findAllMarcasSimcard(2);

      expect(service.findAllMarcasSimcard).toHaveBeenCalledWith(2);
    });
  });

  describe('findOneMarcaSimcard', () => {
    it('repassa id numérico ao service', async () => {
      (service.findOneMarcaSimcard as jest.Mock).mockResolvedValue({
        id: 1,
        nome: 'Getrak',
        operadora: { nome: 'Vivo' },
      });

      await controller.findOneMarcaSimcard(1);

      expect(service.findOneMarcaSimcard).toHaveBeenCalledWith(1);
    });
  });

  describe('createMarcaSimcard', () => {
    it('chama service.createMarcaSimcard com o DTO', async () => {
      const dto = { nome: 'Getrak', operadoraId: 1 };
      (service.createMarcaSimcard as jest.Mock).mockResolvedValue({
        id: 1,
        ...dto,
      });

      await controller.createMarcaSimcard(dto);

      expect(service.createMarcaSimcard).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateMarcaSimcard', () => {
    it('repassa id numérico ao service.updateMarcaSimcard', async () => {
      const dto = { nome: 'Getrak Novo' };
      (service.updateMarcaSimcard as jest.Mock).mockResolvedValue({
        id: 1,
        ...dto,
      });

      await controller.updateMarcaSimcard(1, dto);

      expect(service.updateMarcaSimcard).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('deleteMarcaSimcard', () => {
    it('repassa id numérico ao service.deleteMarcaSimcard', async () => {
      (service.deleteMarcaSimcard as jest.Mock).mockResolvedValue({ id: 1 });

      await controller.deleteMarcaSimcard(1);

      expect(service.deleteMarcaSimcard).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllPlanosSimcard', () => {
    it('repassa undefined ou marcaSimcardId numérico', async () => {
      (service.findAllPlanosSimcard as jest.Mock).mockResolvedValue([]);

      await controller.findAllPlanosSimcard(undefined);
      expect(service.findAllPlanosSimcard).toHaveBeenCalledWith(undefined);

      await controller.findAllPlanosSimcard(5);
      expect(service.findAllPlanosSimcard).toHaveBeenCalledWith(5);
    });
  });

  describe('findOnePlanoSimcard', () => {
    it('repassa id numérico', async () => {
      (service.findOnePlanoSimcard as jest.Mock).mockResolvedValue({
        id: 9,
        planoMb: 500,
      });

      await controller.findOnePlanoSimcard(9);

      expect(service.findOnePlanoSimcard).toHaveBeenCalledWith(9);
    });
  });

  describe('updatePlanoSimcard', () => {
    it('repassa id numérico e DTO', async () => {
      const dto = { planoMb: 1024 };
      (service.updatePlanoSimcard as jest.Mock).mockResolvedValue({
        id: 2,
        ...dto,
      });

      await controller.updatePlanoSimcard(2, dto);

      expect(service.updatePlanoSimcard).toHaveBeenCalledWith(2, dto);
    });
  });

  describe('deletePlanoSimcard', () => {
    it('repassa id numérico', async () => {
      (service.deletePlanoSimcard as jest.Mock).mockResolvedValue({ id: 3 });

      await controller.deletePlanoSimcard(3);

      expect(service.deletePlanoSimcard).toHaveBeenCalledWith(3);
    });
  });
});
