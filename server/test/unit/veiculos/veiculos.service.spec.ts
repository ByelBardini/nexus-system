import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { VeiculosService } from 'src/veiculos/veiculos.service';
import { createPrismaMock } from '../helpers/prisma-mock';

jest.mock('api-placa-fipe', () => ({
  consultarPlaca: jest.fn(),
}));

import { consultarPlaca } from 'api-placa-fipe';

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
    (consultarPlaca as jest.Mock).mockReset();
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
        expect.objectContaining({
          where: {},
          orderBy: { placa: 'asc' },
          take: 50,
        }),
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

  describe('consultaPlaca', () => {
    it('retorna null quando placa tem menos de 7 caracteres alfanuméricos', async () => {
      const result = await service.consultaPlaca('ABC12');

      expect(result).toBeNull();
      expect(consultarPlaca).not.toHaveBeenCalled();
    });

    it('retorna null quando placa vazia', async () => {
      const result = await service.consultaPlaca('');

      expect(result).toBeNull();
      expect(consultarPlaca).not.toHaveBeenCalled();
    });

    it('normaliza placa removendo caracteres especiais e convertendo para maiúsculas', async () => {
      (consultarPlaca as jest.Mock).mockResolvedValue(null);

      await service.consultaPlaca('abc-1d23');

      expect(consultarPlaca).toHaveBeenCalledWith('ABC1D23');
    });

    it('retorna null quando api-placa-fipe retorna null', async () => {
      (consultarPlaca as jest.Mock).mockResolvedValue(null);

      const result = await service.consultaPlaca('ABC1D23');

      expect(result).toBeNull();
    });

    it('retorna dados do veículo no formato esperado quando api retorna resultado', async () => {
      (consultarPlaca as jest.Mock).mockResolvedValue({
        marca: 'Fiat',
        modelo: 'Uno',
        anoModelo: '2020',
        anoFabricacao: '2019',
        cor: 'Branco',
        tipoVeiculo: 'AUTO',
      });

      const result = await service.consultaPlaca('ABC1D23');

      expect(result).toEqual({
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
        tipo: 'AUTO',
      });
    });

    it('usa anoFabricacao quando anoModelo não existe', async () => {
      (consultarPlaca as jest.Mock).mockResolvedValue({
        marca: 'VW',
        modelo: 'Gol',
        anoFabricacao: '2018',
        cor: 'Preto',
        tipoVeiculo: 'AUTO',
      });

      const result = await service.consultaPlaca('QHJ2500');

      expect(result).toEqual(expect.objectContaining({ ano: '2018' }));
    });

    it('usa string vazia para campos ausentes na API', async () => {
      (consultarPlaca as jest.Mock).mockResolvedValue({});

      const result = await service.consultaPlaca('ABC1D23');

      expect(result).toEqual({
        marca: '',
        modelo: '',
        ano: '',
        cor: '',
        tipo: '',
      });
    });
  });

  describe('criarOuBuscarPorPlaca', () => {
    it('retorna null quando placa tem menos de 7 caracteres', async () => {
      const result = await service.criarOuBuscarPorPlaca({
        placa: 'ABC12',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
      });

      expect(result).toBeNull();
      expect(prisma.veiculo.upsert).not.toHaveBeenCalled();
    });

    it('retorna veículo existente quando placa já cadastrada', async () => {
      const existing = {
        id: 1,
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2020,
        cor: 'Branco',
      };
      prisma.veiculo.upsert.mockResolvedValue(existing);

      const result = await service.criarOuBuscarPorPlaca({
        placa: 'ABC-1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
      });

      expect(result).toEqual(existing);
      expect(prisma.veiculo.upsert).toHaveBeenCalledWith({
        where: { placa: 'ABC1D23' },
        create: expect.objectContaining({
          placa: 'ABC1D23',
          marca: 'Fiat',
          modelo: 'Uno',
          ano: 2020,
          cor: 'Branco',
        }),
        update: {},
      });
    });

    it('cria novo veículo quando placa não existe', async () => {
      const created = {
        id: 5,
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2020,
        cor: 'Branco',
      };
      prisma.veiculo.upsert.mockResolvedValue(created);

      const result = await service.criarOuBuscarPorPlaca({
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Branco',
      });

      expect(result).toEqual(created);
      expect(prisma.veiculo.upsert).toHaveBeenCalledWith({
        where: { placa: 'ABC1D23' },
        create: expect.objectContaining({
          placa: 'ABC1D23',
          marca: 'Fiat',
          modelo: 'Uno',
          ano: 2020,
          cor: 'Branco',
        }),
        update: {},
      });
    });

    it('armazena marca, modelo, ano e cor nos campos próprios do veículo', async () => {
      prisma.veiculo.upsert.mockResolvedValue({
        id: 5,
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2020,
        cor: 'Prata',
      });

      await service.criarOuBuscarPorPlaca({
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
        cor: 'Prata',
      });

      expect(prisma.veiculo.upsert).toHaveBeenCalledWith({
        where: { placa: 'ABC1D23' },
        create: expect.objectContaining({
          placa: 'ABC1D23',
          marca: 'Fiat',
          modelo: 'Uno',
          ano: 2020,
          cor: 'Prata',
        }),
        update: {},
      });
    });
  });
});
