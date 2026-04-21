import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PareamentoService } from 'src/aparelhos/pareamento.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { createPrismaMock } from '../helpers/prisma-mock';

const debitosMock = { consolidarDebitoTx: jest.fn() };

describe('PareamentoService (CSV)', () => {
  let service: PareamentoService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PareamentoService,
        { provide: PrismaService, useValue: prisma },
        { provide: DebitosRastreadoresService, useValue: debitosMock },
      ],
    }).compile();

    service = module.get<PareamentoService>(PareamentoService);
    jest.clearAllMocks();
  });

  describe('pareamentoCsvPreview', () => {
    it('retorna contadores zerados quando linhas vazio', async () => {
      const result = await service.pareamentoCsvPreview({ linhas: [] });

      expect(result.linhas).toHaveLength(0);
      expect(result.contadores).toEqual({ validos: 0, comAviso: 0, erros: 0 });
    });

    it('marca VINCULAR_EXISTENTE quando rastreador e SIM existem livres', async () => {
      const rastreador = {
        id: 1,
        simVinculadoId: null,
        marca: 'Suntech',
        modelo: 'ST-901',
      };
      const sim = {
        id: 2,
        aparelhosVinculados: [],
        operadora: 'Claro',
        marcaSimcardId: 10,
      };
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(rastreador)
        .mockResolvedValueOnce(sim);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
          },
        ],
      });

      expect(result.linhas[0]).toMatchObject({
        imei: '123456789012345',
        iccid: '89550012340000000001',
        tracker_status: 'FOUND_AVAILABLE',
        sim_status: 'FOUND_AVAILABLE',
        tracker_acao: 'VINCULAR_EXISTENTE',
        sim_acao: 'VINCULAR_EXISTENTE',
        erros: [],
      });
      expect(result.contadores.validos).toBe(1);
      expect(result.contadores.erros).toBe(0);
    });

    it('marca CRIAR_VIA_LOTE quando rastreador não existe e lote_rastreador é ID válido', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });
      prisma.loteAparelho.findFirst.mockResolvedValueOnce({
        id: 100,
        tipo: 'RASTREADOR',
        referencia: 'LOTE-A',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteRastreador: '100',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('CRIAR_VIA_LOTE');
      expect(result.linhas[0].loteRastreadorId).toBe(100);
      expect(result.linhas[0].erros).toEqual([]);
      expect(prisma.loteAparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 100, tipo: 'RASTREADOR' } }),
      );
    });

    it('resolve lote_rastreador por referência (nome) quando não numérico', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });
      prisma.loteAparelho.findFirst.mockResolvedValueOnce({
        id: 77,
        tipo: 'RASTREADOR',
        referencia: 'LOTE-RAST-001',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteRastreador: 'LOTE-RAST-001',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('CRIAR_VIA_LOTE');
      expect(result.linhas[0].loteRastreadorId).toBe(77);
      expect(prisma.loteAparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { referencia: 'LOTE-RAST-001', tipo: 'RASTREADOR' },
        }),
      );
    });

    it('marca erro LOTE_RASTREADOR_NAO_ENCONTRADO quando referência inválida', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });
      prisma.loteAparelho.findFirst.mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteRastreador: 'INEXISTENTE',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('LOTE_RASTREADOR_NAO_ENCONTRADO');
      expect(result.contadores.erros).toBe(1);
    });

    it('marca CRIAR_MANUAL quando rastreador não existe e marca/modelo informados', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaRastreador: 'Suntech',
            modeloRastreador: 'ST-901',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('CRIAR_MANUAL');
      expect(result.linhas[0].marcaRastreador).toBe('Suntech');
      expect(result.linhas[0].modeloRastreador).toBe('ST-901');
      expect(result.linhas[0].erros).toEqual([]);
    });

    it('marca erro FALTA_DADOS_RASTREADOR quando não existe e sem lote nem marca/modelo', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('FALTA_DADOS_RASTREADOR');
    });

    it('marca erro FALTA_DADOS_RASTREADOR quando só marca (sem modelo) e sem lote', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaRastreador: 'Suntech',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('FALTA_DADOS_RASTREADOR');
    });

    it('marca erro IMEI_JA_VINCULADO quando rastreador já pareado', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: 2,
          marca: 'Suntech',
          modelo: 'ST-901',
        })
        .mockResolvedValueOnce({ id: 9, aparelhosVinculados: [] });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('IMEI_JA_VINCULADO');
    });

    it('marca erro IMEI_INVALIDO quando IMEI vazio', async () => {
      const result = await service.pareamentoCsvPreview({
        linhas: [{ imei: '', iccid: '89550012340000000001' }],
      });

      expect(result.linhas[0].tracker_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('IMEI_INVALIDO');
    });

    it('resolve SIM via lote_simcard por ID numérico', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.loteAparelho.findFirst.mockResolvedValueOnce({
        id: 200,
        tipo: 'SIM',
        referencia: 'LOTE-SIM',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteSimcard: '200',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('CRIAR_VIA_LOTE');
      expect(result.linhas[0].loteSimId).toBe(200);
    });

    it('resolve SIM CRIAR_MANUAL via operadora (string livre)', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            operadora: 'Claro',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('CRIAR_MANUAL');
      expect(result.linhas[0].operadora).toBe('Claro');
    });

    it('resolve SIM CRIAR_MANUAL via marca_simcard (nome) e plano (nome)', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce({
        id: 55,
        nome: 'Claro SIMCard',
      });
      prisma.planoSimcard.findFirst.mockResolvedValueOnce({
        id: 77,
        planoMb: 10,
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: 'Claro SIMCard',
            plano: '10MB',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('CRIAR_MANUAL');
      expect(result.linhas[0].marcaSimcardId).toBe(55);
      expect(result.linhas[0].planoSimcardId).toBe(77);
      expect(prisma.marcaSimcard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { nome: 'Claro SIMCard' } }),
      );
      expect(prisma.planoSimcard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { planoMb: 10, marcaSimcardId: 55 },
        }),
      );
    });

    it('marca MARCA_SIMCARD_NAO_ENCONTRADA quando nome não bate', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: 'Inexistente',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('MARCA_SIMCARD_NAO_ENCONTRADA');
    });

    it('marca FALTA_DADOS_SIM quando SIM não existe e sem lote nem operadora/marca', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('FALTA_DADOS_SIM');
    });

    it('marca ICCID_INVALIDO quando ICCID vazio', async () => {
      const result = await service.pareamentoCsvPreview({
        linhas: [{ imei: '123456789012345', iccid: '' }],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('ICCID_INVALIDO');
    });

    it('marca erro ICCID_JA_VINCULADO quando SIM já pareado', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce({
          id: 9,
          aparelhosVinculados: [{ id: 99 }],
        });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          { imei: '123456789012345', iccid: '89550012340000000001' },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('ICCID_JA_VINCULADO');
    });

    it('marca erro LOTE_SIMCARD_NAO_ENCONTRADO quando lote de SIM inexistente', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.loteAparelho.findFirst.mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteSimcard: 'LOTE-INEXISTENTE',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('LOTE_SIMCARD_NAO_ENCONTRADO');
    });

    it('marca PLANO_SIMCARD_NAO_ENCONTRADO quando valor do plano não contém dígitos válidos', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce({
        id: 55,
        nome: 'Claro SIMCard',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: 'Claro SIMCard',
            plano: 'plano-sem-numero',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].erros).toContain('PLANO_SIMCARD_NAO_ENCONTRADO');
      expect(prisma.planoSimcard.findFirst).not.toHaveBeenCalled();
    });

    it('plano puramente numérico é interpretado como ID (não como MB)', async () => {
      // Documenta o comportamento atual: "10" → busca por id=10.
      // Para buscar por MB, o usuário deve incluir sufixo não-numérico (ex: "10MB").
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce({
        id: 55,
        nome: 'Claro SIMCard',
      });
      prisma.planoSimcard.findFirst.mockResolvedValueOnce({
        id: 10,
        planoMb: 10,
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: 'Claro SIMCard',
            plano: '10',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('CRIAR_MANUAL');
      expect(result.linhas[0].planoSimcardId).toBe(10);
      expect(prisma.planoSimcard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 10 } }),
      );
    });

    it('resolve plano por ID numérico (string) sem filtrar por marcaSimcard', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.planoSimcard.findFirst.mockResolvedValueOnce({
        id: 123,
        planoMb: 20,
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            plano: '123',
            operadora: 'Claro',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('CRIAR_MANUAL');
      expect(result.linhas[0].planoSimcardId).toBe(123);
      expect(prisma.planoSimcard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 123 } }),
      );
    });

    it('resolve marca_simcard por ID numérico (string)', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce({
        id: 55,
        nome: 'Claro SIMCard',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: '55',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('CRIAR_MANUAL');
      expect(result.linhas[0].marcaSimcardId).toBe(55);
      expect(prisma.marcaSimcard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 55 } }),
      );
    });

    it('aceita espaços em branco nas referências (trim)', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });
      prisma.loteAparelho.findFirst.mockResolvedValueOnce({
        id: 99,
        tipo: 'RASTREADOR',
        referencia: 'LOTE-TRIM',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteRastreador: '  LOTE-TRIM  ',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('CRIAR_VIA_LOTE');
      expect(result.linhas[0].loteRastreadorId).toBe(99);
    });

    it('se plano falha, sim_acao vira ERRO mas marcaSimcardId resolvido aparece no retorno', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce(null);
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce({
        id: 55,
        nome: 'Claro SIMCard',
      });
      prisma.planoSimcard.findFirst.mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: 'Claro SIMCard',
            plano: '10MB',
          },
        ],
      });

      expect(result.linhas[0].sim_acao).toBe('ERRO');
      expect(result.linhas[0].marcaSimcardId).toBe(55);
      expect(result.linhas[0].planoSimcardId).toBeUndefined();
      expect(result.linhas[0].erros).toContain('PLANO_SIMCARD_NAO_ENCONTRADO');
    });

    it('preview prioriza lote sobre marca/modelo manual para rastreador', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 5, aparelhosVinculados: [] });
      prisma.loteAparelho.findFirst.mockResolvedValueOnce({
        id: 42,
        tipo: 'RASTREADOR',
        referencia: 'LOTE-A',
      });

      const result = await service.pareamentoCsvPreview({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteRastreador: 'LOTE-A',
            marcaRastreador: 'Suntech',
            modeloRastreador: 'ST-901',
          },
        ],
      });

      expect(result.linhas[0].tracker_acao).toBe('CRIAR_VIA_LOTE');
      expect(result.linhas[0].loteRastreadorId).toBe(42);
    });

    it('conta múltiplas linhas corretamente', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 1,
          simVinculadoId: null,
          marca: 'X',
          modelo: 'Y',
        })
        .mockResolvedValueOnce({ id: 2, aparelhosVinculados: [] })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.pareamentoCsvPreview({
        linhas: [
          { imei: '111', iccid: '222' },
          { imei: '333', iccid: '444' },
        ],
      });

      expect(result.linhas).toHaveLength(2);
      expect(result.contadores.validos).toBe(1);
      expect(result.contadores.erros).toBe(1);
    });
  });

  describe('helpers internos (parseIdOuString / resolve*)', () => {
    type ServiceInternals = {
      parseIdOuString: (ref: string) => { id?: number; texto: string };
      resolveLoteCsv: (
        ref: string | undefined,
        tipo: 'RASTREADOR' | 'SIM',
      ) => Promise<{ id?: number; referencia?: string; erro?: string }>;
      resolveMarcaSimcardCsv: (
        ref: string | undefined,
      ) => Promise<{ id?: number; erro?: string }>;
      resolvePlanoSimcardCsv: (
        ref: string | undefined,
        marcaSimcardId?: number,
      ) => Promise<{ id?: number; erro?: string }>;
    };

    const asInternals = () => service as unknown as ServiceInternals;

    it('parseIdOuString: string totalmente numérica retorna id numérico', () => {
      expect(asInternals().parseIdOuString('42')).toEqual({
        id: 42,
        texto: '42',
      });
    });

    it('parseIdOuString: string não-numérica retorna apenas texto', () => {
      expect(asInternals().parseIdOuString('LOTE-A')).toEqual({
        texto: 'LOTE-A',
      });
    });

    it('parseIdOuString: trim do texto antes de avaliar', () => {
      expect(asInternals().parseIdOuString('  99  ')).toEqual({
        id: 99,
        texto: '99',
      });
    });

    it('resolveLoteCsv: ref vazia retorna objeto vazio sem consultar DB', async () => {
      const r = await asInternals().resolveLoteCsv(undefined, 'RASTREADOR');
      expect(r).toEqual({});
      expect(prisma.loteAparelho.findFirst).not.toHaveBeenCalled();
    });

    it('resolveLoteCsv: SIM não encontrado retorna LOTE_SIMCARD_NAO_ENCONTRADO', async () => {
      prisma.loteAparelho.findFirst.mockResolvedValueOnce(null);
      const r = await asInternals().resolveLoteCsv('XYZ', 'SIM');
      expect(r).toEqual({ erro: 'LOTE_SIMCARD_NAO_ENCONTRADO' });
    });

    it('resolveLoteCsv: rastreador encontrado retorna id e referencia', async () => {
      prisma.loteAparelho.findFirst.mockResolvedValueOnce({
        id: 11,
        referencia: 'LOT-R',
      });
      const r = await asInternals().resolveLoteCsv('LOT-R', 'RASTREADOR');
      expect(r).toEqual({ id: 11, referencia: 'LOT-R' });
    });

    it('resolveMarcaSimcardCsv: ref vazia retorna objeto vazio', async () => {
      expect(await asInternals().resolveMarcaSimcardCsv('')).toEqual({});
      expect(await asInternals().resolveMarcaSimcardCsv('   ')).toEqual({});
    });

    it('resolveMarcaSimcardCsv: não encontrada retorna erro', async () => {
      prisma.marcaSimcard.findFirst.mockResolvedValueOnce(null);
      const r = await asInternals().resolveMarcaSimcardCsv('XYZ');
      expect(r).toEqual({ erro: 'MARCA_SIMCARD_NAO_ENCONTRADA' });
    });

    it('resolvePlanoSimcardCsv: ref vazia retorna objeto vazio', async () => {
      expect(await asInternals().resolvePlanoSimcardCsv('')).toEqual({});
      expect(await asInternals().resolvePlanoSimcardCsv(undefined)).toEqual({});
    });

    it('resolvePlanoSimcardCsv: texto sem dígitos retorna erro sem consultar DB', async () => {
      const r = await asInternals().resolvePlanoSimcardCsv('sem-digitos');
      expect(r).toEqual({ erro: 'PLANO_SIMCARD_NAO_ENCONTRADO' });
      expect(prisma.planoSimcard.findFirst).not.toHaveBeenCalled();
    });

    it('resolvePlanoSimcardCsv: aceita "10 MB" (com espaço)', async () => {
      prisma.planoSimcard.findFirst.mockResolvedValueOnce({
        id: 5,
        planoMb: 10,
      });
      const r = await asInternals().resolvePlanoSimcardCsv('10 MB', 7);
      expect(r).toEqual({ id: 5 });
      expect(prisma.planoSimcard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { planoMb: 10, marcaSimcardId: 7 },
        }),
      );
    });

    it('resolvePlanoSimcardCsv: zero invalido quando dígitos somam 0', async () => {
      const r = await asInternals().resolvePlanoSimcardCsv('MB-0');
      expect(r).toEqual({ erro: 'PLANO_SIMCARD_NAO_ENCONTRADO' });
    });
  });

  describe('pareamentoCsv', () => {
    it('lança BadRequestException quando nenhuma linha informada', async () => {
      await expect(service.pareamentoCsv({ linhas: [] })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.pareamentoCsv({ linhas: [] })).rejects.toThrow(
        'Nenhuma linha informada',
      );
    });

    it('lança BadRequestException quando alguma linha tem erro no preview', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '111',
            iccid: '222',
            tracker_status: 'NEEDS_CREATE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'ERRO',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: ['FALTA_DADOS_RASTREADOR'],
          },
        ],
        contadores: { validos: 0, comAviso: 0, erros: 1 },
      } as any);

      await expect(
        service.pareamentoCsv({
          linhas: [{ imei: '111', iccid: '222' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('executa em transação e retorna criados quando linhas válidas', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValue({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamentoCsv({
        linhas: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('criados');
      expect(result.criados).toBe(1);
    });

    it('cria rastreador via lote quando tracker_acao=CRIAR_VIA_LOTE', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'NEEDS_CREATE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'CRIAR_VIA_LOTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            loteRastreadorId: 100,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 50,
        proprietario: 'INFINITY',
        clienteId: null,
        marca: 'Suntech',
        modelo: 'ST-901',
        lote: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamentoCsv({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteRastreador: '100',
          },
        ],
      });

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loteId: 100,
            tipo: 'RASTREADOR',
            identificador: null,
          }),
        }),
      );
      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 50 },
          data: expect.objectContaining({ identificador: '123456789012345' }),
        }),
      );
      expect(result.criados).toBe(1);
    });

    it('cria rastreador manual quando tracker_acao=CRIAR_MANUAL', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'NEEDS_CREATE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'CRIAR_MANUAL',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            marcaRastreador: 'Suntech',
            modeloRastreador: 'ST-901',
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.create.mockResolvedValueOnce({ id: 99 });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamentoCsv({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaRastreador: 'Suntech',
            modeloRastreador: 'ST-901',
          },
        ],
      });

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'RASTREADOR',
            identificador: '123456789012345',
            marca: 'Suntech',
            modelo: 'ST-901',
          }),
        }),
      );
      expect(result.criados).toBe(1);
    });

    it('cria SIM manual quando sim_acao=CRIAR_MANUAL (via marcaSimcardId resolvido)', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'NEEDS_CREATE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'CRIAR_MANUAL',
            erros: [],
            trackerId: 1,
            marcaSimcardId: 55,
            planoSimcardId: 77,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.marcaSimcard.findUnique.mockResolvedValueOnce({
        id: 55,
        operadora: { nome: 'Claro' },
      });
      prisma.aparelho.create.mockResolvedValueOnce({ id: 88 });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.pareamentoCsv({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            marcaSimcard: 'Claro SIMCard',
          },
        ],
      });

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'SIM',
            identificador: '89550012340000000001',
            marcaSimcardId: 55,
            planoSimcardId: 77,
            operadora: 'Claro',
          }),
        }),
      );
    });

    it('lança BadRequestException quando lote de rastreador sem saldo disponível', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'NEEDS_CREATE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'CRIAR_VIA_LOTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            loteRastreadorId: 100,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.pareamentoCsv({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              loteRastreador: '100',
            },
          ],
        }),
      ).rejects.toThrow(/sem saldo disponível/i);
    });

    it('cria SIM via lote quando sim_acao=CRIAR_VIA_LOTE', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'NEEDS_CREATE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'CRIAR_VIA_LOTE',
            erros: [],
            trackerId: 1,
            loteSimId: 200,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 70,
        proprietario: 'INFINITY',
        clienteId: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamentoCsv({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            loteSimcard: '200',
          },
        ],
      });

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loteId: 200,
            tipo: 'SIM',
            identificador: null,
          }),
        }),
      );
      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 70 },
          data: expect.objectContaining({ identificador: '89550012340000000001' }),
        }),
      );
      expect(result.criados).toBe(1);
    });

    it('lança BadRequestException quando lote de SIM sem saldo disponível', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'NEEDS_CREATE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'CRIAR_VIA_LOTE',
            erros: [],
            trackerId: 1,
            loteSimId: 200,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.pareamentoCsv({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              loteSimcard: '200',
            },
          ],
        }),
      ).rejects.toThrow(/sem saldo disponível/i);
    });

    it('cria SIM manual apenas com operadora (sem marcaSimcardId)', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'NEEDS_CREATE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'CRIAR_MANUAL',
            erros: [],
            trackerId: 1,
            operadora: 'Vivo',
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.create.mockResolvedValueOnce({ id: 88 });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.pareamentoCsv({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            operadora: 'Vivo',
          },
        ],
      });

      expect(prisma.marcaSimcard.findUnique).not.toHaveBeenCalled();
      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'SIM',
            operadora: 'Vivo',
            marcaSimcardId: null,
            planoSimcardId: null,
          }),
        }),
      );
    });

    it('lança BadRequestException quando marcaSimcardId não existe na transação', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'NEEDS_CREATE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'CRIAR_MANUAL',
            erros: [],
            trackerId: 1,
            marcaSimcardId: 999,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.marcaSimcard.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.pareamentoCsv({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              marcaSimcard: '999',
            },
          ],
        }),
      ).rejects.toThrow(/marca de simcard não encontrada/i);
    });

    it('aplica tecnicoId global ao rastreador', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.pareamentoCsv({
        linhas: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
        tecnicoId: 77,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ tecnicoId: 77 }),
        }),
      );
    });

    it('consolida débito quando proprietário do rastreador muda', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: 'Suntech',
        modelo: 'ST-901',
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 10 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({ id: 20 });

      await service.pareamentoCsv({
        linhas: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
        proprietario: 'CLIENTE',
        clienteId: 42,
      });

      expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          devedorTipo: 'CLIENTE',
          devedorClienteId: 42,
          credorTipo: 'INFINITY',
          credorClienteId: null,
          marcaId: 10,
          modeloId: 20,
          delta: 1,
          aparelhoId: 1,
        }),
      );
    });

    it('não consolida débito quando proprietário não muda', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: 'Suntech',
        modelo: 'ST-901',
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.pareamentoCsv({
        linhas: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
      });

      expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
    });

    it('cria histórico com observação específica para CSV', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.pareamentoCsv({
        linhas: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
      });

      expect(prisma.aparelhoHistorico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            aparelhoId: 1,
            statusAnterior: 'EM_ESTOQUE',
            statusNovo: 'CONFIGURADO',
            observacao: expect.stringContaining('Pareamento CSV'),
          }),
        }),
      );
    });

    it('processa múltiplas linhas válidas e retorna criados=N', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '111',
            iccid: '222',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
          {
            imei: '333',
            iccid: '444',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 3,
            simId: 4,
          },
        ],
        contadores: { validos: 2, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValue({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamentoCsv({
        linhas: [
          { imei: '111', iccid: '222' },
          { imei: '333', iccid: '444' },
        ],
      });

      expect(result.criados).toBe(2);
      expect(result.equipamentos).toHaveLength(2);
    });

    it('aplica proprietário e cliente globais ao rastreador', async () => {
      jest.spyOn(service, 'pareamentoCsvPreview').mockResolvedValue({
        linhas: [
          {
            imei: '123456789012345',
            iccid: '89550012340000000001',
            tracker_status: 'FOUND_AVAILABLE',
            sim_status: 'FOUND_AVAILABLE',
            tracker_acao: 'VINCULAR_EXISTENTE',
            sim_acao: 'VINCULAR_EXISTENTE',
            erros: [],
            trackerId: 1,
            simId: 2,
          },
        ],
        contadores: { validos: 1, comAviso: 0, erros: 0 },
      } as any);
      prisma.aparelho.findUnique.mockResolvedValueOnce({
        proprietario: 'INFINITY',
        clienteId: null,
        marca: null,
        modelo: null,
      });
      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.pareamentoCsv({
        linhas: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
        proprietario: 'CLIENTE',
        clienteId: 42,
      });

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            proprietario: 'CLIENTE',
            clienteId: 42,
            status: 'CONFIGURADO',
            simVinculadoId: 2,
          }),
        }),
      );
    });
  });
});
