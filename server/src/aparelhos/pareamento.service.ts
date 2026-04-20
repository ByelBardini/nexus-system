import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebitosRastreadoresService } from '../debitos-rastreadores/debitos-rastreadores.service';
import { ProprietarioTipo } from '@prisma/client';

@Injectable()
export class PareamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly debitosService: DebitosRastreadoresService,
  ) {}

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
    const proprietarioFinal = proprietario ?? 'INFINITY';
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
        let rastreadorId: number;
        let simId: number;
        let rastreadorAnterior: {
          proprietario: ProprietarioTipo;
          clienteId: number | null;
          marca: string | null;
          modelo: string | null;
        } | null = null;

        // Resolver rastreador
        if (linha.tracker_status === 'FOUND_AVAILABLE' && linha.trackerId) {
          rastreadorId = linha.trackerId;
          rastreadorAnterior = await tx.aparelho.findUnique({
            where: { id: linha.trackerId },
            select: {
              proprietario: true,
              clienteId: true,
              marca: true,
              modelo: true,
            },
          });
        } else if (
          linha.tracker_status === 'NEEDS_CREATE' &&
          loteRastreadorId
        ) {
          const aparelhoSemId = await tx.aparelho.findFirst({
            where: {
              loteId: loteRastreadorId,
              tipo: 'RASTREADOR',
              identificador: null,
              status: 'EM_ESTOQUE',
            },
            include: { lote: true },
          });
          if (!aparelhoSemId) {
            throw new BadRequestException(
              `Lote de rastreadores sem saldo disponível para IMEI ${linha.imei}`,
            );
          }
          rastreadorAnterior = {
            proprietario: aparelhoSemId.proprietario,
            clienteId: aparelhoSemId.clienteId,
            marca: aparelhoSemId.marca ?? aparelhoSemId.lote?.marca ?? null,
            modelo: aparelhoSemId.modelo ?? aparelhoSemId.lote?.modelo ?? null,
          };
          const cleanImei = linha.imei.replace(/\D/g, '');
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
        } else if (
          linha.tracker_status === 'NEEDS_CREATE' &&
          rastreadorManual?.marca &&
          rastreadorManual?.modelo
        ) {
          const cleanImei = linha.imei.replace(/\D/g, '');
          const novo = await tx.aparelho.create({
            data: {
              tipo: 'RASTREADOR',
              identificador: cleanImei,
              status: 'EM_ESTOQUE',
              proprietario: proprietarioFinal,
              clienteId: clienteId ?? null,
              tecnicoId: tecnicoId ?? null,
              marca: rastreadorManual.marca,
              modelo: rastreadorManual.modelo,
            },
          });
          rastreadorId = novo.id;
        } else {
          continue;
        }

        // Resolver SIM
        if (linha.sim_status === 'FOUND_AVAILABLE' && linha.simId) {
          simId = linha.simId;
        } else if (linha.sim_status === 'NEEDS_CREATE' && loteSimId) {
          const aparelhoSemId = await tx.aparelho.findFirst({
            where: {
              loteId: loteSimId,
              tipo: 'SIM',
              identificador: null,
              status: 'EM_ESTOQUE',
            },
          });
          if (!aparelhoSemId) {
            throw new BadRequestException(
              `Lote de SIMs sem saldo disponível para ICCID ${linha.iccid}`,
            );
          }
          const cleanIccid = linha.iccid.replace(/\D/g, '');
          await tx.aparelho.update({
            where: { id: aparelhoSemId.id },
            data: {
              identificador: cleanIccid,
              proprietario: 'INFINITY',
              clienteId: null,
            },
          });
          simId = aparelhoSemId.id;
        } else if (
          linha.sim_status === 'NEEDS_CREATE' &&
          (simManual?.operadora || simManual?.marcaSimcardId)
        ) {
          const cleanIccid = linha.iccid.replace(/\D/g, '');
          let operadoraNome = simManual.operadora;
          if (simManual.marcaSimcardId) {
            const marcaSim = await tx.marcaSimcard.findUnique({
              where: { id: simManual.marcaSimcardId },
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
              marcaSimcardId: simManual.marcaSimcardId ?? null,
              planoSimcardId: simManual.planoSimcardId ?? null,
            },
          });
          simId = novo.id;
        } else {
          continue;
        }

        // Vincular: rastreador recebe simVinculadoId e status CONFIGURADO
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
            observacao: `Pareamento com SIM ${linha.iccid}`,
          },
        });

        criados.push({
          rastreadorId,
          simId,
          equipamentoId: rastreadorId,
        });
      }

      return { criados: criados.length, equipamentos: criados };
    });
  }
}
