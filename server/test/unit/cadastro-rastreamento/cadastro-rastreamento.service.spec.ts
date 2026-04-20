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

    service = module.get<CadastroRastreamentoService>(
      CadastroRastreamentoService,
    );
    jest.clearAllMocks();
  });

  // ─── findPendentes ──────────────────────────────────────────────────────────

  describe('findPendentes', () => {
    it('retorna resultado paginado com defaults de page=1 e limit=20', async () => {
      const items = [
        {
          id: 1,
          statusCadastro: StatusCadastro.AGUARDANDO,
          status: StatusOS.AGUARDANDO_CADASTRO,
          aparelhoEntrada: null,
          aparelhoSaida: null,
        },
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

    it('com período, aplica criadoEm a AGUARDANDO e aos demais status (AND + OR)', async () => {
      const dataInicio = new Date('2025-01-01T00:00:00.000Z');
      const dataFim = new Date('2025-02-01T00:00:00.000Z');
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ dataInicio, dataFim });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                OR: expect.arrayContaining([
                  { statusCadastro: StatusCadastro.AGUARDANDO },
                  {
                    statusCadastro: {
                      in: [
                        StatusCadastro.EM_CADASTRO,
                        StatusCadastro.CONCLUIDO,
                      ],
                    },
                  },
                ]),
              },
              {
                criadoEm: {
                  gte: dataInicio,
                  lt: dataFim,
                },
              },
            ],
          }),
        }),
      );
    });

    it('aplica o mesmo intervalo de criadoEm a todos os status quando statusCadastro é informado', async () => {
      const dataInicio = new Date('2025-01-01T00:00:00.000Z');
      const dataFim = new Date('2025-02-01T00:00:00.000Z');
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({
        dataInicio,
        dataFim,
        statusCadastro: StatusCadastro.EM_CADASTRO,
      });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusCadastro: StatusCadastro.EM_CADASTRO,
            criadoEm: {
              gte: dataInicio,
              lt: dataFim,
            },
          }),
        }),
      );
    });

    it('usa dataInicio e dataFim como [gte, lt) sem somar um dia em UTC', async () => {
      const dataInicio = new Date('2026-04-19T03:00:00.000Z');
      const dataFim = new Date('2026-04-20T03:00:00.000Z');
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ dataInicio, dataFim });

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      const andClause: any[] = call?.where?.AND ?? [];
      const dateClause = andClause.find((c: any) => c.criadoEm);
      expect(dateClause.criadoEm.gte).toEqual(dataInicio);
      expect(dateClause.criadoEm.lt).toEqual(dataFim);
      expect(dateClause.criadoEm).not.toHaveProperty('lte');
    });

    it('inclui OS criada no fim do dia (23:59 UTC) dentro do filtro de mesmo dia', async () => {
      const dataInicio = new Date('2026-04-19T00:00:00.000Z');
      const dataFim = new Date('2026-04-20T00:00:00.000Z');
      const osCriadaNoFimDoDia = [
        {
          id: 1,
          criadoEm: new Date('2026-04-19T23:59:59.000Z'),
          idAparelho: null,
          idEntrada: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(osCriadaNoFimDoDia);
      prisma.ordemServico.count.mockResolvedValue(1);

      const result = await service.findPendentes({ dataInicio, dataFim });

      expect(result.total).toBe(1);

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      const andClause: any[] = call?.where?.AND ?? [];
      const dateClause = andClause.find((c: any) => c.criadoEm);
      const { gte, lt } = dateClause.criadoEm;
      const criadoEm = osCriadaNoFimDoDia[0].criadoEm;
      expect(criadoEm >= gte && criadoEm < lt).toBe(true);
    });

    it('aplica lt (exclusivo) e não lte no filtro de data para statusCadastro=CONCLUIDO', async () => {
      const dataInicio = new Date('2026-04-19T00:00:00.000Z');
      const dataFim = new Date('2026-04-20T00:00:00.000Z');
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({
        dataInicio,
        dataFim,
        statusCadastro: StatusCadastro.CONCLUIDO,
      });

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      expect(call.where.criadoEm).toMatchObject({
        gte: dataInicio,
        lt: dataFim,
      });
      expect(call.where.criadoEm).not.toHaveProperty('lte');
    });

    it('inclui OS com criadoEm no dia seguinte em UTC quando ainda é o mesmo dia local (intervalo do client)', async () => {
      const dataInicio = new Date('2026-04-19T03:00:00.000Z');
      const dataFim = new Date('2026-04-20T03:00:00.000Z');
      const osBrtFinalDoDia = [
        {
          id: 2,
          criadoEm: new Date('2026-04-20T01:07:00.000Z'),
          idAparelho: null,
          idEntrada: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(osBrtFinalDoDia);
      prisma.ordemServico.count.mockResolvedValue(1);

      const result = await service.findPendentes({ dataInicio, dataFim });

      expect(result.total).toBe(1);
      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      const andClause: any[] = call?.where?.AND ?? [];
      const dateClause = andClause.find((c: any) => c.criadoEm);
      const { gte, lt } = dateClause.criadoEm;
      const criadoEm = osBrtFinalDoDia[0].criadoEm;
      expect(criadoEm >= gte && criadoEm < lt).toBe(true);
    });

    it('sem filtro de período não inclui restrição de data para EM_CADASTRO e CONCLUIDO', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({});

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      const orClause = call?.where?.OR ?? [];
      const nonAguardandoClause = orClause.find(
        (c: any) =>
          c.statusCadastro?.in !== undefined ||
          c.statusCadastro !== StatusCadastro.AGUARDANDO,
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

      await service.findPendentes({
        statusCadastro: StatusCadastro.EM_CADASTRO,
      });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusCadastro: StatusCadastro.EM_CADASTRO,
          }),
        }),
      );
    });

    it('retorna total correto junto dos dados', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(42);

      const result = await service.findPendentes({});

      expect(result.total).toBe(42);
    });

    it('em REVISAO, aparelhoEntrada vem de idEntrada e aparelhoSaida vem de idAparelho', async () => {
      const items = [
        {
          id: 10,
          tipo: TipoOS.REVISAO,
          idAparelho: 'IMEI_ANTIGO',
          idEntrada: 'IMEI_NOVO',
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);
      prisma.aparelho.findMany.mockResolvedValue([
        {
          identificador: 'IMEI_ANTIGO',
          marca: 'MARCA_A',
          modelo: 'MOD_A',
          simVinculado: null,
        },
        {
          identificador: 'IMEI_NOVO',
          marca: 'MARCA_N',
          modelo: 'MOD_N',
          simVinculado: null,
        },
      ]);

      const result = await service.findPendentes({});

      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: TipoAparelho.RASTREADOR,
            identificador: {
              in: expect.arrayContaining(['IMEI_ANTIGO', 'IMEI_NOVO']),
            },
          }),
        }),
      );
      expect(result.data[0]).toMatchObject({
        aparelhoEntrada: expect.objectContaining({ marca: 'MARCA_N' }),
        aparelhoSaida: expect.objectContaining({ marca: 'MARCA_A' }),
      });
    });

    it('normaliza IMEIs com espaços na OS e no aparelho para enriquecer modelo/ICCID', async () => {
      const items = [
        {
          id: 12,
          tipo: TipoOS.REVISAO,
          idAparelho: '  SAIDA_IMEI  ',
          idEntrada: ' ENTRADA_IMEI ',
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);
      prisma.aparelho.findMany.mockResolvedValue([
        {
          identificador: 'SAIDA_IMEI',
          marca: 'M_S',
          modelo: 'MOD_S',
          simVinculado: {
            identificador: ' ICCID_S ',
            marcaSimcard: null,
            planoSimcard: null,
          },
        },
        {
          identificador: 'ENTRADA_IMEI',
          marca: 'M_E',
          modelo: 'MOD_E',
          simVinculado: null,
        },
      ]);

      const result = await service.findPendentes({});

      const call = prisma.aparelho.findMany.mock.calls[0][0];
      expect(call.where.identificador.in).toEqual(
        expect.arrayContaining(['SAIDA_IMEI', 'ENTRADA_IMEI']),
      );
      expect(call.where.identificador.in).toHaveLength(2);
      expect(result.data[0].aparelhoEntrada).toMatchObject({
        marca: 'M_E',
        modelo: 'MOD_E',
      });
      expect(result.data[0].aparelhoSaida).toMatchObject({
        marca: 'M_S',
        modelo: 'MOD_S',
        iccid: 'ICCID_S',
      });
    });

    it('em RETIRADA, aparelhoEntrada é null e aparelhoSaida vem de idAparelho', async () => {
      const items = [
        {
          id: 20,
          tipo: TipoOS.RETIRADA,
          idAparelho: 'IMEI_RETIRADO',
          idEntrada: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);
      prisma.aparelho.findMany.mockResolvedValue([
        {
          identificador: 'IMEI_RETIRADO',
          marca: 'MARCA_R',
          modelo: 'MOD_R',
          simVinculado: null,
        },
      ]);

      const result = await service.findPendentes({});

      expect(result.data[0]).toMatchObject({
        aparelhoEntrada: null,
        aparelhoSaida: expect.objectContaining({ marca: 'MARCA_R' }),
      });
    });

    it('em INSTALACAO, aparelhoEntrada vem de idAparelho e aparelhoSaida de idEntrada', async () => {
      const items = [
        {
          id: 11,
          tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
          idAparelho: 'IMEI_INSTALADO',
          idEntrada: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);
      prisma.aparelho.findMany.mockResolvedValue([
        {
          identificador: 'IMEI_INSTALADO',
          marca: 'MARCA_I',
          modelo: 'MOD_I',
          simVinculado: null,
        },
      ]);

      const result = await service.findPendentes({});

      expect(result.data[0]).toMatchObject({
        aparelhoEntrada: expect.objectContaining({ marca: 'MARCA_I' }),
        aparelhoSaida: null,
      });
    });

    it('regressão: INSTALACAO_SEM_BLOQUEIO enriquece aparelhoEntrada/aparelhoSaida como COM_BLOQUEIO', async () => {
      const items = [
        {
          id: 19,
          tipo: TipoOS.INSTALACAO_SEM_BLOQUEIO,
          idAparelho: 'IMEI_SB',
          idEntrada: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);
      prisma.aparelho.findMany.mockResolvedValue([
        {
          identificador: 'IMEI_SB',
          marca: 'MARCA_SB',
          modelo: 'MOD_SB',
          simVinculado: null,
        },
      ]);

      const result = await service.findPendentes({});

      expect(result.data[0]).toMatchObject({
        aparelhoEntrada: expect.objectContaining({ marca: 'MARCA_SB' }),
        aparelhoSaida: null,
      });
    });

    it('regressão: RETIRADA com idEntrada preenchido ainda enriquece só por idAparelho (entrada null)', async () => {
      const items = [
        {
          id: 20,
          tipo: TipoOS.RETIRADA,
          idAparelho: 'IMEI_RETIRADO',
          idEntrada: 'OUTRO_IMEI',
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);
      prisma.aparelho.findMany.mockResolvedValue([
        {
          identificador: 'IMEI_RETIRADO',
          marca: 'M_R',
          modelo: 'MOD_R',
          simVinculado: null,
        },
        {
          identificador: 'OUTRO_IMEI',
          marca: 'M_X',
          modelo: 'MOD_X',
          simVinculado: null,
        },
      ]);

      const result = await service.findPendentes({});

      expect(result.data[0]).toMatchObject({
        aparelhoEntrada: null,
        aparelhoSaida: expect.objectContaining({ modelo: 'MOD_R' }),
      });
    });

    it('regressão: com período, AGUARDANDO e EM_CADASTRO compartilham o mesmo filtro criadoEm', async () => {
      const di = new Date('2026-04-01T00:00:00.000Z');
      const df = new Date('2026-05-01T00:00:00.000Z');
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findPendentes({ dataInicio: di, dataFim: df });

      const call = prisma.ordemServico.findMany.mock.calls[0][0];
      const andClause: unknown[] = call?.where?.AND ?? [];
      const datePart = andClause.find(
        (c: unknown) => typeof c === 'object' && c !== null && 'criadoEm' in c,
      ) as { criadoEm: { gte: Date; lt: Date } };
      expect(datePart.criadoEm.gte).toEqual(di);
      expect(datePart.criadoEm.lt).toEqual(df);
      const orPart = andClause.find(
        (c: unknown) => typeof c === 'object' && c !== null && 'OR' in c,
      ) as { OR: unknown[] };
      expect(orPart.OR).toEqual(
        expect.arrayContaining([
          { statusCadastro: StatusCadastro.AGUARDANDO },
          {
            statusCadastro: {
              in: [StatusCadastro.EM_CADASTRO, StatusCadastro.CONCLUIDO],
            },
          },
        ]),
      );
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
      prisma.ordemServico.update.mockResolvedValue({
        ...os,
        statusCadastro: StatusCadastro.EM_CADASTRO,
      });

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

      await expect(service.iniciarCadastro(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException quando OS não está em AGUARDANDO_CADASTRO', async () => {
      const os = {
        id: 1,
        status: StatusOS.EM_TESTES,
        statusCadastro: StatusCadastro.AGUARDANDO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(service.iniciarCadastro(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança BadRequestException quando statusCadastro não é AGUARDANDO', async () => {
      const os = {
        id: 1,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: StatusCadastro.EM_CADASTRO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(service.iniciarCadastro(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança BadRequestException quando statusCadastro é null', async () => {
      const os = {
        id: 1,
        status: StatusOS.AGUARDANDO_CADASTRO,
        statusCadastro: null,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      await expect(service.iniciarCadastro(1)).rejects.toThrow(
        BadRequestException,
      );
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
      const aparelho = {
        id: 20,
        identificador: '111222333444555',
        status: StatusAparelho.COM_TECNICO,
      };
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
    // Nova semântica: em REVISÃO, idAparelho é o antigo (a substituir, que
    // sai do veículo) e idEntrada é o novo (escolhido nos testes).
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
      identificador: '999888777666555',
      tipo: TipoAparelho.RASTREADOR,
      status: StatusAparelho.INSTALADO,
    };

    const aparelhoNovo = {
      id: 60,
      identificador: '123456789012345',
      tipo: TipoAparelho.RASTREADOR,
      status: StatusAparelho.COM_TECNICO,
    };

    it('desvincula aparelho antigo: status=EM_ESTOQUE, subclienteId=null, veiculoId=null, observacao="aparelho usado"', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo) // busca pelo idAparelho (antigo)
        .mockResolvedValueOnce(aparelhoNovo); // busca pelo idEntrada (novo)
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

    it('busca aparelho antigo pelo idAparelho e aparelho novo pelo idEntrada', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(aparelhoAntigo)
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: osRevisao.idAparelho },
        }),
      );
      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: osRevisao.idEntrada },
        }),
      );
    });

    it('lança BadRequestException quando REVISAO não tem idEntrada (IMEI novo dos testes)', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue({
        ...osRevisao,
        idEntrada: null,
      });
      prisma.aparelho.findFirst.mockResolvedValueOnce(aparelhoAntigo);

      await expect(
        service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('quando aparelho antigo não existe no sistema, cria novo Aparelho com IMEI, ICCID e observacao="aparelho usado"', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null) // aparelho antigo não encontrado
        .mockResolvedValueOnce(aparelhoNovo);
      prisma.aparelho.create.mockResolvedValue({ id: 99 });
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(3, { plataforma: Plataforma.SELSYN }, 10);

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            identificador: osRevisao.idAparelho,
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
        expect(call[0].data).not.toMatchObject({
          status: StatusAparelho.EM_ESTOQUE,
        });
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

    // Regressão: após a etapa EM_TESTES → TESTES_REALIZADOS, o aparelho antigo
    // pode já estar COM_TECNICO (desvinculado do veículo). A conclusão deve
    // continuar movendo-o para EM_ESTOQUE normalmente.
    it('mesmo com aparelho antigo já COM_TECNICO (desvinculado nos testes), conclusão leva para EM_ESTOQUE', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRevisao);
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          ...aparelhoAntigo,
          status: StatusAparelho.COM_TECNICO,
          veiculoId: null,
          subclienteId: null,
        })
        .mockResolvedValueOnce(aparelhoNovo);
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
  });

  // ─── concluirCadastro — RETIRADA ────────────────────────────────────────────

  describe('concluirCadastro — RETIRADA', () => {
    const osRetirada = {
      id: 4,
      numero: 103,
      tipo: TipoOS.RETIRADA,
      status: StatusOS.AGUARDANDO_CADASTRO,
      statusCadastro: StatusCadastro.EM_CADASTRO,
      idAparelho: '555444333222111',
      idEntrada: null,
      iccidAparelho: '8955010000005555',
      iccidEntrada: null,
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

    it('regressão RETIRADA: busca rastreador pelo idAparelho da OS (não por idEntrada)', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue(aparelhoRetirado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith({
        where: { identificador: osRetirada.idAparelho },
      });
    });

    it('regressão RETIRADA: com idAparelho e idEntrada preenchidos, prioriza idAparelho na busca', async () => {
      const osAmbos = {
        ...osRetirada,
        idAparelho: 'IMEI_PRIORITARIO',
        idEntrada: 'IMEI_IGNORADO',
      };
      const apPrioritario = {
        id: 81,
        identificador: 'IMEI_PRIORITARIO',
        tipo: TipoAparelho.RASTREADOR,
        status: StatusAparelho.INSTALADO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(osAmbos);
      prisma.aparelho.findFirst.mockResolvedValue(apPrioritario);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith({
        where: { identificador: 'IMEI_PRIORITARIO' },
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: apPrioritario.id },
          data: expect.objectContaining({ status: StatusAparelho.EM_ESTOQUE }),
        }),
      );
    });

    it('regressão RETIRADA: trim em idAparelho antes de buscar no cadastro de aparelhos', async () => {
      const osEspacos = {
        ...osRetirada,
        idAparelho: '  555444333222111  ',
      };
      prisma.ordemServico.findUnique.mockResolvedValue(osEspacos);
      prisma.aparelho.findFirst.mockResolvedValue(aparelhoRetirado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith({
        where: { identificador: '555444333222111' },
      });
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
            identificador: osRetirada.idAparelho,
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

    it('fallback legado: com idAparelho vazio usa idEntrada para localizar o rastreador', async () => {
      const osLegado = {
        ...osRetirada,
        idAparelho: null,
        idEntrada: 'LEGACY_IMEI_999',
      };
      const apLegado = {
        id: 71,
        identificador: 'LEGACY_IMEI_999',
        tipo: TipoAparelho.RASTREADOR,
        status: StatusAparelho.INSTALADO,
      };
      prisma.ordemServico.findUnique.mockResolvedValue(osLegado);
      prisma.aparelho.findFirst.mockResolvedValue(apLegado);
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.concluirCadastro(4, { plataforma: Plataforma.GETRAK }, 10);

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith({
        where: { identificador: 'LEGACY_IMEI_999' },
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: apLegado.id },
          data: expect.objectContaining({ status: StatusAparelho.EM_ESTOQUE }),
        }),
      );
    });

    it('mesmo com aparelho (idAparelho) já COM_TECNICO, conclusão leva para EM_ESTOQUE', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(osRetirada);
      prisma.aparelho.findFirst.mockResolvedValue({
        ...aparelhoRetirado,
        status: StatusAparelho.COM_TECNICO,
        veiculoId: null,
        subclienteId: null,
      });
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
  });
});
