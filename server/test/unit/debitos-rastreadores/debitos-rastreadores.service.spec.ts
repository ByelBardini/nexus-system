import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { debitoRastreadorClienteMarcaModeloInclude } from 'src/debitos-rastreadores/debito-rastreador.include';
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

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledTimes(1);
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

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledTimes(1);
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

    it('quando delta iguala saldo reverso, decrementa até zero com um único histórico', async () => {
      prisma.debitoRastreador.findFirst.mockResolvedValueOnce({
        id: 7,
        quantidade: 4,
      });
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), { ...baseParams, delta: 4 });

      expect(prisma.debitoRastreador.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 7 },
          data: { quantidade: { decrement: 4 } },
        }),
      );
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledTimes(1);
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ debitoId: 7, delta: -4 }),
        }),
      );
      expect(prisma.debitoRastreador.findFirst).toHaveBeenCalledTimes(1);
    });

    it('quando delta excede saldo reverso, zera reverso, grava histórico do abatimento e cria débito direto com o restante', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce({ id: 7, quantidade: 2 })
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 30 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), { ...baseParams, delta: 5 });

      expect(prisma.debitoRastreador.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 7 },
          data: { quantidade: 0 },
        }),
      );
      expect(prisma.debitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantidade: 3,
            devedorTipo: 'CLIENTE',
            credorTipo: 'INFINITY',
          }),
        }),
      );
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledTimes(2);
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({ debitoId: 7, delta: -2 }),
        }),
      );
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({ debitoId: 30, delta: 3 }),
        }),
      );
    });

    it('quando delta excede saldo reverso e já existe débito direto, incrementa o existente em vez de criar', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce({ id: 7, quantidade: 2 })
        .mockResolvedValueOnce({ id: 11, quantidade: 1 });
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), { ...baseParams, delta: 5 });

      expect(prisma.debitoRastreador.create).not.toHaveBeenCalled();
      expect(prisma.debitoRastreador.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 11 },
          data: { quantidade: { increment: 3 } },
        }),
      );
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({ debitoId: 11, delta: 3 }),
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

    it('passa ordemServicoId ao histórico quando informado', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 1 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        ordemServicoId: 42,
      });

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ordemServicoId: 42 }),
        }),
      );
    });

    it('grava ordemServicoId null quando não informado', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 1 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), baseParams);

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ordemServicoId: null }),
        }),
      );
    });

    it('propaga metadados do histórico em ambos os lançamentos quando delta excede saldo reverso', async () => {
      prisma.debitoRastreador.findFirst
        .mockResolvedValueOnce({ id: 7, quantidade: 1 })
        .mockResolvedValueOnce(null);
      prisma.debitoRastreador.update.mockResolvedValue({});
      prisma.debitoRastreador.create.mockResolvedValueOnce({ id: 40 });
      prisma.historicoDebitoRastreador.create.mockResolvedValue({});

      await service.consolidarDebitoTx(tx(), {
        ...baseParams,
        delta: 4,
        pedidoId: 9,
        loteId: null,
        aparelhoId: 88,
      });

      expect(prisma.historicoDebitoRastreador.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({
            pedidoId: 9,
            aparelhoId: 88,
          }),
        }),
      );
      expect(prisma.historicoDebitoRastreador.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            pedidoId: 9,
            aparelhoId: 88,
          }),
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

    it('por padrão não inclui historicos na resposta', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.not.objectContaining({
            historicos: expect.anything(),
          }),
        }),
      );
    });

    it('inclui historicos quando incluirHistoricos é true', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({ incluirHistoricos: true });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            historicos: expect.objectContaining({
              include: expect.objectContaining({
                ordemServico: { select: { id: true, numero: true } },
              }),
            }),
          }),
        }),
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

    it('filtra por devedorTipo e credorTipo', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(0);

      await service.findAll({
        devedorTipo: 'INFINITY',
        credorTipo: 'CLIENTE',
      });

      expect(prisma.debitoRastreador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            devedorTipo: 'INFINITY',
            credorTipo: 'CLIENTE',
          }),
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

    it('totalPages usa limit válido após aplicar teto de 500', async () => {
      prisma.debitoRastreador.findMany.mockResolvedValue([]);
      prisma.debitoRastreador.count.mockResolvedValue(1000);

      const result = await service.findAll({ limit: 9999 });

      expect(result.limit).toBe(500);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('findOne', () => {
    it('retorna débito quando encontrado', async () => {
      const debito = { id: 1, quantidade: 2, devedorCliente: null };
      prisma.debitoRastreador.findUnique.mockResolvedValue(debito);

      const result = await service.findOne(1);

      expect(result).toEqual(debito);
      expect(prisma.debitoRastreador.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: debitoRastreadorClienteMarcaModeloInclude,
      });
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
