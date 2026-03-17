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

    it('atualiza kitId do aparelho rastreador sem pedido vinculado ao kit', async () => {
      prisma.aparelho.findUnique.mockResolvedValue({ id: 1, tipo: 'RASTREADOR' });
      prisma.pedidoRastreador.findMany.mockResolvedValue([]);
      const updated = { id: 1, kitId: 5 };
      prisma.aparelho.update.mockResolvedValue(updated);

      const result = await service.updateAparelhoKit(1, 5);

      expect(result).toEqual(updated);
      expect(prisma.aparelho.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { kitId: 5 } });
    });

    it('atualiza kitId quando aparelho atende aos requisitos do pedido', async () => {
      prisma.aparelho.findUnique
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR' })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR', marca: 'Teltonika', modelo: 'FMB920', clienteId: null, simVinculado: null });
      prisma.pedidoRastreador.findMany.mockResolvedValue([
        {
          id: 10,
          kitIds: [5],
          deClienteId: null,
          marcaEquipamento: { nome: 'Teltonika' },
          modeloEquipamento: { nome: 'FMB920' },
          operadora: null,
        },
      ]);
      const updated = { id: 1, kitId: 5 };
      prisma.aparelho.update.mockResolvedValue(updated);

      const result = await service.updateAparelhoKit(1, 5);

      expect(result).toEqual(updated);
    });

    it('lança BadRequestException quando modelo do aparelho não atende ao pedido', async () => {
      prisma.aparelho.findUnique
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR' })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR', marca: 'Teltonika', modelo: 'FMB110', clienteId: null, simVinculado: null })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR' })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR', marca: 'Teltonika', modelo: 'FMB110', clienteId: null, simVinculado: null });
      prisma.pedidoRastreador.findMany.mockResolvedValue([
        {
          id: 10,
          kitIds: [5],
          deClienteId: null,
          marcaEquipamento: { nome: 'Teltonika' },
          modeloEquipamento: { nome: 'FMB920' },
          operadora: null,
        },
      ]);

      await expect(service.updateAparelhoKit(1, 5)).rejects.toThrow(BadRequestException);
      await expect(service.updateAparelhoKit(1, 5)).rejects.toThrow('modelo deve ser "FMB920"');
    });

    it('lança BadRequestException quando operadora do SIM não atende ao pedido', async () => {
      prisma.aparelho.findUnique
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR' })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR', marca: null, modelo: null, clienteId: null, simVinculado: { operadora: 'TIM' } })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR' })
        .mockResolvedValueOnce({ id: 1, tipo: 'RASTREADOR', marca: null, modelo: null, clienteId: null, simVinculado: { operadora: 'TIM' } });
      prisma.pedidoRastreador.findMany.mockResolvedValue([
        {
          id: 10,
          kitIds: [5],
          deClienteId: null,
          marcaEquipamento: null,
          modeloEquipamento: null,
          operadora: { nome: 'Vivo' },
        },
      ]);

      await expect(service.updateAparelhoKit(1, 5)).rejects.toThrow(BadRequestException);
      await expect(service.updateAparelhoKit(1, 5)).rejects.toThrow('operadora do SIM deve ser "Vivo"');
    });

    it('não valida quando kitId é null (remoção do kit)', async () => {
      prisma.aparelho.findUnique.mockResolvedValue({ id: 1, tipo: 'RASTREADOR' });
      const updated = { id: 1, kitId: null };
      prisma.aparelho.update.mockResolvedValue(updated);

      const result = await service.updateAparelhoKit(1, null);

      expect(result).toEqual(updated);
      expect(prisma.pedidoRastreador.findMany).not.toHaveBeenCalled();
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
