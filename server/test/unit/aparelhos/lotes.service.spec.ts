import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LotesService } from 'src/aparelhos/lotes.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('LotesService', () => {
  let service: LotesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: DebitosRastreadoresService,
          useValue: { consolidarDebitoTx: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LotesService>(LotesService);
    jest.clearAllMocks();
  });

  describe('createLote', () => {
    it('lança BadRequestException quando quantidade é zero', async () => {
      await expect(
        service.createLote({
          referencia: 'LOT-001',
          dataChegada: '2024-01-01',
          proprietarioTipo: 'INFINITY',
          tipo: 'RASTREADOR',
          quantidade: 0,
          valorUnitario: 100,
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createLote({
          referencia: 'LOT-001',
          dataChegada: '2024-01-01',
          proprietarioTipo: 'INFINITY',
          tipo: 'RASTREADOR',
          quantidade: 0,
          valorUnitario: 100,
        } as any),
      ).rejects.toThrow('Quantidade deve ser maior que zero');
    });

    it('cria lote com aparelhos sem identificadores', async () => {
      const lote = {
        id: 1,
        referencia: 'LOT-001',
        aparelhos: [{ id: 1 }, { id: 2 }],
        cliente: null,
      };
      prisma.loteAparelho.create.mockResolvedValue({ id: 1 });
      prisma.aparelho.createMany.mockResolvedValue({ count: 2 });
      prisma.loteAparelho.findUnique.mockResolvedValue(lote);

      const result = await service.createLote({
        referencia: 'LOT-001',
        dataChegada: '2024-01-01',
        proprietarioTipo: 'INFINITY',
        tipo: 'RASTREADOR',
        quantidade: 2,
        valorUnitario: 100,
      } as any);

      expect(result).toEqual(lote);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('SIM é criado com proprietario=INFINITY independente do proprietario enviado', async () => {
      prisma.loteAparelho.create.mockResolvedValue({ id: 1 });
      prisma.aparelho.createMany.mockResolvedValue({ count: 2 });
      prisma.loteAparelho.findUnique.mockResolvedValue({
        id: 1,
        aparelhos: [],
        cliente: null,
      });

      await service.createLote({
        referencia: 'SIM-001',
        dataChegada: '2024-01-01',
        proprietarioTipo: 'CLIENTE',
        clienteId: 5,
        tipo: 'SIM',
        quantidade: 2,
        valorUnitario: 50,
      } as any);

      expect(prisma.loteAparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            proprietario: 'INFINITY',
            clienteId: null,
          }),
        }),
      );
      expect(prisma.aparelho.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              proprietario: 'INFINITY',
              clienteId: null,
            }),
          ]),
        }),
      );
    });

    it('SIM não processa abaterDebitoId mesmo quando informado', async () => {
      prisma.loteAparelho.create.mockResolvedValue({ id: 1 });
      prisma.aparelho.createMany.mockResolvedValue({ count: 1 });
      prisma.loteAparelho.findUnique.mockResolvedValue({
        id: 1,
        aparelhos: [],
        cliente: null,
      });

      await service.createLote({
        referencia: 'SIM-002',
        dataChegada: '2024-01-01',
        proprietarioTipo: 'INFINITY',
        tipo: 'SIM',
        quantidade: 1,
        valorUnitario: 50,
        abaterDebitoId: 10,
        abaterQuantidade: 1,
      } as any);

      expect(prisma.debitoRastreador.findUnique).not.toHaveBeenCalled();
    });

    it('usa quantidade de identificadores quando fornecidos', async () => {
      const lote = {
        id: 1,
        referencia: 'LOT-002',
        aparelhos: [{ id: 1 }],
        cliente: null,
      };
      prisma.loteAparelho.create.mockResolvedValue({ id: 1 });
      prisma.aparelho.createMany.mockResolvedValue({ count: 1 });
      prisma.loteAparelho.findUnique.mockResolvedValue(lote);

      await service.createLote({
        referencia: 'LOT-002',
        dataChegada: '2024-01-01',
        proprietarioTipo: 'INFINITY',
        tipo: 'RASTREADOR',
        quantidade: 5,
        valorUnitario: 100,
        identificadores: ['123456789012345'],
      } as any);

      expect(prisma.loteAparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantidade: 1 }),
        }),
      );
    });
  });

  describe('getLotesParaPareamento', () => {
    it('busca lotes de SIM sem filtro por proprietário', async () => {
      prisma.loteAparelho.findMany.mockResolvedValue([]);

      await service.getLotesParaPareamento('SIM');

      expect(prisma.loteAparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tipo: 'SIM' } }),
      );
      expect(prisma.loteAparelho.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ proprietario: expect.anything() }),
        }),
      );
    });

    it('retorna somente lotes com saldo disponível', async () => {
      const lotes = [
        { id: 1, referencia: 'LOT-001', aparelhos: [{ id: 10 }, { id: 11 }] },
        { id: 2, referencia: 'LOT-002', aparelhos: [] },
      ];
      prisma.loteAparelho.findMany.mockResolvedValue(lotes);

      const result = await service.getLotesParaPareamento('RASTREADOR');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        referencia: 'LOT-001',
        quantidadeDisponivelSemId: 2,
      });
    });
  });
});
