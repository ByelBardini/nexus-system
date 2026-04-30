import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { TabelasConfigService } from 'src/tabelas-config/tabelas-config.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('TabelasConfigService', () => {
  let service: TabelasConfigService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TabelasConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<TabelasConfigService>(TabelasConfigService);
    jest.clearAllMocks();
  });

  describe('listarCategoriasFalha', () => {
    it('delega ao Prisma com orderBy nome asc', async () => {
      const categorias = [{ id: 1, nome: 'Dano Físico', ativo: true, motivaTexto: false }];
      prisma.categoriaFalhaRastreador.findMany.mockResolvedValue(categorias);

      const result = await service.listarCategoriasFalha();

      expect(prisma.categoriaFalhaRastreador.findMany).toHaveBeenCalledWith({
        orderBy: { nome: 'asc' },
      });
      expect(result).toEqual(categorias);
    });
  });

  describe('listarCategoriasFalhaAtivas', () => {
    it('filtra somente ativas com orderBy nome asc', async () => {
      prisma.categoriaFalhaRastreador.findMany.mockResolvedValue([]);

      await service.listarCategoriasFalhaAtivas();

      expect(prisma.categoriaFalhaRastreador.findMany).toHaveBeenCalledWith({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
      });
    });
  });

  describe('criarCategoriaFalha', () => {
    it('cria categoria quando nome não existe', async () => {
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue(null);
      const criada = { id: 1, nome: 'Nova', ativo: true, motivaTexto: false };
      prisma.categoriaFalhaRastreador.create.mockResolvedValue(criada);

      const result = await service.criarCategoriaFalha({ nome: 'Nova' });

      expect(prisma.categoriaFalhaRastreador.create).toHaveBeenCalledWith({
        data: { nome: 'Nova', motivaTexto: false },
      });
      expect(result).toEqual(criada);
    });

    it('lança BadRequestException quando nome já existe', async () => {
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue({ id: 1, nome: 'Dano Físico' });

      await expect(
        service.criarCategoriaFalha({ nome: 'Dano Físico' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cria com motivaTexto=true quando enviado', async () => {
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue(null);
      prisma.categoriaFalhaRastreador.create.mockResolvedValue({});

      await service.criarCategoriaFalha({ nome: 'Outro', motivaTexto: true });

      expect(prisma.categoriaFalhaRastreador.create).toHaveBeenCalledWith({
        data: { nome: 'Outro', motivaTexto: true },
      });
    });
  });

  describe('atualizarCategoriaFalha', () => {
    it('atualiza categoria existente', async () => {
      const existente = { id: 1, nome: 'Dano Físico', ativo: true, motivaTexto: false };
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue(existente);
      prisma.categoriaFalhaRastreador.update.mockResolvedValue({ ...existente, nome: 'Dano Físico Atualizado' });

      const result = await service.atualizarCategoriaFalha(1, { nome: 'Dano Físico Atualizado' });

      expect(prisma.categoriaFalhaRastreador.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nome: 'Dano Físico Atualizado' },
      });
      expect(result.nome).toBe('Dano Físico Atualizado');
    });

    it('lança NotFoundException quando categoria não existe', async () => {
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue(null);

      await expect(
        service.atualizarCategoriaFalha(999, { nome: 'Qualquer' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('desativarCategoriaFalha', () => {
    it('seta ativo=false na categoria existente', async () => {
      const existente = { id: 1, nome: 'Dano Físico', ativo: true, motivaTexto: false };
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue(existente);
      prisma.categoriaFalhaRastreador.update.mockResolvedValue({ ...existente, ativo: false });

      await service.desativarCategoriaFalha(1);

      expect(prisma.categoriaFalhaRastreador.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ativo: false },
      });
    });

    it('lança NotFoundException quando categoria não existe', async () => {
      prisma.categoriaFalhaRastreador.findUnique.mockResolvedValue(null);

      await expect(service.desativarCategoriaFalha(999)).rejects.toThrow(NotFoundException);
    });
  });
});
