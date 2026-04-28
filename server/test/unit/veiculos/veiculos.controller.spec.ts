import { Test, TestingModule } from '@nestjs/testing';
import { VeiculosController } from 'src/veiculos/veiculos.controller';
import { VeiculosService } from 'src/veiculos/veiculos.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('VeiculosController', () => {
  let controller: VeiculosController;
  let service: VeiculosService;

  const serviceMock = {
    findAll: jest.fn(),
    consultaPlaca: jest.fn(),
    criarOuBuscarPorPlaca: jest.fn(),
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

  describe('criarOuBuscar', () => {
    it('repassa o DTO ao service sem remapear campos', async () => {
      const dto = {
        placa: 'ABC-1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
      };
      const retorno = { id: 1, ...dto, placa: 'ABC1D23', ano: 2020 };
      (service.criarOuBuscarPorPlaca as jest.Mock).mockResolvedValue(retorno);

      const result = await controller.criarOuBuscar(dto);

      expect(service.criarOuBuscarPorPlaca).toHaveBeenCalledWith(dto);
      expect(result).toEqual(retorno);
    });

    it('propaga null quando service retorna null', async () => {
      const dto = {
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
      };
      (service.criarOuBuscarPorPlaca as jest.Mock).mockResolvedValue(null);

      const result = await controller.criarOuBuscar(dto);

      expect(result).toBeNull();
    });
  });

  describe('consultaPlaca', () => {
    it('chama service.consultaPlaca com a placa do parâmetro', async () => {
      const dados = {
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
        tipo: 'AUTO',
      };
      (service.consultaPlaca as jest.Mock).mockResolvedValue(dados);

      const result = await controller.consultaPlaca('ABC1D23');

      expect(service.consultaPlaca).toHaveBeenCalledWith('ABC1D23');
      expect(result).toEqual(dados);
    });

    it('retorna null quando service retorna null', async () => {
      (service.consultaPlaca as jest.Mock).mockResolvedValue(null);

      const result = await controller.consultaPlaca('ABC12');

      expect(result).toBeNull();
    });
  });
});
