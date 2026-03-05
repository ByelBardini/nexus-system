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

      await expect(service.findOneMarca(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneMarca(999)).rejects.toThrow('Marca não encontrada');
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
      prisma.marcaEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'Queclink' });

      await expect(service.createMarca({ nome: 'Queclink' })).rejects.toThrow(ConflictException);
      await expect(service.createMarca({ nome: 'Queclink' })).rejects.toThrow('Marca já existe');
    });

    it('cria nova marca quando nome não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);
      const created = { id: 1, nome: 'Nova Marca' };
      prisma.marcaEquipamento.create.mockResolvedValue(created);

      const result = await service.createMarca({ nome: 'Nova Marca' });

      expect(result).toEqual(created);
      expect(prisma.marcaEquipamento.create).toHaveBeenCalledWith({ data: { nome: 'Nova Marca' } });
    });
  });

  describe('updateMarca', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.updateMarca(999, { nome: 'Novo' })).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando novo nome já pertence a outra marca', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'Queclink', modelos: [] });
      prisma.marcaEquipamento.findFirst.mockResolvedValue({ id: 2, nome: 'Teltonika' });

      await expect(service.updateMarca(1, { nome: 'Teltonika' })).rejects.toThrow(ConflictException);
    });

    it('atualiza marca quando nome não conflita', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'Queclink', modelos: [] });
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
      prisma.marcaEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'Queclink', modelos: [] });
      const deleted = { id: 1, nome: 'Queclink' };
      prisma.marcaEquipamento.delete.mockResolvedValue(deleted);

      const result = await service.deleteMarca(1);

      expect(result).toEqual(deleted);
      expect(prisma.marcaEquipamento.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ============= MODELOS =============

  describe('findAllModelos', () => {
    it('retorna todos os modelos sem filtro de marcaId', async () => {
      const modelos = [{ id: 1, nome: 'GV300', marca: { id: 1, nome: 'Queclink' } }];
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

      await expect(service.findOneModelo(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneModelo(999)).rejects.toThrow('Modelo não encontrado');
    });
  });

  describe('createModelo', () => {
    it('lança NotFoundException quando marca não existe', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.createModelo({ nome: 'GV300', marcaId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException quando modelo já existe para a marca', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'Queclink' });
      prisma.modeloEquipamento.findFirst.mockResolvedValue({ id: 1, nome: 'GV300' });

      await expect(service.createModelo({ nome: 'GV300', marcaId: 1 })).rejects.toThrow(
        ConflictException,
      );
    });

    it('cria modelo quando não existe conflito', async () => {
      prisma.marcaEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'Queclink' });
      prisma.modeloEquipamento.findFirst.mockResolvedValue(null);
      const created = { id: 1, nome: 'GV300', marcaId: 1, marca: { id: 1, nome: 'Queclink' } };
      prisma.modeloEquipamento.create.mockResolvedValue(created);

      const result = await service.createModelo({ nome: 'GV300', marcaId: 1 });

      expect(result).toEqual(created);
    });
  });

  describe('deleteModelo', () => {
    it('lança NotFoundException quando modelo não existe', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue(null);

      await expect(service.deleteModelo(999)).rejects.toThrow(NotFoundException);
    });

    it('deleta modelo existente', async () => {
      prisma.modeloEquipamento.findUnique.mockResolvedValue({ id: 1, nome: 'GV300', marca: {} });
      prisma.modeloEquipamento.delete.mockResolvedValue({ id: 1, nome: 'GV300' });

      await service.deleteModelo(1);

      expect(prisma.modeloEquipamento.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ============= OPERADORAS =============

  describe('findAllOperadoras', () => {
    it('retorna lista de operadoras', async () => {
      const operadoras = [{ id: 1, nome: 'Vivo' }, { id: 2, nome: 'Claro' }];
      prisma.operadora.findMany.mockResolvedValue(operadoras);

      const result = await service.findAllOperadoras();

      expect(result).toEqual(operadoras);
    });
  });

  describe('findOneOperadora', () => {
    it('lança NotFoundException quando operadora não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(service.findOneOperadora(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneOperadora(999)).rejects.toThrow('Operadora não encontrada');
    });
  });

  describe('createOperadora', () => {
    it('lança ConflictException quando operadora já existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });

      await expect(service.createOperadora({ nome: 'Vivo' })).rejects.toThrow(ConflictException);
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

      await expect(service.updateOperadora(999, { nome: 'Novo' })).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando novo nome já existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });
      prisma.operadora.findFirst.mockResolvedValue({ id: 2, nome: 'Tim' });

      await expect(service.updateOperadora(1, { nome: 'Tim' })).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteOperadora', () => {
    it('lança NotFoundException quando operadora não existe', async () => {
      prisma.operadora.findUnique.mockResolvedValue(null);

      await expect(service.deleteOperadora(999)).rejects.toThrow(NotFoundException);
    });

    it('deleta operadora existente', async () => {
      prisma.operadora.findUnique.mockResolvedValue({ id: 1, nome: 'Vivo' });
      prisma.operadora.delete.mockResolvedValue({ id: 1, nome: 'Vivo' });

      await service.deleteOperadora(1);

      expect(prisma.operadora.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
