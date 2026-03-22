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
    validarDadosParaKit: jest.fn(),
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

    describe('validação contra pedido quando kitId informado', () => {
      it('não chama validarDadosParaKit quando kitId não é informado', async () => {
        prisma.aparelho.findFirst.mockResolvedValue(null);

        await expect(
          service.pareamento({
            pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
            rastreadorManual: { marca: 'Teltonika', modelo: 'FMB920' },
            simManual: { operadora: 'Claro' },
          }),
        ).rejects.toThrow(); // pode falhar por outra razão (lote), mas não por validarDadosParaKit

        expect(kitsMock.validarDadosParaKit).not.toHaveBeenCalled();
      });

      it('chama validarDadosParaKit com dados do rastreadorManual e simManual quando kitId informado', async () => {
        prisma.aparelho.findFirst.mockResolvedValue(null); // NEEDS_CREATE para ambos
        kitsMock.validarDadosParaKit.mockResolvedValue(undefined);

        // Vai falhar na transação (sem lote), mas a validação já terá sido chamada
        await expect(
          service.pareamento({
            pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
            kitId: 5,
            rastreadorManual: { marca: 'Teltonika', modelo: 'FMB920' },
            simManual: { operadora: 'Claro' },
          }),
        ).rejects.toThrow();

        expect(kitsMock.validarDadosParaKit).toHaveBeenCalledWith(5, {
          marca: 'Teltonika',
          modelo: 'FMB920',
          operadora: 'Claro',
        });
      });

      it('lança BadRequestException propagado de validarDadosParaKit quando modelo não atende pedido', async () => {
        prisma.aparelho.findFirst.mockResolvedValue(null); // NEEDS_CREATE
        kitsMock.validarDadosParaKit.mockRejectedValue(
          new BadRequestException('Aparelho não atende ao pedido: modelo deve ser "FMB003"'),
        );

        await expect(
          service.pareamento({
            pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
            kitId: 5,
            rastreadorManual: { marca: 'Teltonika', modelo: 'FMB920' },
            simManual: { operadora: 'Claro' },
          }),
        ).rejects.toThrow('modelo deve ser "FMB003"');
      });

      it('lança BadRequestException propagado de validarDadosParaKit quando operadora não atende pedido', async () => {
        prisma.aparelho.findFirst.mockResolvedValue(null); // NEEDS_CREATE
        kitsMock.validarDadosParaKit.mockRejectedValue(
          new BadRequestException('Aparelho não atende ao pedido: operadora do SIM deve ser "Claro"'),
        );

        await expect(
          service.pareamento({
            pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
            kitId: 5,
            rastreadorManual: { marca: 'Teltonika', modelo: 'FMB920' },
            simManual: { operadora: 'Vivo' },
          }),
        ).rejects.toThrow('operadora do SIM deve ser "Claro"');
      });

      it('chama validarDadosParaKit com dados do lote quando loteRastreadorId e loteSimId informados', async () => {
        prisma.aparelho.findFirst.mockResolvedValue(null); // NEEDS_CREATE para ambos
        prisma.loteAparelho.findUnique
          .mockResolvedValueOnce({ id: 10, marca: 'Teltonika', modelo: 'FMB003', tipo: 'RASTREADOR' })
          .mockResolvedValueOnce({ id: 20, operadora: 'Claro', tipo: 'SIM' });
        kitsMock.validarDadosParaKit.mockResolvedValue(undefined);

        // Vai falhar na transação (sem aparelhos sem id no lote), mas a validação já terá sido chamada
        try {
          await service.pareamento({
            pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
            kitId: 5,
            loteRastreadorId: 10,
            loteSimId: 20,
          });
        } catch {
          // ignorar erro da transação
        }

        expect(kitsMock.validarDadosParaKit).toHaveBeenCalledWith(5, {
          marca: 'Teltonika',
          modelo: 'FMB003',
          operadora: 'Claro',
        });
      });

      it('chama validarDadosParaKit com dados do aparelho encontrado (FOUND_AVAILABLE) quando kitId informado', async () => {
        const rastreador = { id: 1, simVinculadoId: null, marca: 'Suntech', modelo: 'ST310U' };
        const sim = { id: 2, aparelhosVinculados: [], operadora: 'Tim' };
        prisma.aparelho.findFirst
          .mockResolvedValueOnce(rastreador)
          .mockResolvedValueOnce(sim);
        kitsMock.validarDadosParaKit.mockResolvedValue(undefined);
        prisma.aparelho.update.mockResolvedValue({});
        prisma.aparelhoHistorico.create.mockResolvedValue({});

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
          kitId: 5,
        });

        expect(kitsMock.validarDadosParaKit).toHaveBeenCalledWith(5, {
          marca: 'Suntech',
          modelo: 'ST310U',
          operadora: 'Tim',
        });
      });
    });
  });
});
