import { Test, TestingModule } from '@nestjs/testing';
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipamentosController],
      providers: [{ provide: EquipamentosService, useValue: serviceMock }],
    }).compile();

    controller = module.get<EquipamentosController>(EquipamentosController);
    service = module.get<EquipamentosService>(EquipamentosService);
    jest.clearAllMocks();
  });

  // ============= MARCAS =============

  describe('findAllMarcas', () => {
    it('delega para service.findAllMarcas', async () => {
      (service.findAllMarcas as jest.Mock).mockResolvedValue([{ id: 1, nome: 'Queclink' }]);

      await controller.findAllMarcas();

      expect(service.findAllMarcas).toHaveBeenCalled();
    });
  });

  describe('findOneMarca', () => {
    it('converte id para número e chama service', async () => {
      (service.findOneMarca as jest.Mock).mockResolvedValue({ id: 3, nome: 'Teltonika' });

      await controller.findOneMarca('3');

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
    it('converte id e chama service.updateMarca', async () => {
      const dto = { nome: 'Atualizada' };
      (service.updateMarca as jest.Mock).mockResolvedValue({ id: 2, ...dto });

      await controller.updateMarca('2', dto);

      expect(service.updateMarca).toHaveBeenCalledWith(2, dto);
    });
  });

  describe('deleteMarca', () => {
    it('converte id e chama service.deleteMarca', async () => {
      (service.deleteMarca as jest.Mock).mockResolvedValue({ id: 5 });

      await controller.deleteMarca('5');

      expect(service.deleteMarca).toHaveBeenCalledWith(5);
    });
  });

  // ============= MODELOS =============

  describe('findAllModelos', () => {
    it('passa undefined para marcaId quando não informado', async () => {
      (service.findAllModelos as jest.Mock).mockResolvedValue([]);

      await controller.findAllModelos();

      expect(service.findAllModelos).toHaveBeenCalledWith(undefined);
    });

    it('converte marcaId para número quando informado', async () => {
      (service.findAllModelos as jest.Mock).mockResolvedValue([]);

      await controller.findAllModelos('3');

      expect(service.findAllModelos).toHaveBeenCalledWith(3);
    });
  });

  describe('findOneModelo', () => {
    it('converte id para número e chama service', async () => {
      (service.findOneModelo as jest.Mock).mockResolvedValue({ id: 7, nome: 'GV300' });

      await controller.findOneModelo('7');

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
    it('converte id e chama service.deleteModelo', async () => {
      (service.deleteModelo as jest.Mock).mockResolvedValue({ id: 4 });

      await controller.deleteModelo('4');

      expect(service.deleteModelo).toHaveBeenCalledWith(4);
    });
  });

  // ============= OPERADORAS =============

  describe('findAllOperadoras', () => {
    it('delega para service.findAllOperadoras', async () => {
      (service.findAllOperadoras as jest.Mock).mockResolvedValue([{ id: 1, nome: 'Vivo' }]);

      await controller.findAllOperadoras();

      expect(service.findAllOperadoras).toHaveBeenCalled();
    });
  });

  describe('findOneOperadora', () => {
    it('converte id para número e chama service', async () => {
      (service.findOneOperadora as jest.Mock).mockResolvedValue({ id: 2, nome: 'Claro' });

      await controller.findOneOperadora('2');

      expect(service.findOneOperadora).toHaveBeenCalledWith(2);
    });
  });

  describe('createOperadora', () => {
    it('chama service.createOperadora com o DTO', async () => {
      const dto = { nome: 'Tim' };
      (service.createOperadora as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      await controller.createOperadora(dto);

      expect(service.createOperadora).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateOperadora', () => {
    it('converte id e chama service.updateOperadora', async () => {
      const dto = { nome: 'Oi' };
      (service.updateOperadora as jest.Mock).mockResolvedValue({ id: 6, ...dto });

      await controller.updateOperadora('6', dto);

      expect(service.updateOperadora).toHaveBeenCalledWith(6, dto);
    });
  });

  describe('deleteOperadora', () => {
    it('converte id e chama service.deleteOperadora', async () => {
      (service.deleteOperadora as jest.Mock).mockResolvedValue({ id: 3 });

      await controller.deleteOperadora('3');

      expect(service.deleteOperadora).toHaveBeenCalledWith(3);
    });
  });
});
