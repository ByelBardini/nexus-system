import { Test, TestingModule } from '@nestjs/testing';
import { VeiculosController } from 'src/veiculos/veiculos.controller';
import { VeiculosService } from 'src/veiculos/veiculos.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('VeiculosController', () => {
  let controller: VeiculosController;
  let service: VeiculosService;

  const serviceMock = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VeiculosController],
      providers: [{ provide: VeiculosService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VeiculosController>(VeiculosController);
    service = module.get<VeiculosService>(VeiculosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('chama service.findAll sem search quando não informado', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('passa search para service.findAll quando informado', async () => {
      const veiculos = [{ id: 1, placa: 'ABC-1234' }];
      (service.findAll as jest.Mock).mockResolvedValue(veiculos);

      const result = await controller.findAll('ABC');

      expect(service.findAll).toHaveBeenCalledWith('ABC');
      expect(result).toEqual(veiculos);
    });
  });
});
