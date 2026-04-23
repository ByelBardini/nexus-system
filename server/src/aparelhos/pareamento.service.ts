import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebitosRastreadoresService } from '../debitos-rastreadores/debitos-rastreadores.service';
import { Prisma, ProprietarioTipo } from '@prisma/client';

type PlanoRastreadorPareamentoTx =
  | { kind: 'EXISTENTE'; trackerId: number }
  | { kind: 'LOTE'; loteId: number }
  | { kind: 'MANUAL'; marca: string; modelo: string }
  | { kind: 'PULAR' };

type PlanoSimPareamentoTx =
  | { kind: 'EXISTENTE'; simId: number }
  | { kind: 'LOTE'; loteId: number }
  | {
      kind: 'MANUAL';
      operadora?: string | null;
      marcaSimcardId?: number | null;
      planoSimcardId?: number | null;
    }
  | { kind: 'PULAR' };

type CtxPareamentoLinhaTx = {
  imei: string;
  iccid: string;
  proprietarioFinal: ProprietarioTipo;
  clienteId: number | null;
  tecnicoId: number | undefined;
  historicoObservacao: string;
};

export type TrackerCsvAcao =
  | 'VINCULAR_EXISTENTE'
  | 'CRIAR_VIA_LOTE'
  | 'CRIAR_MANUAL'
  | 'ERRO';
export type SimCsvAcao = TrackerCsvAcao;

export interface PareamentoCsvLinha {
  imei: string;
  iccid: string;
  marcaRastreador?: string;
  modeloRastreador?: string;
  marcaSimcard?: string;
  operadora?: string;
  plano?: string;
  loteRastreador?: string;
  loteSimcard?: string;
}

export interface PareamentoCsvInput {
  linhas: PareamentoCsvLinha[];
  proprietario?: 'INFINITY' | 'CLIENTE';
  clienteId?: number;
  tecnicoId?: number;
}

export interface PareamentoCsvPreviewLinha {
  imei: string;
  iccid: string;
  tracker_status:
    | 'FOUND_AVAILABLE'
    | 'FOUND_ALREADY_LINKED'
    | 'NEEDS_CREATE'
    | 'INVALID_FORMAT';
  sim_status:
    | 'FOUND_AVAILABLE'
    | 'FOUND_ALREADY_LINKED'
    | 'NEEDS_CREATE'
    | 'INVALID_FORMAT';
  tracker_acao: TrackerCsvAcao;
  sim_acao: SimCsvAcao;
  erros: string[];
  trackerId?: number;
  simId?: number;
  marcaRastreador?: string;
  modeloRastreador?: string;
  operadora?: string;
  marcaSimcardId?: number;
  planoSimcardId?: number;
  loteRastreadorId?: number;
  loteSimId?: number;
  loteRastreadorReferencia?: string;
  loteSimReferencia?: string;
}

@Injectable()
export class PareamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly debitosService: DebitosRastreadoresService,
  ) {}

  private mapearPlanoPareamentoSimples(
    linha: {
      tracker_status:
        | 'FOUND_AVAILABLE'
        | 'FOUND_ALREADY_LINKED'
        | 'NEEDS_CREATE'
        | 'INVALID_FORMAT';
      sim_status:
        | 'FOUND_AVAILABLE'
        | 'FOUND_ALREADY_LINKED'
        | 'NEEDS_CREATE'
        | 'INVALID_FORMAT';
      trackerId?: number;
      simId?: number;
    },
    loteRastreadorId: number | undefined,
    loteSimId: number | undefined,
    rastreadorManual: { marca: string; modelo: string } | undefined,
    simManual:
      | {
          operadora?: string;
          marcaSimcardId?: number;
          planoSimcardId?: number;
        }
      | undefined,
  ): {
    planoRastreador: PlanoRastreadorPareamentoTx;
    planoSim: PlanoSimPareamentoTx;
  } {
    let planoRastreador: PlanoRastreadorPareamentoTx = { kind: 'PULAR' };
    if (linha.tracker_status === 'FOUND_AVAILABLE' && linha.trackerId) {
      planoRastreador = { kind: 'EXISTENTE', trackerId: linha.trackerId };
    } else if (linha.tracker_status === 'NEEDS_CREATE' && loteRastreadorId) {
      planoRastreador = { kind: 'LOTE', loteId: loteRastreadorId };
    } else if (
      linha.tracker_status === 'NEEDS_CREATE' &&
      rastreadorManual?.marca &&
      rastreadorManual?.modelo
    ) {
      planoRastreador = {
        kind: 'MANUAL',
        marca: rastreadorManual.marca,
        modelo: rastreadorManual.modelo,
      };
    }

    let planoSim: PlanoSimPareamentoTx = { kind: 'PULAR' };
    if (linha.sim_status === 'FOUND_AVAILABLE' && linha.simId) {
      planoSim = { kind: 'EXISTENTE', simId: linha.simId };
    } else if (linha.sim_status === 'NEEDS_CREATE' && loteSimId) {
      planoSim = { kind: 'LOTE', loteId: loteSimId };
    } else if (
      linha.sim_status === 'NEEDS_CREATE' &&
      (simManual?.operadora || simManual?.marcaSimcardId)
    ) {
      planoSim = {
        kind: 'MANUAL',
        operadora: simManual?.operadora,
        marcaSimcardId: simManual?.marcaSimcardId ?? null,
        planoSimcardId: simManual?.planoSimcardId ?? null,
      };
    }

    return { planoRastreador, planoSim };
  }

  private mapearPlanoPareamentoCsv(linha: PareamentoCsvPreviewLinha): {
    planoRastreador: PlanoRastreadorPareamentoTx;
    planoSim: PlanoSimPareamentoTx;
  } {
    let planoRastreador: PlanoRastreadorPareamentoTx = { kind: 'PULAR' };
    if (linha.tracker_acao === 'VINCULAR_EXISTENTE' && linha.trackerId) {
      planoRastreador = { kind: 'EXISTENTE', trackerId: linha.trackerId };
    } else if (
      linha.tracker_acao === 'CRIAR_VIA_LOTE' &&
      linha.loteRastreadorId
    ) {
      planoRastreador = { kind: 'LOTE', loteId: linha.loteRastreadorId };
    } else if (
      linha.tracker_acao === 'CRIAR_MANUAL' &&
      linha.marcaRastreador &&
      linha.modeloRastreador
    ) {
      planoRastreador = {
        kind: 'MANUAL',
        marca: linha.marcaRastreador,
        modelo: linha.modeloRastreador,
      };
    }

    let planoSim: PlanoSimPareamentoTx = { kind: 'PULAR' };
    if (linha.sim_acao === 'VINCULAR_EXISTENTE' && linha.simId) {
      planoSim = { kind: 'EXISTENTE', simId: linha.simId };
    } else if (linha.sim_acao === 'CRIAR_VIA_LOTE' && linha.loteSimId) {
      planoSim = { kind: 'LOTE', loteId: linha.loteSimId };
    } else if (linha.sim_acao === 'CRIAR_MANUAL') {
      planoSim = {
        kind: 'MANUAL',
        operadora: linha.operadora,
        marcaSimcardId: linha.marcaSimcardId ?? null,
        planoSimcardId: linha.planoSimcardId ?? null,
      };
    }

    return { planoRastreador, planoSim };
  }

  private async executarPareamentoLinhaTx(
    tx: Prisma.TransactionClient,
    ctx: CtxPareamentoLinhaTx,
    planoRastreador: PlanoRastreadorPareamentoTx,
    planoSim: PlanoSimPareamentoTx,
  ): Promise<{
    rastreadorId: number;
    simId: number;
    equipamentoId: number;
  } | null> {
    if (planoRastreador.kind === 'PULAR' || planoSim.kind === 'PULAR') {
      return null;
    }

    const { proprietarioFinal, clienteId, tecnicoId } = ctx;
    let rastreadorId: number;
    let simId: number;
    let rastreadorAnterior: {
      proprietario: ProprietarioTipo;
      clienteId: number | null;
      marca: string | null;
      modelo: string | null;
    } | null = null;

    if (planoRastreador.kind === 'EXISTENTE') {
      rastreadorId = planoRastreador.trackerId;
      rastreadorAnterior = await tx.aparelho.findUnique({
        where: { id: planoRastreador.trackerId },
        select: {
          proprietario: true,
          clienteId: true,
          marca: true,
          modelo: true,
        },
      });
    } else if (planoRastreador.kind === 'LOTE') {
      const aparelhoSemId = await tx.aparelho.findFirst({
        where: {
          loteId: planoRastreador.loteId,
          tipo: 'RASTREADOR',
          identificador: null,
          status: 'EM_ESTOQUE',
        },
        include: { lote: true },
      });
      if (!aparelhoSemId) {
        throw new BadRequestException(
          `Lote de rastreadores sem saldo disponível para IMEI ${ctx.imei}`,
        );
      }
      rastreadorAnterior = {
        proprietario: aparelhoSemId.proprietario,
        clienteId: aparelhoSemId.clienteId,
        marca: aparelhoSemId.marca ?? aparelhoSemId.lote?.marca ?? null,
        modelo: aparelhoSemId.modelo ?? aparelhoSemId.lote?.modelo ?? null,
      };
      const cleanImei = ctx.imei.replace(/\D/g, '');
      await tx.aparelho.update({
        where: { id: aparelhoSemId.id },
        data: {
          identificador: cleanImei,
          proprietario: proprietarioFinal,
          clienteId: clienteId ?? null,
          tecnicoId: tecnicoId ?? null,
        },
      });
      rastreadorId = aparelhoSemId.id;
    } else {
      const cleanImei = ctx.imei.replace(/\D/g, '');
      const novo = await tx.aparelho.create({
        data: {
          tipo: 'RASTREADOR',
          identificador: cleanImei,
          status: 'EM_ESTOQUE',
          proprietario: proprietarioFinal,
          clienteId: clienteId ?? null,
          tecnicoId: tecnicoId ?? null,
          marca: planoRastreador.marca,
          modelo: planoRastreador.modelo,
        },
      });
      rastreadorId = novo.id;
    }

    if (planoSim.kind === 'EXISTENTE') {
      simId = planoSim.simId;
    } else if (planoSim.kind === 'LOTE') {
      const aparelhoSemId = await tx.aparelho.findFirst({
        where: {
          loteId: planoSim.loteId,
          tipo: 'SIM',
          identificador: null,
          status: 'EM_ESTOQUE',
        },
      });
      if (!aparelhoSemId) {
        throw new BadRequestException(
          `Lote de SIMs sem saldo disponível para ICCID ${ctx.iccid}`,
        );
      }
      const cleanIccid = ctx.iccid.replace(/\D/g, '');
      await tx.aparelho.update({
        where: { id: aparelhoSemId.id },
        data: {
          identificador: cleanIccid,
          proprietario: 'INFINITY',
          clienteId: null,
        },
      });
      simId = aparelhoSemId.id;
    } else {
      const cleanIccid = ctx.iccid.replace(/\D/g, '');
      let operadoraNome = planoSim.operadora;
      if (planoSim.marcaSimcardId) {
        const marcaSim = await tx.marcaSimcard.findUnique({
          where: { id: planoSim.marcaSimcardId },
          include: { operadora: true },
        });
        if (!marcaSim)
          throw new BadRequestException('Marca de simcard não encontrada');
        operadoraNome = marcaSim.operadora.nome;
      }
      const novo = await tx.aparelho.create({
        data: {
          tipo: 'SIM',
          identificador: cleanIccid,
          status: 'EM_ESTOQUE',
          proprietario: 'INFINITY',
          clienteId: null,
          operadora: operadoraNome ?? null,
          marcaSimcardId: planoSim.marcaSimcardId ?? null,
          planoSimcardId: planoSim.planoSimcardId ?? null,
        },
      });
      simId = novo.id;
    }

    await tx.aparelho.update({
      where: { id: rastreadorId },
      data: {
        simVinculadoId: simId,
        status: 'CONFIGURADO',
        proprietario: proprietarioFinal,
        clienteId: clienteId ?? null,
        ...(tecnicoId !== undefined ? { tecnicoId } : {}),
      },
    });
    await tx.aparelho.update({
      where: { id: simId },
      data: {
        status: 'CONFIGURADO',
        proprietario: 'INFINITY',
        clienteId: null,
      },
    });

    if (rastreadorAnterior) {
      const proprietarioMudou =
        rastreadorAnterior.proprietario !== proprietarioFinal ||
        rastreadorAnterior.clienteId !== (clienteId ?? null);

      if (
        proprietarioMudou &&
        rastreadorAnterior.marca &&
        rastreadorAnterior.modelo
      ) {
        const marcaRec = await tx.marcaEquipamento.findFirst({
          where: { nome: rastreadorAnterior.marca },
        });
        const modeloRec = marcaRec
          ? await tx.modeloEquipamento.findFirst({
              where: {
                marcaId: marcaRec.id,
                nome: rastreadorAnterior.modelo,
              },
            })
          : null;

        if (marcaRec && modeloRec) {
          await this.debitosService.consolidarDebitoTx(tx, {
            devedorTipo: proprietarioFinal,
            devedorClienteId: clienteId ?? null,
            credorTipo: rastreadorAnterior.proprietario,
            credorClienteId: rastreadorAnterior.clienteId,
            marcaId: marcaRec.id,
            modeloId: modeloRec.id,
            delta: 1,
            aparelhoId: rastreadorId,
          });
        }
      }
    }

    await tx.aparelhoHistorico.create({
      data: {
        aparelhoId: rastreadorId,
        statusAnterior: 'EM_ESTOQUE',
        statusNovo: 'CONFIGURADO',
        observacao: ctx.historicoObservacao,
      },
    });

    return {
      rastreadorId,
      simId,
      equipamentoId: rastreadorId,
    };
  }

  /** Resolve rastreador por IMEI: FOUND_AVAILABLE | FOUND_ALREADY_LINKED | NEEDS_CREATE | INVALID_FORMAT */
  private async resolveRastreador(imei: string): Promise<{
    status:
      | 'FOUND_AVAILABLE'
      | 'FOUND_ALREADY_LINKED'
      | 'NEEDS_CREATE'
      | 'INVALID_FORMAT';
    trackerId?: number;
    marca?: string;
    modelo?: string;
  }> {
    const clean = imei.replace(/\D/g, '');
    if (clean.length < 1 || clean.length > 50) {
      return { status: 'INVALID_FORMAT' };
    }
    const rastreador = await this.prisma.aparelho.findFirst({
      where: { tipo: 'RASTREADOR', identificador: clean },
      include: { simVinculado: true },
    });
    if (!rastreador) return { status: 'NEEDS_CREATE' };
    if (rastreador.simVinculadoId) {
      return { status: 'FOUND_ALREADY_LINKED', trackerId: rastreador.id };
    }
    return {
      status: 'FOUND_AVAILABLE',
      trackerId: rastreador.id,
      marca: rastreador.marca ?? undefined,
      modelo: rastreador.modelo ?? undefined,
    };
  }

  /** Resolve SIM por ICCID: FOUND_AVAILABLE | FOUND_ALREADY_LINKED | NEEDS_CREATE | INVALID_FORMAT */
  private async resolveSim(iccid: string): Promise<{
    status:
      | 'FOUND_AVAILABLE'
      | 'FOUND_ALREADY_LINKED'
      | 'NEEDS_CREATE'
      | 'INVALID_FORMAT';
    simId?: number;
    operadora?: string;
    marcaSimcardId?: number;
    planoSimcardId?: number;
  }> {
    const clean = iccid.replace(/\D/g, '');
    if (clean.length < 1 || clean.length > 50) {
      return { status: 'INVALID_FORMAT' };
    }
    const sim = await this.prisma.aparelho.findFirst({
      where: { tipo: 'SIM', identificador: clean },
      include: { aparelhosVinculados: true },
    });
    if (!sim) return { status: 'NEEDS_CREATE' };
    const jaVinculado = sim.aparelhosVinculados?.length > 0;
    if (jaVinculado) {
      return { status: 'FOUND_ALREADY_LINKED', simId: sim.id };
    }
    return {
      status: 'FOUND_AVAILABLE',
      simId: sim.id,
      operadora: sim.operadora ?? undefined,
      marcaSimcardId: sim.marcaSimcardId ?? undefined,
      planoSimcardId: sim.planoSimcardId ?? undefined,
    };
  }

  /** Preview de pareamento: retorna status de cada par */
  async pareamentoPreview(pares: { imei: string; iccid: string }[]) {
    const resultados: Array<{
      imei: string;
      iccid: string;
      tracker_status:
        | 'FOUND_AVAILABLE'
        | 'FOUND_ALREADY_LINKED'
        | 'NEEDS_CREATE'
        | 'INVALID_FORMAT';
      sim_status:
        | 'FOUND_AVAILABLE'
        | 'FOUND_ALREADY_LINKED'
        | 'NEEDS_CREATE'
        | 'INVALID_FORMAT';
      action_needed:
        | 'OK'
        | 'SELECT_TRACKER_LOT'
        | 'SELECT_SIM_LOT'
        | 'FIX_ERROR';
      trackerId?: number;
      simId?: number;
      marca?: string;
      modelo?: string;
      operadora?: string;
    }> = [];

    for (const { imei, iccid } of pares) {
      const [trackerRes, simRes] = await Promise.all([
        this.resolveRastreador(imei),
        this.resolveSim(iccid),
      ]);

      let action_needed:
        | 'OK'
        | 'SELECT_TRACKER_LOT'
        | 'SELECT_SIM_LOT'
        | 'FIX_ERROR' = 'OK';
      if (
        trackerRes.status === 'INVALID_FORMAT' ||
        simRes.status === 'INVALID_FORMAT' ||
        trackerRes.status === 'FOUND_ALREADY_LINKED' ||
        simRes.status === 'FOUND_ALREADY_LINKED'
      ) {
        action_needed = 'FIX_ERROR';
      } else if (
        trackerRes.status === 'NEEDS_CREATE' &&
        simRes.status === 'NEEDS_CREATE'
      ) {
        action_needed = 'SELECT_TRACKER_LOT';
      } else if (trackerRes.status === 'NEEDS_CREATE') {
        action_needed = 'SELECT_TRACKER_LOT';
      } else if (simRes.status === 'NEEDS_CREATE') {
        action_needed = 'SELECT_SIM_LOT';
      }

      resultados.push({
        imei,
        iccid,
        tracker_status: trackerRes.status,
        sim_status: simRes.status,
        action_needed,
        trackerId: trackerRes.trackerId,
        simId: simRes.simId,
        marca: trackerRes.marca,
        modelo: trackerRes.modelo,
        operadora: simRes.operadora,
      });
    }

    const validos = resultados.filter((r) => r.action_needed === 'OK').length;
    const exigemLote = resultados.filter(
      (r) =>
        r.action_needed === 'SELECT_TRACKER_LOT' ||
        r.action_needed === 'SELECT_SIM_LOT',
    ).length;
    const erros = resultados.filter(
      (r) => r.action_needed === 'FIX_ERROR',
    ).length;

    return {
      linhas: resultados,
      contadores: { validos, exigemLote, erros },
    };
  }

  /** Executa pareamento: cria equipamentos (vincula rastreador + SIM) */
  async pareamento(dto: {
    pares: { imei: string; iccid: string }[];
    loteRastreadorId?: number;
    loteSimId?: number;
    rastreadorManual?: { marca: string; modelo: string };
    simManual?: {
      operadora?: string;
      marcaSimcardId?: number;
      planoSimcardId?: number;
    };
    proprietario?: 'INFINITY' | 'CLIENTE';
    clienteId?: number;
    tecnicoId?: number;
  }) {
    const {
      pares,
      loteRastreadorId,
      loteSimId,
      rastreadorManual,
      simManual,
      proprietario,
      clienteId,
      tecnicoId,
    } = dto;
    const proprietarioFinal = (proprietario ?? 'INFINITY') as ProprietarioTipo;
    if (!pares?.length) {
      throw new BadRequestException('Nenhum par informado');
    }

    const preview = await this.pareamentoPreview(pares);
    const linhasNeedTracker = preview.linhas.filter(
      (l) => l.tracker_status === 'NEEDS_CREATE',
    );
    const linhasNeedSim = preview.linhas.filter(
      (l) => l.sim_status === 'NEEDS_CREATE',
    );

    const temLoteTracker = !!loteRastreadorId;
    const temManualTracker = !!(
      rastreadorManual?.marca && rastreadorManual?.modelo
    );
    const temLoteSim = !!loteSimId;
    const temManualSim = !!simManual?.operadora || !!simManual?.marcaSimcardId;

    if (linhasNeedTracker.length > 0 && !temLoteTracker && !temManualTracker) {
      throw new BadRequestException(
        `${linhasNeedTracker.length} rastreador(es) não encontrado(s). Selecione um lote ou informe marca e modelo para criação manual.`,
      );
    }
    if (linhasNeedSim.length > 0 && !temLoteSim && !temManualSim) {
      throw new BadRequestException(
        `${linhasNeedSim.length} SIM(s) não encontrado(s). Selecione um lote ou informe a operadora para criação manual.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const criados: {
        rastreadorId: number;
        simId: number;
        equipamentoId: number;
      }[] = [];

      for (const linha of preview.linhas) {
        const { planoRastreador, planoSim } = this.mapearPlanoPareamentoSimples(
          linha,
          loteRastreadorId,
          loteSimId,
          rastreadorManual,
          simManual,
        );
        const feito = await this.executarPareamentoLinhaTx(
          tx,
          {
            imei: linha.imei,
            iccid: linha.iccid,
            proprietarioFinal,
            clienteId: clienteId ?? null,
            tecnicoId,
            historicoObservacao: `Pareamento com SIM ${linha.iccid}`,
          },
          planoRastreador,
          planoSim,
        );
        if (feito) criados.push(feito);
      }

      return { criados: criados.length, equipamentos: criados };
    });
  }

  // ============= CSV =============

  private parseIdOuString(ref: string): { id?: number; texto: string } {
    const texto = ref.trim();
    if (/^\d+$/.test(texto)) {
      return { id: parseInt(texto, 10), texto };
    }
    return { texto };
  }

  private async resolveLoteCsv(
    ref: string | undefined,
    tipo: 'RASTREADOR' | 'SIM',
  ): Promise<{ id?: number; referencia?: string; erro?: string }> {
    if (!ref?.trim()) return {};
    const parsed = this.parseIdOuString(ref);
    const lote = await this.prisma.loteAparelho.findFirst({
      where: parsed.id
        ? { id: parsed.id, tipo }
        : { referencia: parsed.texto, tipo },
    });
    if (!lote) {
      return {
        erro:
          tipo === 'RASTREADOR'
            ? 'LOTE_RASTREADOR_NAO_ENCONTRADO'
            : 'LOTE_SIMCARD_NAO_ENCONTRADO',
      };
    }
    return { id: lote.id, referencia: lote.referencia };
  }

  private async resolveMarcaSimcardCsv(
    ref: string | undefined,
  ): Promise<{ id?: number; erro?: string }> {
    if (!ref?.trim()) return {};
    const parsed = this.parseIdOuString(ref);
    const marca = await this.prisma.marcaSimcard.findFirst({
      where: parsed.id ? { id: parsed.id } : { nome: parsed.texto },
    });
    if (!marca) return { erro: 'MARCA_SIMCARD_NAO_ENCONTRADA' };
    return { id: marca.id };
  }

  private async resolvePlanoSimcardCsv(
    ref: string | undefined,
    marcaSimcardId?: number,
  ): Promise<{ id?: number; erro?: string }> {
    if (!ref?.trim()) return {};
    const texto = ref.trim();
    const where: Record<string, unknown> = {};
    if (/^\d+$/.test(texto)) {
      where.id = parseInt(texto, 10);
    } else {
      const mb = parseInt(texto.replace(/\D/g, ''), 10);
      if (!Number.isFinite(mb) || mb <= 0) {
        return { erro: 'PLANO_SIMCARD_NAO_ENCONTRADO' };
      }
      where.planoMb = mb;
      if (marcaSimcardId) where.marcaSimcardId = marcaSimcardId;
    }
    const plano = await this.prisma.planoSimcard.findFirst({ where });
    if (!plano) return { erro: 'PLANO_SIMCARD_NAO_ENCONTRADO' };
    return { id: plano.id };
  }

  async pareamentoCsvPreview(input: PareamentoCsvInput): Promise<{
    linhas: PareamentoCsvPreviewLinha[];
    contadores: { validos: number; comAviso: number; erros: number };
  }> {
    const linhas: PareamentoCsvPreviewLinha[] = [];

    for (const raw of input.linhas ?? []) {
      const imei = (raw.imei ?? '').trim();
      const iccid = (raw.iccid ?? '').trim();
      const erros: string[] = [];

      if (!imei) erros.push('IMEI_INVALIDO');
      if (!iccid) erros.push('ICCID_INVALIDO');

      const [trackerRes, simRes] = await Promise.all([
        imei
          ? this.resolveRastreador(imei)
          : Promise.resolve({
              status: 'INVALID_FORMAT' as const,
            }),
        iccid
          ? this.resolveSim(iccid)
          : Promise.resolve({
              status: 'INVALID_FORMAT' as const,
            }),
      ]);

      let tracker_acao: TrackerCsvAcao = 'ERRO';
      let loteRastreadorId: number | undefined;
      let loteRastreadorReferencia: string | undefined;
      let marcaRastreador: string | undefined;
      let modeloRastreador: string | undefined;
      const trackerId: number | undefined = (
        trackerRes as { trackerId?: number }
      ).trackerId;

      if (trackerRes.status === 'INVALID_FORMAT') {
        if (imei && !erros.includes('IMEI_INVALIDO'))
          erros.push('IMEI_INVALIDO');
      } else if (trackerRes.status === 'FOUND_ALREADY_LINKED') {
        erros.push('IMEI_JA_VINCULADO');
      } else if (trackerRes.status === 'FOUND_AVAILABLE') {
        tracker_acao = 'VINCULAR_EXISTENTE';
        marcaRastreador = (trackerRes as { marca?: string }).marca;
        modeloRastreador = (trackerRes as { modelo?: string }).modelo;
      } else {
        if (raw.loteRastreador?.trim()) {
          const lote = await this.resolveLoteCsv(
            raw.loteRastreador,
            'RASTREADOR',
          );
          if (lote.erro) {
            erros.push(lote.erro);
          } else {
            tracker_acao = 'CRIAR_VIA_LOTE';
            loteRastreadorId = lote.id;
            loteRastreadorReferencia = lote.referencia;
          }
        } else if (
          raw.marcaRastreador?.trim() &&
          raw.modeloRastreador?.trim()
        ) {
          tracker_acao = 'CRIAR_MANUAL';
          marcaRastreador = raw.marcaRastreador.trim();
          modeloRastreador = raw.modeloRastreador.trim();
        } else {
          erros.push('FALTA_DADOS_RASTREADOR');
        }
      }

      let sim_acao: SimCsvAcao = 'ERRO';
      let loteSimId: number | undefined;
      let loteSimReferencia: string | undefined;
      let marcaSimcardId: number | undefined;
      let planoSimcardId: number | undefined;
      let operadora: string | undefined;
      const simId: number | undefined = (simRes as { simId?: number }).simId;

      if (simRes.status === 'INVALID_FORMAT') {
        if (iccid && !erros.includes('ICCID_INVALIDO'))
          erros.push('ICCID_INVALIDO');
      } else if (simRes.status === 'FOUND_ALREADY_LINKED') {
        erros.push('ICCID_JA_VINCULADO');
      } else if (simRes.status === 'FOUND_AVAILABLE') {
        sim_acao = 'VINCULAR_EXISTENTE';
        operadora = (simRes as { operadora?: string }).operadora;
        marcaSimcardId = (simRes as { marcaSimcardId?: number }).marcaSimcardId;
        planoSimcardId = (simRes as { planoSimcardId?: number }).planoSimcardId;
      } else {
        if (raw.loteSimcard?.trim()) {
          const lote = await this.resolveLoteCsv(raw.loteSimcard, 'SIM');
          if (lote.erro) {
            erros.push(lote.erro);
          } else {
            sim_acao = 'CRIAR_VIA_LOTE';
            loteSimId = lote.id;
            loteSimReferencia = lote.referencia;
          }
        } else if (
          raw.operadora?.trim() ||
          raw.marcaSimcard?.trim() ||
          raw.plano?.trim()
        ) {
          let simHasErro = false;
          if (raw.marcaSimcard?.trim()) {
            const marca = await this.resolveMarcaSimcardCsv(raw.marcaSimcard);
            if (marca.erro) {
              erros.push(marca.erro);
              simHasErro = true;
            } else {
              marcaSimcardId = marca.id;
            }
          }
          if (!simHasErro && raw.plano?.trim()) {
            const plano = await this.resolvePlanoSimcardCsv(
              raw.plano,
              marcaSimcardId,
            );
            if (plano.erro) {
              erros.push(plano.erro);
              simHasErro = true;
            } else {
              planoSimcardId = plano.id;
            }
          }
          if (!simHasErro) {
            sim_acao = 'CRIAR_MANUAL';
            operadora = raw.operadora?.trim();
          }
        } else {
          erros.push('FALTA_DADOS_SIM');
        }
      }

      linhas.push({
        imei,
        iccid,
        tracker_status: trackerRes.status,
        sim_status: simRes.status,
        tracker_acao: erros.length > 0 ? 'ERRO' : tracker_acao,
        sim_acao: erros.length > 0 ? 'ERRO' : sim_acao,
        erros,
        trackerId,
        simId,
        marcaRastreador,
        modeloRastreador,
        operadora,
        marcaSimcardId,
        planoSimcardId,
        loteRastreadorId,
        loteSimId,
        loteRastreadorReferencia,
        loteSimReferencia,
      });
    }

    const validos = linhas.filter((l) => l.erros.length === 0).length;
    const erros = linhas.filter((l) => l.erros.length > 0).length;

    return {
      linhas,
      contadores: { validos, comAviso: 0, erros },
    };
  }

  async pareamentoCsv(input: PareamentoCsvInput) {
    if (!input.linhas?.length) {
      throw new BadRequestException('Nenhuma linha informada');
    }

    const preview = await this.pareamentoCsvPreview(input);
    const linhasComErro = preview.linhas.filter((l) => l.erros.length > 0);
    if (linhasComErro.length > 0) {
      throw new BadRequestException(
        `${linhasComErro.length} linha(s) com erro. Corrija o CSV antes de importar.`,
      );
    }

    const proprietarioFinal = (input.proprietario ??
      'INFINITY') as ProprietarioTipo;
    const clienteId = input.clienteId;
    const tecnicoId = input.tecnicoId;

    return this.prisma.$transaction(async (tx) => {
      const criados: {
        rastreadorId: number;
        simId: number;
        equipamentoId: number;
      }[] = [];

      for (const linha of preview.linhas) {
        const { planoRastreador, planoSim } =
          this.mapearPlanoPareamentoCsv(linha);
        const feito = await this.executarPareamentoLinhaTx(
          tx,
          {
            imei: linha.imei,
            iccid: linha.iccid,
            proprietarioFinal,
            clienteId: clienteId ?? null,
            tecnicoId,
            historicoObservacao: `Pareamento CSV com SIM ${linha.iccid}`,
          },
          planoRastreador,
          planoSim,
        );
        if (feito) criados.push(feito);
      }

      return { criados: criados.length, equipamentos: criados };
    });
  }
}
