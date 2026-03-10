import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KitsService } from 'src/aparelhos/kits.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('KitsService', () => {
  let service: KitsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KitsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<KitsService>(KitsService);
    jest.clearAllMocks();
  });

  describe('getKits', () => {
    it('retorna kits não concluídos', async () => {
      const kits = [{ id: 1, nome: 'Kit-A' }, { id: 2, nome: 'Kit-B' }];
      prisma.kit.findMany.mockResolvedValue(kits);

      const result = await service.getKits();

      expect(result).toEqual(kits);
      expect(prisma.kit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { kitConcluido: false } }),
      );
    });
  });

  describe('getKitById', () => {
    it('lança NotFoundException quando kit não existe', async () => {
      prisma.kit.findUnique.mockResolvedValue(null);

      await expect(service.getKitById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getKitById(999)).rejects.toThrow('Kit não encontrado');
    });

    it('retorna kit quando encontrado', async () => {
      const kit = { id: 1, nome: 'Kit-A', aparelhos: [] };
      prisma.kit.findUnique.mockResolvedValue(kit);

      const result = await service.getKitById(1);

      expect(result).toEqual(kit);
    });
  });

  describe('updateAparelhoKit', () => {
    it('lança NotFoundException quando aparelho não existe', async () => {
      prisma.aparelho.findUnique.mockResolvedValue(null);

      await expect(service.updateAparelhoKit(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando aparelho não é RASTREADOR', async () => {
      prisma.aparelho.findUnique.mockResolvedValue({ id: 1, tipo: 'SIM' });

      await expect(service.updateAparelhoKit(1, 2)).rejects.toThrow(BadRequestException);
      await expect(service.updateAparelhoKit(1, 2)).rejects.toThrow(
        'Apenas rastreadores podem ser adicionados ao kit',
      );
    });

    it('atualiza kitId do aparelho rastreador', async () => {
      prisma.aparelho.findUnique.mockResolvedValue({ id: 1, tipo: 'RASTREADOR' });
      const updated = { id: 1, kitId: 5 };
      prisma.aparelho.update.mockResolvedValue(updated);

      const result = await service.updateAparelhoKit(1, 5);

      expect(result).toEqual(updated);
      expect(prisma.aparelho.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { kitId: 5 } });
    });
  });

  describe('criarOuBuscarKitPorNome', () => {
    it('retorna null quando nome é vazio', async () => {
      const result = await service.criarOuBuscarKitPorNome('');

      expect(result).toBeNull();
      expect(prisma.kit.upsert).not.toHaveBeenCalled();
    });

    it('retorna kit existente quando nome já cadastrado', async () => {
      const kit = { id: 1, nome: 'Kit-A' };
      prisma.kit.upsert.mockResolvedValue(kit);

      const result = await service.criarOuBuscarKitPorNome('Kit-A');

      expect(result).toEqual(kit);
      expect(prisma.kit.upsert).toHaveBeenCalledWith({
        where: { nome: 'Kit-A' },
        create: { nome: 'Kit-A' },
        update: {},
      });
    });

    it('cria novo kit quando nome não existe', async () => {
      const created = { id: 2, nome: 'Kit-Novo' };
      prisma.kit.upsert.mockResolvedValue(created);

      const result = await service.criarOuBuscarKitPorNome('Kit-Novo');

      expect(result).toEqual(created);
      expect(prisma.kit.upsert).toHaveBeenCalledWith({
        where: { nome: 'Kit-Novo' },
        create: { nome: 'Kit-Novo' },
        update: {},
      });
    });
  });
});
