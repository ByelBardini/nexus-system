import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('DebitosRastreadoresService', () => {
  let service: DebitosRastreadoresService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const baseParams = {
    devedorTipo: 'CLIENTE' as const,
    devedorClienteId: 2,
    credorTipo: 'INFINITY' as const,
    credorClienteId: null,
    marcaId: 5,
    modeloId: 15,
    delta: 1,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebitosRastreadoresService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DebitosRastreadoresService>(
      DebitosRastreadoresService,
    );
    jest.clearAllMocks();
  });

  const tx = () => prisma as unknown as Prisma.TransactionClient;

  describe('consolidarDebitoTx', () => {
    it('não cria débito quando devedor e credor são a mesma entidade', async () => {
      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        devedorTipo: 'CLIENTE',
        devedorClienteId: 3,
        credorTipo: 'CLIENTE',
        credorClienteId: 3,
      });

      expect(prisma.debitoRastreador.findFirst).not.toHaveBeenCalled();
      expect(prisma.debitoRastreador.create).not.toHaveBeenCalled();
      expect(prisma.historicoDebitoRastreador.create).not.toHaveBeenCalled();
    });

    it('não cria débito quando ambos são INFINITY (mesma entidade)', async () => {
      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        devedorTipo: 'INFINITY',
        devedorClienteId: null,
        credorTipo: 'INFINITY',
        credorClienteId: null,
      });

      expect(prisma.debitoRastreador.create).not.toHaveBeenCalled();
    });

    it('cria novo débito quando não existe nenhum registro', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 42 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), baseParams);

      expect(prisma.debitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            devedorTipo: 'CLIENTE',
            devedorClienteId: 2,
            credorTipo: 'INFINITY',
            credorClienteId: null,
            marcaId: 5,
            modeloId: 15,
            quantidade: 1,
          }),
        }),
      );
    });

    it('registra histórico com delta positivo ao criar novo débito', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 42 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        delta: 1,
        aparelhoId: 99,
      });

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            debitoId: 42,
            delta: 1,
            aparelhoId: 99,
            pedidoId: null,
            loteId: null,
          }),
        }),
      );
    });

    it('incrementa débito direto quando já existe registro no mesmo sentido', async () => {
      const existingDebito = { id: 10, quantidade: 2 };
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingDebito);
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), baseParams);

      expect(prisma.debitoRastreador.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { quantidade: { increment: 1 } },
        }),
      );
      expect(prisma.debitoRastreador.create).not.toHaveBeenCalled();
    });

    it('abate dívida reversa existente quando há saldo positivo', async () => {
      const reverseDebito = { id: 7, quantidade: 3 };
      prisma.debitoRastreador.findFirst.mockResolvedValueOnce(reverseDebito);
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), baseParams);

      expect(prisma.debitoRastreador.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 7 },
          data: { quantidade: { decrement: 1 } },
        }),
      );
      expect(prisma.debitoRastreador.create).not.toHaveBeenCalled();
    });

    it('registra histórico com delta negativo ao abater dívida reversa', async () => {
      prisma.debitoRastreador.findFirst.mockResolvedValueOnce({
        id: 7,
        quantidade: 3,
      });
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        delta: 1,
        pedidoId: 55,
      });

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            debitoId: 7,
            delta: -1,
            pedidoId: 55,
          }),
        }),
      );
    });

    it('não abate dívida reversa quando saldo é zero — cria novo débito direto', async () => {
      const reverseComSaldoZero = { id: 7, quantidade: 0 };
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(reverseComSaldoZero)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 20 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), baseParams);

      expect(prisma.debitoRastreador.update).not.toHaveBeenCalled();
      expect(prisma.debitoRastreador.create).toHaveBeenCalled();
    });

    it('busca dívida reversa com devedor e credor invertidos', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 1 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), baseParams);

      expect(prisma.debitoRastreador.findFirst).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            devedorTipo: 'INFINITY',
            devedorClienteId: null,
            credorTipo: 'CLIENTE',
            credorClienteId: 2,
          }),
        }),
      );
    });

    it('passa loteId ao histórico quando informado', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 1 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        loteId: 77,
      });

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loteId: 77 }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const debitos = [{ id: 1, quantidade: 2 }];

    it('retorna lista paginada com defaults', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue(debitos);
      prisma.debitoRastreador.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: debitos,
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 100 }),
      );
    });

    it('aplica paginação informada', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ page: 3, limit: 10 });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('filtra por devedorClienteId', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ devedorClienteId: 4 });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ devedorClienteId: 4 }),
        }),
      );
    });

    it('filtra por credorClienteId', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ credorClienteId: 7 });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ credorClienteId: 7 }),
        }),
      );
    });

    it('filtra status aberto com quantidade > 0', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ status: 'aberto' });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ quantidade: { gt: 0 } }),
        }),
      );
    });

    it('filtra status quitado com quantidade <= 0', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ status: 'quitado' });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ quantidade: { lte: 0 } }),
        }),
      );
    });

    it('limita o máximo de registros a 500', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ limit: 9999 });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 500 }),
      );
    });
  });

  describe('findOne', () => {
    it('retorna débito quando encontrado', async () => {
      const debito = { id: 1, quantidade: 2, devedorCliente: null };
      prisma.debitoRastreador.findUnique.mockResolvedValue(debito);

      const result = await service.findOne(1);

      expect(result).toEqual(debito);
      expect(prisma.debitoRastreador.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('lança NotFoundException quando débito não existe', async () => {
      prisma.debitoRastreador.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Débito não encontrado',
      );
    });
  });
});
