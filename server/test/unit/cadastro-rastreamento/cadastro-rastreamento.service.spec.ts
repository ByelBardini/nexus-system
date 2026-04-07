import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  StatusOS,
  StatusCadastro,
  Plataforma,
  StatusAparelho,
  TipoOS,
  TipoAparelho,
} from '@prisma/client';
import { CadastroRastreamentoService } from 'src/cadastro-rastreamento/cadastro-rastreamento.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('CadastroRastreamentoService', () => {
  let service: CadastroRastreamentoService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CadastroRastreamentoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CadastroRastreamentoService>(CadastroRastreamentoService);
    jest.clearAllMocks();
  });

  // ─── findPendentes ──────────────────────────────────────────────────────────

  describe('findPendentes', () => {
    it('retorna resultado paginado com defaults de page=1 e limit=20', async () => {
      const items = [
        { id: 1, statusCadastro: StatusCadastro.AGUARDANDO, status: StatusOS.AGUARDANDO_CADASTRO, aparelhoEntrada: null, aparelhoSaida: null },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);

      const result = await service.findPendentes({});

      expect(result).toEqual({ data: items, total: 1 });
      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('aplica paginação correta para page=2 e limit=10', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ page: 2, limit: 10 });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('sempre inclui AGUARDANDO na query OR independente do período', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({
        dataInicio: new Date('2025-01-01'),
        dataFim: new Date('2025-01-31'),
      });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ statusCadastro: StatusCadastro.AGUARDANDO }),
            ]),
          }),
        }),
      );
    });

    it('aplica filtro de período apenas para EM_CADASTRO e CONCLUIDO', async () => {
      const dataInicio = new Date('2025-01-01');
      const dataFim = new Date('2025-01-31');
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ dataInicio, dataFim });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                statusCadastro: { in: [StatusCadastro.EM_CADASTRO, StatusCadastro.CONCLUIDO] },
                criadoEm: expect.objectContaining({ gte: dataInicio, lte: dataFim }),
              }),
            ]),
          }),
        }),
      );
    });

    it('sem filtro de período não inclui restrição de data para EM_CADASTRO e CONCLUIDO', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({});

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      const orClause = call?.where?.OR ?? [];
      const nonAguardandoClause = orClause.find(
        (c: any) => c.statusCadastro?.in !== undefined || c.statusCadastro !== StatusCadastro.AGUARDANDO,
      );
      if (nonAguardandoClause) {
        expect(nonAguardandoClause).not.toHaveProperty('criadoEm');
      }
    });

    it('filtra por plataforma quando informada', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ plataforma: Plataforma.GETRAK });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ plataforma: Plataforma.GETRAK }),
        }),
      );
    });

    it('não inclui filtro de plataforma quando não informada', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({});

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      expect(call?.where).not.toHaveProperty('plataforma');
    });

    it('filtra por statusCadastro quando informado', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ statusCadastro: StatusCadastro.EM_CADASTRO });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statusCadastro: StatusCadastro.EM_CADASTRO }),
        }),
      );
    });

    it('retorna total correto junto dos dados', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(42);

      const result = await service.findPendentes({});

      expect(result.total).toBe(42);
    });

    it('inclui relações de cliente, subcliente, tecnico e veiculo', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({});

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            cliente: true,
            subcliente: true,
            tecnico: true,
            veiculo: true,
          }),
        }),
      );
    });
  });

  // ─── iniciarCadastro ────────────────────────────────────────────────────────

  describe('iniciarCadastro', () => {
    it('atualiza statusCadastro de AGUARDANDO para EM_CADASTRO', async () => {
      const os = {
        id: 1,
        numero: 100,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: StatusCadastro.AGUARDANDO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);
      prisma.ordemServico.update.mockResolvedValue({ ...os, statusCadastro: StatusCadastro.EM_CADASTRO });

      await service.iniciarCadastro(1);

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { statusCadastro: StatusCadastro.EM_CADASTRO },
      });
    });

    it('retorna a OS atualizada', async () => {
      const os = {
        id: 1,
        numero: 100,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: StatusCadastro.AGUARDANDO,
      };
      const updated = { ...os, statusCadastro: StatusCadastro.EM_CADASTRO };
      prisma.ordemServico.findUnique.mockResolvedValue(os);
      prisma.ordemServico.update.mockResolvedValue(updated);

      const result = await service.iniciarCadastro(1);

      expect(result).toEqual(updated);
    });

    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      await expect(service.iniciarCadastro(999)).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando OS não está em AGUARDANDO_CADASTRO', async () => {
      const os = {
        id: 1,
        status: StatusOS.EM_TESTES,
        statusCadastro: StatusCadastro.AGUARDANDO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(service.iniciarCadastro(1)).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando statusCadastro não é AGUARDANDO', async () => {
      const os = {
        id: 1,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: StatusCadastro.EM_CADASTRO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(service.iniciarCadastro(1)).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando statusCadastro é null', async () => {
      const os = {
        id: 1,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: null,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(service.iniciarCadastro(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── concluirCadastro — INSTALACAO ──────────────────────────────────────────

  describe('concluirCadastro — INSTALACAO_COM_BLOQUEIO', () => {
    const osBase = {
      id: 1,
      numero: 100,
      tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
      status: StatusOS.AGUARDANDO_CADASTRO,
      statusCadastro: StatusCadastro.EM_CADASTRO,
      idAparelho: '862590041223451',
      idEntrada: null,
      iccidAparelho: '8955010000001234567',
      iccidEntrada: null,
      subclienteId: 5,
      veiculoId: 3,
    };

    const aparelho = {
      id: 10,
      identificador: '862590041223451',
      tipo: TipoAparelho.RASTREADOR,
      status: StatusAparelho.COM_TECNICO,
    };

    it('vincula aparelho ao subclienteId e veiculoId da OS', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: aparelho.id },
          data: expect.objectContaining({
            subclienteId: osBase.subclienteId,
            veiculoId: osBase.veiculoId,
            status: StatusAparelho.INSTALADO,
          }),
        }),
      );
    });

    it('busca aparelho pelo idAparelho (IMEI) da OS', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: osBase.idAparelho },
        }),
      );
    });

    it('atualiza OS com statusCadastro=CONCLUIDO, status=FINALIZADO, plataforma e concluidoPorId', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.ordemServico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: StatusOS.FINALIZADO,
            statusCadastro: StatusCadastro.CONCLUIDO,
            plataforma: Plataforma.GETRAK,
            concluidoPorId: 10,
          }),
        }),
      );
    });

    it('inclui concluidoEm na atualização da OS', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10);

      const updateCall = prisma.ordemServico.update.mock.calls[0][0];
      expect(updateCall.data.concluidoEm).toBeInstanceOf(Date);
    });

    it('cria historico de OS com AGUARDANDO_CADASTRO → FINALIZADO', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.oSHistorico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ordemServicoId: 1,
          statusAnterior: StatusOS.AGUARDANDO_CADASTRO,
          statusNovo: StatusOS.FINALIZADO,
        }),
      });
    });

    it('executa dentro de $transaction', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      await expect(
        service.concluirCadastro(999, { plataforma: Plataforma.GETRAK }, 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando statusCadastro não é EM_CADASTRO', async () => {
      const os = { ...osBase, statusCadastro: StatusCadastro.AGUARDANDO };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(
        service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança NotFoundException quando aparelho não encontrado pelo IMEI', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osBase);
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await expect(
        service.concluirCadastro(1, { plataforma: Plataforma.GETRAK }, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('concluirCadastro — INSTALACAO_SEM_BLOQUEIO', () => {
    it('vincula aparelho da mesma forma que INSTALACAO_COM_BLOQUEIO', async () => {
      const os = {
        id: 2,
        numero: 101,
        tipo: TipoOS.INSTALACAO_SEM_BLOQUEIO,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: StatusCadastro.EM_CADASTRO,
        idAparelho: '111222333444555',
        idEntrada: null,
        iccidAparelho: '8955010000009999',
        iccidEntrada: null,
        subclienteId: 7,
        veiculoId: 9,
      };
      const aparelho = { id: 20, identificador: '111222333444555', status: StatusAparelho.COM_TECNICO };
      prisma.ordemServico.findUnique.mockResolvedValue(os);
      prisma.aparelho.findFirst.mockResolvedValue(aparelho);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(2, { plataforma: Plataforma.GEOMAPS }, 5);

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 20 },
          data: expect.objectContaining({
            subclienteId: 7,
            veiculoId: 9,
            status: StatusAparelho.INSTALADO,
          }),
        }),
      );
    });
  });

  // ─── concluirCadastro — REVISAO ─────────────────────────────────────────────

  describe('concluirCadastro — REVISAO', () => {
    const osRevisao = {
      id: 3,
      numero: 102,
      tipo: TipoOS.REVISAO,
      status: StatusOS.AGUARDANDO_CADASTRO,
      statusCadastro: StatusCadastro.EM_CADASTRO,
      idAparelho: '999888777666555',
      idEntrada: '123456789012345',
      iccidAparelho: '8955010000002222',
      iccidEntrada: '8955010000001111',
      subclienteId: 5,
      veiculoId: 3,
    };

    const aparelhoAntigo = {
      id: 50,
      identificador: '123456789012345',
      tipo: TipoAparelho.RASTREADOR,
      status: StatusAparelho.INSTALADO,
    };

    const aparelhoNovo = {
      id: 60,
      identificador: '999888777666555',
      tipo: TipoAparelho.RASTREADOR,
      status: StatusAparelho.COM_TECNICO,
    };

    it('desvincula aparelho antigo: status=EM_ESTOQUE, subclienteId=null, veiculoId=null, observacao="aparelho usado"', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo) // busca pelo idEntrada
        .mockResolvedValueOnce(aparelhoNovo);  // busca pelo idAparelho
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: aparelhoAntigo.id },
          data: expect.objectContaining({
            status: StatusAparelho.EM_ESTOQUE,
            subclienteId: null,
            veiculoId: null,
            observacao: expect.stringContaining('usado'),
          }),
        }),
      );
    });

    it('vincula aparelho novo ao subclienteId e veiculoId da OS', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo)
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: aparelhoNovo.id },
          data: expect.objectContaining({
            subclienteId: osRevisao.subclienteId,
            veiculoId: osRevisao.veiculoId,
            status: StatusAparelho.INSTALADO,
          }),
        }),
      );
    });

    it('busca aparelho antigo pelo idEntrada e aparelho novo pelo idAparelho', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo)
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { identificador: osRevisao.idEntrada } }),
      );
      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { identificador: osRevisao.idAparelho } }),
      );
    });

    it('quando aparelho antigo não existe no sistema, cria novo Aparelho com IMEI, ICCID e observacao="aparelho usado"', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)        // aparelho antigo não encontrado
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.aparelho.create.mockResolvedValue({ id: 99 });
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            identificador: osRevisao.idEntrada,
            tipo: TipoAparelho.RASTREADOR,
            observacao: expect.stringContaining('usado'),
          }),
        }),
      );
    });

    it('quando aparelho antigo não existe, não tenta update do aparelho antigo por id', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.aparelho.create.mockResolvedValue({ id: 99 });
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      // Apenas o aparelho novo deve ser atualizado (para INSTALADO)
      const updateCalls = prisma.aparelho.update.mock.calls;
      updateCalls.forEach((call) => {
        expect(call[0].data).not.toMatchObject({ status: StatusAparelho.EM_ESTOQUE });
      });
    });

    it('atualiza OS e cria historico AGUARDANDO_CADASTRO → FINALIZADO', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo)
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.ordemServico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StatusOS.FINALIZADO,
            statusCadastro: StatusCadastro.CONCLUIDO,
          }),
        }),
      );
      expect(prisma.oSHistorico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusAnterior: StatusOS.AGUARDANDO_CADASTRO,
            statusNovo: StatusOS.FINALIZADO,
          }),
        }),
      );
    });

    it('lança NotFoundException quando aparelho novo não encontrado pelo IMEI', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo)
        .mockResolvedValueOnce(null); // aparelho novo não encontrado

      await expect(
        service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── concluirCadastro — RETIRADA ────────────────────────────────────────────

  describe('concluirCadastro — RETIRADA', () => {
    const osRetirada = {
      id: 4,
      numero: 103,
      tipo: TipoOS.RETIRADA,
      status: StatusOS.AGUARDANDO_CADASTRO,
      statusCadastro: StatusCadastro.EM_CADASTRO,
      idAparelho: null,
      idEntrada: '555444333222111',
      iccidAparelho: null,
      iccidEntrada: '8955010000005555',
      subclienteId: 8,
      veiculoId: 6,
    };

    const aparelhoRetirado = {
      id: 70,
      identificador: '555444333222111',
      tipo: TipoAparelho.RASTREADOR,
      status: StatusAparelho.INSTALADO,
    };

    it('desvincula aparelho: status=EM_ESTOQUE, subclienteId=null, veiculoId=null', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue(aparelhoRetirado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: aparelhoRetirado.id },
          data: expect.objectContaining({
            status: StatusAparelho.EM_ESTOQUE,
            subclienteId: null,
            veiculoId: null,
          }),
        }),
      );
    });

    it('não tenta vincular aparelho novo (apenas desvinculação)', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue(aparelhoRetirado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.update).toHaveBeenCalledTimes(1);
      expect(prisma.aparelho.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusAparelho.INSTALADO }),
        }),
      );
    });

    it('quando aparelho não existe no sistema, cria novo Aparelho com IMEI, ICCID e observacao="aparelho usado"', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue(null);
      prisma.aparelho.create.mockResolvedValue({ id: 100 });
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            identificador: osRetirada.idEntrada,
            tipo: TipoAparelho.RASTREADOR,
            observacao: expect.stringContaining('usado'),
          }),
        }),
      );
      expect(prisma.aparelho.update).not.toHaveBeenCalled();
    });

    it('atualiza OS com statusCadastro=CONCLUIDO e status=FINALIZADO', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue(aparelhoRetirado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.ordemServico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StatusOS.FINALIZADO,
            statusCadastro: StatusCadastro.CONCLUIDO,
          }),
        }),
      );
    });

    it('cria historico AGUARDANDO_CADASTRO → FINALIZADO', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue(aparelhoRetirado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.oSHistorico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ordemServicoId: 4,
            statusAnterior: StatusOS.AGUARDANDO_CADASTRO,
            statusNovo: StatusOS.FINALIZADO,
          }),
        }),
      );
    });
  });
});
