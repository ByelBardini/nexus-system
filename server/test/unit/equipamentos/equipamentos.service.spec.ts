import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EquipamentosService } from 'src/equipamentos/equipamentos.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('EquipamentosService', () => {
  let service: EquipamentosService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipamentosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EquipamentosService>(EquipamentosService);
    jest.clearAllMocks();
  });

  // ============= MARCAS =============

  describe('findAllMarcas', () => {
    it('retorna lista de marcas com contagem de modelos', async () => {
      const marcas = [{ id: 1, nome: 'Queclink', _count: { modelos: 3 } }];
      prisma.marcaEquipamento.findMany.mockResolvedValue(marcas);

      const result = await service.findAllMarcas();

      expect(result).toEqual(marcas);
    });
  });

  describe('findOneMarca', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.findOneMarca(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneMarca(999)).rejects.toThrow(
        'Marca não encontrada',
      );
    });

    it('retorna marca com modelos quando encontrada', async () => {
      const marca = { id: 1, nome: 'Queclink', modelos: [] };
      prisma.marcaEquipamento.findUnique.mockResolvedValue(marca);

      const result = await service.findOneMarca(1);

      expect(result).toEqual(marca);
    });
  });

  describe('createMarca', () => {
    it('lança ConflictException quando marca já existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Queclink',
      });

      await expect(service.createMarca({ nome: 'Queclink' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createMarca({ nome: 'Queclink' })).rejects.toThrow(
        'Marca já existe',
      );
    });

    it('cria nova marca quando nome não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);
      const created = { id: 1, nome: 'Nova Marca' };
      prisma.marcaEquipamento.create.mockResolvedValue(created);

      const result = await service.createMarca({ nome: 'Nova Marca' });

      expect(result).toEqual(created);
      expect(prisma.marcaEquipamento.create).toHaveBeenCalledWith({
        data: { nome: 'Nova Marca' },
      });
    });
  });

  describe('updateMarca', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.updateMarca(999, { nome: 'Novo' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException quando novo nome já pertence a outra marca', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Queclink',
        modelos: [],
      });
      prisma.marcaEquipamento.findFirst.mockResolvedValue({
        id: 2,
        nome: 'Teltonika',
      });

      await expect(
        service.updateMarca(1, { nome: 'Teltonika' }),
      ).rejects.toThrow(ConflictException);
    });

    it('atualiza marca quando nome não conflita', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Queclink',
        modelos: [],
      });
      prisma.marcaEquipamento.findFirst.mockResolvedValue(null);
      const updated = { id: 1, nome: 'Queclink Novo' };
      prisma.marcaEquipamento.update.mockResolvedValue(updated);

      const result = await service.updateMarca(1, { nome: 'Queclink Novo' });

      expect(result).toEqual(updated);
    });
  });

  describe('deleteMarca', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.deleteMarca(999)).rejects.toThrow(NotFoundException);
    });

    it('deleta marca existente', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Queclink',
        modelos: [],
      });
      const deleted = { id: 1, nome: 'Queclink' };
      prisma.marcaEquipamento.delete.mockResolvedValue(deleted);

      const result = await service.deleteMarca(1);

      expect(result).toEqual(deleted);
      expect(prisma.marcaEquipamento.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  // ============= MODELOS =============

  describe('findAllModelos', () => {
    it('retorna todos os modelos sem filtro de marcaId', async () => {
      const modelos = [
        { id: 1, nome: 'GV300', marca: { id: 1, nome: 'Queclink' } },
      ];
      prisma.modeloEquipamento.findMany.mockResolvedValue(modelos);

      const result = await service.findAllModelos();

      expect(result).toEqual(modelos);
      expect(prisma.modeloEquipamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('filtra por marcaId quando informado', async () => {
      prisma.modeloEquipamento.findMany.mockResolvedValue([]);

      await service.findAllModelos(1);

      expect(prisma.modeloEquipamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { marcaId: 1 } }),
      );
    });
  });

  describe('findOneModelo', () => {
    it('lança NotFoundException quando modelo não existe', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.findOneModelo(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneModelo(999)).rejects.toThrow(
        'Modelo não encontrado',
      );
    });
  });

  describe('createModelo', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);

      await expect(
        service.createModelo({ nome: 'GV300', marcaId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando modelo já existe para a marca', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Queclink',
      });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({
        id: 1,
        nome: 'GV300',
      });

      await expect(
        service.createModelo({ nome: 'GV300', marcaId: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('cria modelo quando não existe conflito', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Queclink',
      });
      prisma.modeloEquipamento.findFirst.mockResolvedValue(null);
      const created = {
        id: 1,
        nome: 'GV300',
        marcaId: 1,
        marca: { id: 1, nome: 'Queclink' },
      };
      prisma.modeloEquipamento.create.mockResolvedValue(created);

      const result = await service.createModelo({ nome: 'GV300', marcaId: 1 });

      expect(result).toEqual(created);
    });
  });

  describe('updateModelo', () => {
    it('lança NotFoundException quando modelo não existe', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue(null);

      await expect(
        service.updateModelo(999, { nome: 'GV300' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando nome conflita com outro modelo da mesma marca', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'GV300',
        marcaId: 1,
        marca: { id: 1, nome: 'Queclink' },
      });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({
        id: 2,
        nome: 'GV350',
      });

      await expect(service.updateModelo(1, { nome: 'GV350' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('atualiza modelo quando não há conflito', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'GV300',
        marcaId: 1,
        marca: { id: 1, nome: 'Queclink' },
      });
      prisma.modeloEquipamento.findFirst.mockResolvedValue(null);
      const updated = {
        id: 1,
        nome: 'GV300W',
        marcaId: 1,
        marca: { id: 1, nome: 'Queclink' },
      };
      prisma.modeloEquipamento.update.mockResolvedValue(updated);

      const result = await service.updateModelo(1, { nome: 'GV300W' });

      expect(result).toEqual(updated);
      expect(prisma.modeloEquipamento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nome: 'GV300W' },
        include: { marca: true },
      });
    });
  });

  describe('deleteModelo', () => {
    it('lança NotFoundException quando modelo não existe', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.deleteModelo(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deleta modelo existente', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue({
        id: 1,
        nome: 'GV300',
        marca: {},
      });
      prisma.modeloEquipamento.delete.mockResolvedValue({
        id: 1,
        nome: 'GV300',
      });

      await service.deleteModelo(1);

      expect(prisma.modeloEquipamento.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  // ============= OPERADORAS =============

  describe('findAllOperadoras', () => {
    it('retorna lista de operadoras', async () => {
      const operadoras = [
        { id: 1, nome: 'Vivo' },
        { id: 2, nome: 'Claro' },
      ];
      prisma.operadora.findMany.mockResolvedValue(operadoras);

      const result = await service.findAllOperadoras();

      expect(result).toEqual(operadoras);
    });
  });

  describe('findOneOperadora', () => {
    it('lança NotFoundException quando operadora não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(service.findOneOperadora(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneOperadora(999)).rejects.toThrow(
        'Operadora não encontrada',
      );
    });
  });

  describe('createOperadora', () => {
    it('lança ConflictException quando operadora já existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });

      await expect(service.createOperadora({ nome: 'Vivo' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('cria operadora quando não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);
      const created = { id: 1, nome: 'Tim' };
      prisma.operadora.create.mockResolvedValue(created);

      const result = await service.createOperadora({ nome: 'Tim' });

      expect(result).toEqual(created);
    });
  });

  describe('updateOperadora', () => {
    it('lança NotFoundException quando operadora não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOperadora(999, { nome: 'Novo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando novo nome já existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });
      prisma.operadora.findFirst.mockResolvedValue({ id: 2, nome: 'Tim' });

      await expect(service.updateOperadora(1, { nome: 'Tim' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteOperadora', () => {
    it('lança NotFoundException quando operadora não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(service.deleteOperadora(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deleta operadora existente', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });
      prisma.operadora.delete.mockResolvedValue({ id: 1, nome: 'Vivo' });

      await service.deleteOperadora(1);

      expect(prisma.operadora.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  // ============= MARCAS SIMCARD =============

  describe('findAllMarcasSimcard', () => {
    it('retorna lista de marcas de simcard com operadora', async () => {
      const marcas = [
        {
          id: 1,
          nome: 'Getrak',
          operadoraId: 1,
          operadora: { id: 1, nome: 'Vivo' },
        },
      ];
      prisma.marcaSimcard.findMany.mockResolvedValue(marcas);

      const result = await service.findAllMarcasSimcard();

      expect(result).toEqual(marcas);
    });

    it('filtra por operadoraId quando informado', async () => {
      prisma.marcaSimcard.findMany.mockResolvedValue([]);

      await service.findAllMarcasSimcard(1);

      expect(prisma.marcaSimcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { operadoraId: 1 } }),
      );
    });
  });

  describe('findOneMarcaSimcard', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue(null);

      await expect(service.findOneMarcaSimcard(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneMarcaSimcard(999)).rejects.toThrow(
        'Marca de simcard não encontrada',
      );
    });

    it('retorna marca com operadora quando encontrada', async () => {
      const marca = {
        id: 1,
        nome: 'Getrak',
        operadoraId: 1,
        operadora: { id: 1, nome: 'Vivo' },
      };
      prisma.marcaSimcard.findUnique.mockResolvedValue(marca);

      const result = await service.findOneMarcaSimcard(1);

      expect(result).toEqual(marca);
    });
  });

  describe('createMarcaSimcard', () => {
    it('lança NotFoundException quando operadora não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(
        service.createMarcaSimcard({ nome: 'Getrak', operadoraId: 999 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createMarcaSimcard({ nome: 'Getrak', operadoraId: 999 }),
      ).rejects.toThrow('Operadora não encontrada');
    });

    it('lança ConflictException quando marca já existe para a operadora', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });
      prisma.marcaSimcard.findFirst.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
      });

      await expect(
        service.createMarcaSimcard({ nome: 'Getrak', operadoraId: 1 }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createMarcaSimcard({ nome: 'Getrak', operadoraId: 1 }),
      ).rejects.toThrow('Marca já existe para esta operadora');
    });

    it('cria marca de simcard quando não existe conflito', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });
      prisma.marcaSimcard.findFirst.mockResolvedValue(null);
      const created = {
        id: 1,
        nome: 'Getrak',
        operadoraId: 1,
        operadora: { id: 1, nome: 'Vivo' },
      };
      prisma.marcaSimcard.create.mockResolvedValue(created);

      const result = await service.createMarcaSimcard({
        nome: 'Getrak',
        operadoraId: 1,
      });

      expect(result).toEqual(created);
      expect(prisma.marcaSimcard.create).toHaveBeenCalledWith({
        data: {
          nome: 'Getrak',
          operadoraId: 1,
          temPlanos: false,
          minCaracteresIccid: null,
        },
        include: { operadora: true },
      });
    });
  });

  describe('updateMarcaSimcard', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMarcaSimcard(999, { nome: 'Getrak Novo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança NotFoundException quando operadora nova não existe', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
        operadoraId: 1,
        operadora: {},
      });
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMarcaSimcard(1, { operadoraId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando novo nome já existe para a operadora', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
        operadoraId: 1,
        operadora: {},
      });
      prisma.marcaSimcard.findFirst.mockResolvedValue({
        id: 2,
        nome: 'Virtueyes',
      });

      await expect(
        service.updateMarcaSimcard(1, { nome: 'Virtueyes' }),
      ).rejects.toThrow(ConflictException);
    });

    it('atualiza marca quando não há conflito', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
        operadoraId: 1,
        operadora: {},
      });
      prisma.marcaSimcard.findFirst.mockResolvedValue(null);
      const updated = { id: 1, nome: 'Getrak Novo', operadoraId: 1 };
      prisma.marcaSimcard.update.mockResolvedValue(updated);

      const result = await service.updateMarcaSimcard(1, {
        nome: 'Getrak Novo',
      });

      expect(result).toEqual(updated);
    });
  });

  describe('deleteMarcaSimcard', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue(null);

      await expect(service.deleteMarcaSimcard(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deleta marca existente', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
        operadora: {},
      });
      const deleted = { id: 1, nome: 'Getrak' };
      prisma.marcaSimcard.delete.mockResolvedValue(deleted);

      const result = await service.deleteMarcaSimcard(1);

      expect(result).toEqual(deleted);
      expect(prisma.marcaSimcard.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  // ============= PLANOS SIMCARD =============

  describe('findAllPlanosSimcard', () => {
    it('retorna lista de planos sem filtro', async () => {
      const planos = [
        {
          id: 1,
          marcaSimcardId: 1,
          planoMb: 500,
          marcaSimcard: { operadora: {} },
        },
      ];
      prisma.planoSimcard.findMany.mockResolvedValue(planos);

      const result = await service.findAllPlanosSimcard();

      expect(result).toEqual(planos);
      expect(prisma.planoSimcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('filtra por marcaSimcardId quando informado', async () => {
      prisma.planoSimcard.findMany.mockResolvedValue([]);

      await service.findAllPlanosSimcard(1);

      expect(prisma.planoSimcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { marcaSimcardId: 1 } }),
      );
    });
  });

  describe('findOnePlanoSimcard', () => {
    it('lança NotFoundException quando plano não existe', async () => {
      prisma.planoSimcard.findUnique.mockResolvedValue(null);

      await expect(service.findOnePlanoSimcard(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOnePlanoSimcard(999)).rejects.toThrow(
        'Plano de simcard não encontrado',
      );
    });

    it('retorna plano quando encontrado', async () => {
      const plano = {
        id: 1,
        marcaSimcardId: 1,
        planoMb: 500,
        marcaSimcard: {},
      };
      prisma.planoSimcard.findUnique.mockResolvedValue(plano);

      const result = await service.findOnePlanoSimcard(1);

      expect(result).toEqual(plano);
    });
  });

  describe('createPlanoSimcard', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue(null);

      await expect(
        service.createPlanoSimcard({ marcaSimcardId: 999, planoMb: 500 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando plano já existe para a marca', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
      });
      prisma.planoSimcard.findUnique.mockResolvedValue({ id: 1, planoMb: 500 });

      await expect(
        service.createPlanoSimcard({ marcaSimcardId: 1, planoMb: 500 }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createPlanoSimcard({ marcaSimcardId: 1, planoMb: 500 }),
      ).rejects.toThrow('Plano já existe para esta marca');
    });

    it('cria plano e atualiza temPlanos da marca', async () => {
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
      });
      prisma.planoSimcard.findUnique.mockResolvedValue(null);
      const created = {
        id: 1,
        marcaSimcardId: 1,
        planoMb: 500,
        marcaSimcard: { operadora: {} },
      };
      prisma.planoSimcard.create.mockResolvedValue(created);
      prisma.marcaSimcard.update.mockResolvedValue({ id: 1, temPlanos: true });

      const result = await service.createPlanoSimcard({
        marcaSimcardId: 1,
        planoMb: 500,
      });

      expect(result).toEqual(created);
      expect(prisma.planoSimcard.create).toHaveBeenCalled();
      expect(prisma.marcaSimcard.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { temPlanos: true },
      });
    });
  });

  describe('updatePlanoSimcard', () => {
    it('lança NotFoundException quando plano não existe', async () => {
      prisma.planoSimcard.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePlanoSimcard(999, { planoMb: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando novo planoMb já existe na marca', async () => {
      prisma.planoSimcard.findUnique.mockResolvedValue({
        id: 1,
        marcaSimcardId: 1,
        planoMb: 500,
      });
      prisma.planoSimcard.findUnique.mockResolvedValueOnce({
        id: 1,
        marcaSimcardId: 1,
        planoMb: 500,
      });
      prisma.planoSimcard.findUnique.mockResolvedValueOnce({
        id: 2,
        planoMb: 1000,
      });

      await expect(
        service.updatePlanoSimcard(1, { planoMb: 1000 }),
      ).rejects.toThrow(ConflictException);
    });

    it('atualiza plano quando não há conflito', async () => {
      prisma.planoSimcard.findUnique
        .mockResolvedValueOnce({ id: 1, marcaSimcardId: 1, planoMb: 500 })
        .mockResolvedValueOnce(null);
      const updated = { id: 1, marcaSimcardId: 1, planoMb: 1000 };
      prisma.planoSimcard.update.mockResolvedValue(updated);

      const result = await service.updatePlanoSimcard(1, { planoMb: 1000 });

      expect(result).toEqual(updated);
    });
  });

  describe('deletePlanoSimcard', () => {
    it('lança NotFoundException quando plano não existe', async () => {
      prisma.planoSimcard.findUnique.mockResolvedValue(null);

      await expect(service.deletePlanoSimcard(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('desativa plano e atualiza temPlanos da marca quando não há mais planos ativos', async () => {
      prisma.planoSimcard.findUnique.mockResolvedValue({
        id: 1,
        marcaSimcardId: 1,
        planoMb: 500,
      });
      prisma.planoSimcard.update.mockResolvedValue({ id: 1, ativo: false });
      prisma.planoSimcard.count.mockResolvedValue(0);
      prisma.marcaSimcard.update.mockResolvedValue({ id: 1, temPlanos: false });

      await service.deletePlanoSimcard(1);

      expect(prisma.planoSimcard.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ativo: false },
        include: expect.any(Object),
      });
      expect(prisma.marcaSimcard.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { temPlanos: false },
      });
    });
  });
});
