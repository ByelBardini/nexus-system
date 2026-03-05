import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AparelhosService } from './aparelhos.service';

describe('AparelhosService', () => {
  let service: AparelhosService;

  const prismaMock = {
    kit: {
      findMany: jest.fn(),
    },
    aparelho: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    loteAparelho: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    aparelhoHistorico: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(prismaMock),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AparelhosService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AparelhosService>(AparelhosService);
    jest.clearAllMocks();
  });

  describe('getKits', () => {
    it('retorna apenas kits com kitConcluido = false', async () => {
      prismaMock.kit.findMany.mockResolvedValue([
        { id: 1, nome: 'Kit A' },
        { id: 2, nome: 'Kit B' },
      ]);

      const result = await service.getKits();

      expect(prismaMock.kit.findMany).toHaveBeenCalledWith({
        where: { kitConcluido: false },
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true },
      });
      expect(result).toHaveLength(2);
    });

    it('retorna lista vazia quando não há kits disponíveis', async () => {
      prismaMock.kit.findMany.mockResolvedValue([]);

      const result = await service.getKits();

      expect(prismaMock.kit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { kitConcluido: false },
        }),
      );
      expect(result).toEqual([]);
    });
  });
});
