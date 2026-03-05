import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { VeiculosService } from 'src/veiculos/veiculos.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('VeiculosService', () => {
  let service: VeiculosService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VeiculosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VeiculosService>(VeiculosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retorna lista de veículos sem filtro quando search não informado', async () => {
      const veiculos = [
        { id: 1, placa: 'ABC-1234' },
        { id: 2, placa: 'DEF-5678' },
      ];
      prisma.veiculo.findMany.mockResolvedValue(veiculos);

      const result = await service.findAll();

      expect(result).toEqual(veiculos);
      expect(prisma.veiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, orderBy: { placa: 'asc' }, take: 50 }),
      );
    });

    it('filtra por placa quando search informado', async () => {
      prisma.veiculo.findMany.mockResolvedValue([{ id: 1, placa: 'ABC-1234' }]);

      await service.findAll('ABC');

      expect(prisma.veiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { placa: { contains: 'ABC' } },
        }),
      );
    });

    it('ignora search com apenas espaços', async () => {
      prisma.veiculo.findMany.mockResolvedValue([]);

      await service.findAll('   ');

      expect(prisma.veiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('limita resultados a 50 registros', async () => {
      prisma.veiculo.findMany.mockResolvedValue([]);

      await service.findAll('XYZ');

      expect(prisma.veiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });
});
