import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KitsService } from 'src/aparelhos/kits.service';
import { PareamentoService } from 'src/aparelhos/pareamento.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('PareamentoService', () => {
  let service: PareamentoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let kitsService: KitsService;

  const kitsMock = {
    criarOuBuscarKitPorNome: jest.fn(),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PareamentoService,
        { provide: PrismaService, useValue: prisma },
        { provide: KitsService, useValue: kitsMock },
      ],
    }).compile();

    service = module.get<PareamentoService>(PareamentoService);
    kitsService = module.get<KitsService>(KitsService);
    jest.clearAllMocks();
  });

  describe('pareamentoPreview', () => {
    it('retorna linhas e contadores quando pares informados', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.pareamentoPreview([
        { imei: '123456789012345', iccid: '123456789012345678901' },
      ]);

      expect(result).toHaveProperty('linhas');
      expect(result).toHaveProperty('contadores');
      expect(result.linhas).toHaveLength(1);
      expect(result.linhas[0]).toMatchObject({
        imei: '123456789012345',
        iccid: '123456789012345678901',
      });
    });

    it('identifica FOUND_AVAILABLE quando rastreador e SIM existem e estão livres', async () => {
      const rastreador = { id: 1, simVinculadoId: null, marca: 'Suntech', modelo: 'ST-901' };
      const sim = { id: 2, aparelhosVinculados: [] };
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(rastreador)
        .mockResolvedValueOnce(sim);

      const result = await service.pareamentoPreview([
        { imei: '123456789012345', iccid: '123456789012345678901' },
      ]);

      expect(result.linhas[0].tracker_status).toBe('FOUND_AVAILABLE');
      expect(result.linhas[0].sim_status).toBe('FOUND_AVAILABLE');
      expect(result.linhas[0].action_needed).toBe('OK');
    });
  });

  describe('pareamento', () => {
    it('lança BadRequestException quando nenhum par informado', async () => {
      await expect(service.pareamento({ pares: [] })).rejects.toThrow(BadRequestException);
      await expect(service.pareamento({ pares: [] })).rejects.toThrow('Nenhum par informado');
    });

    it('lança BadRequestException quando rastreador precisa de lote e não informado', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await expect(
        service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
        }),
      ).rejects.toThrow(/rastreador/);
    });

    it('executa pareamento em transação quando pares OK e lotes informados', async () => {
      const rastreador = { id: 1, simVinculadoId: null };
      const sim = { id: 2, aparelhosVinculados: [] };
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(rastreador)
        .mockResolvedValueOnce(sim);

      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamento({
        pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
        loteRastreadorId: 10,
        loteSimId: 20,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('criados');
      expect(result).toHaveProperty('equipamentos');
    });
  });
});
