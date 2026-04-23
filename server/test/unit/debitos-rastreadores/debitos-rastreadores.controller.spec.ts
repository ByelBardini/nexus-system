import { Test, TestingModule } from '@nestjs/testing';
import { DebitosRastreadoresController } from 'src/debitos-rastreadores/debitos-rastreadores.controller';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('DebitosRastreadoresController', () => {
  let controller: DebitosRastreadoresController;
  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebitosRastreadoresController],
      providers: [
        { provide: DebitosRastreadoresService, useValue: serviceMock },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DebitosRastreadoresController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delega para o service com o DTO recebido', async () => {
      const retorno = {
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      };
      serviceMock.findAll.mockResolvedValue(retorno);

      const query = {
        status: 'aberto' as const,
        limit: 500,
        incluirHistoricos: true,
      };
      const result = await controller.findAll(query);

      expect(serviceMock.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(retorno);
    });
  });

  describe('findOne', () => {
    it('delega para o service com id numérico', async () => {
      const debito = { id: 5, quantidade: 1 };
      serviceMock.findOne.mockResolvedValue(debito);

      const result = await controller.findOne(5);

      expect(serviceMock.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(debito);
    });
  });
});
