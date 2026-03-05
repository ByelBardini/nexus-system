import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdensServicoService } from 'src/ordens-servico/ordens-servico.service';
import { StatusOS } from '@prisma/client';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('OrdensServicoService', () => {
  let service: OrdensServicoService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdensServicoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrdensServicoService>(OrdensServicoService);
    jest.clearAllMocks();
  });

  describe('getResumo', () => {
    it('retorna contagens por status', async () => {
      prisma.ordemServico.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(10);

      const result = await service.getResumo();

      expect(result).toEqual({
        agendado: 5,
        emTestes: 3,
        testesRealizados: 2,
        aguardandoCadastro: 1,
        finalizado: 10,
      });
      expect(prisma.ordemServico.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('findAll', () => {
    it('retorna resultado paginado com defaults de page=1 e limit=15', async () => {
      const items = [{ id: 1, numero: 1, status: StatusOS.AGENDADO }];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({ items, total: 1, page: 1, limit: 15, totalPages: 1 });
      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 15 }),
      );
    });

    it('filtra por status quando informado', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findAll({ status: StatusOS.AGENDADO });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: StatusOS.AGENDADO }),
        }),
      );
    });

    it('filtra por search numérico no número da OS', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findAll({ search: '42' });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ numero: 42 }]),
          }),
        }),
      );
    });

    it('filtra por search textual nos campos de cliente, técnico e veículo', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findAll({ search: 'Carlos' });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('limita page ao máximo de 100', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      const result = await service.findAll({ limit: 200 });

      expect(result.limit).toBe(100);
    });

    it('garante page mínimo de 1', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 0 });

      expect(result.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Ordem de serviço não encontrada');
    });

    it('retorna OS quando encontrada', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      const result = await service.findOne(1);

      expect(result).toEqual(os);
    });
  });

  describe('create', () => {
    it('gera número sequencial e cria OS', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 41 } });
      const created = { id: 1, numero: 42, status: StatusOS.AGENDADO };
      prisma.ordemServico.create.mockResolvedValue(created);

      const result = await service.create(
        { tipo: 'INSTALACAO', clienteId: 1 } as any,
        100,
      );

      expect(result.numero).toBe(42);
      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: 42, criadoPorId: 100 }),
        }),
      );
    });

    it('usa número 1 quando não há OS anteriores', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: null } });
      prisma.ordemServico.create.mockResolvedValue({ id: 1, numero: 1 });

      await service.create({ tipo: 'INSTALACAO' } as any);

      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: 1 }),
        }),
      );
    });

    it('usa status AGENDADO como padrão', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 0 } });
      prisma.ordemServico.create.mockResolvedValue({ id: 1, numero: 1 });

      await service.create({ tipo: 'INSTALACAO' } as any);

      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusOS.AGENDADO }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, { status: StatusOS.EM_TESTES })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna OS sem alterar quando status já é o mesmo', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      const result = await service.updateStatus(1, { status: StatusOS.AGENDADO });

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(os);
    });

    it('registra histórico e atualiza status quando novo status é diferente', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.EM_TESTES });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateStatus(1, { status: StatusOS.EM_TESTES });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toMatchObject({ status: StatusOS.EM_TESTES });
    });
  });
});
