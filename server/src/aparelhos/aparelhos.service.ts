import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProprietarioTipo } from '@prisma/client';
import { StatusAparelho, StatusOS } from '@prisma/client';
import { CreateIndividualDto } from './dto/create-individual.dto';
import { DebitosRastreadoresService } from '../debitos-rastreadores/debitos-rastreadores.service';

@Injectable()
export class AparelhosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly debitosService: DebitosRastreadoresService,
  ) {}

  private readonly selectParaTestes = {
    id: true,
    identificador: true,
    proprietario: true,
    marca: true,
    modelo: true,
    status: true,
    operadora: true,
    criadoEm: true,
    cliente: { select: { id: true, nome: true, cor: true } },
    tecnico: { select: { id: true, nome: true } },
    marcaSimcard: {
      select: {
        id: true,
        nome: true,
        operadora: { select: { id: true, nome: true } },
      },
    },
    planoSimcard: { select: { id: true, planoMb: true } },
    simVinculado: {
      select: {
        id: true,
        identificador: true,
        operadora: true,
        marcaSimcard: {
          select: { nome: true, operadora: { select: { nome: true } } },
        },
        planoSimcard: { select: { planoMb: true } },
      },
    },
  } as const;

  async findParaTestes(
    clienteId: number,
    tecnicoId?: number | null,
    ordemServicoId?: number | null,
  ) {
    const whereEmUso: Prisma.OrdemServicoWhereInput = {
      status: StatusOS.EM_TESTES,
      idAparelho: { not: null },
    };
    if (ordemServicoId != null) {
      whereEmUso.id = { not: ordemServicoId };
    }
    const idsEmUso = await this.prisma.ordemServico.findMany({
      where: whereEmUso,
      select: { idAparelho: true },
    });
    const identificadoresEmUso = idsEmUso
      .map((o) => o.idAparelho)
      .filter((x): x is string => !!x);

    let idAparelhoVinculado: string | null = null;
    if (ordemServicoId != null) {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: ordemServicoId },
        select: { idAparelho: true },
      });
      idAparelhoVinculado = os?.idAparelho?.trim() || null;
    }

    const whereOwner =
      tecnicoId != null
        ? { tecnicoId }
        : {
            OR: [
              { proprietario: 'INFINITY' as const },
              { proprietario: 'CLIENTE' as const, clienteId },
            ],
            tecnicoId: null,
          };

    const where = {
      tipo: 'RASTREADOR' as const,
      status: 'COM_TECNICO' as StatusAparelho,
      ...whereOwner,
      ...(identificadoresEmUso.length > 0
        ? { identificador: { notIn: identificadoresEmUso } }
        : {}),
    };
    const lista = await this.prisma.aparelho.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      select: this.selectParaTestes,
    });

    if (!idAparelhoVinculado) return lista;
    const jaIncluido = lista.some(
      (a) =>
        (a.identificador ?? '').trim().toLowerCase() ===
        idAparelhoVinculado.trim().toLowerCase(),
    );
    if (jaIncluido) return lista;

    const vinculado = await this.prisma.aparelho.findFirst({
      where: {
        tipo: 'RASTREADOR',
        identificador: idAparelhoVinculado,
      },
      select: this.selectParaTestes,
    });
    if (!vinculado) return lista;
    return [vinculado, ...lista];
  }

  async findAll() {
    const aparelhos = await this.prisma.aparelho.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true, cor: true } },
        lote: { select: { id: true, referencia: true } },
        tecnico: { select: { id: true, nome: true } },
        kit: { select: { id: true, nome: true } },
        marcaSimcard: {
          select: {
            id: true,
            nome: true,
            operadora: { select: { id: true, nome: true } },
          },
        },
        planoSimcard: { select: { id: true, planoMb: true } },
        simVinculado: {
          select: {
            id: true,
            identificador: true,
            operadora: true,
            marcaSimcard: { select: { id: true, nome: true } },
            planoSimcard: { select: { id: true, planoMb: true } },
            lote: { select: { id: true, referencia: true } },
          },
        },
        aparelhosVinculados: {
          select: {
            id: true,
            identificador: true,
            kitId: true,
            kit: { select: { id: true, nome: true } },
            tecnicoId: true,
            tecnico: { select: { id: true, nome: true } },
            clienteId: true,
            cliente: { select: { id: true, nome: true, cor: true } },
          },
        },
        historico: {
          orderBy: { criadoEm: 'desc' },
          take: 5,
        },
      },
    });

    const identificadoresSet = new Set<string>();
    aparelhos.forEach((a) => {
      if (a.tipo === 'RASTREADOR' && a.identificador?.trim()) {
        identificadoresSet.add(a.identificador.trim());
      }
      a.aparelhosVinculados?.forEach((r) => {
        if (r.identificador?.trim())
          identificadoresSet.add(r.identificador.trim());
      });
    });
    const identificadores = Array.from(identificadoresSet);

    const osVinculadas = await this.prisma.ordemServico.findMany({
      where: { idAparelho: { in: identificadores } },
      orderBy: { atualizadoEm: 'desc' },
      select: {
        numero: true,
        idAparelho: true,
        subclienteSnapshotNome: true,
        subcliente: { select: { nome: true } },
        veiculo: { select: { placa: true } },
      },
    });

    const osPorIdentificador = new Map<string, (typeof osVinculadas)[0]>();
    for (const os of osVinculadas) {
      const key = (os.idAparelho ?? '').trim();
      if (key && !osPorIdentificador.has(key)) {
        osPorIdentificador.set(key, os);
      }
    }

    return aparelhos.map((a) => {
      const chave =
        a.tipo === 'RASTREADOR'
          ? (a.identificador ?? '').trim()
          : (a.aparelhosVinculados?.[0]?.identificador ?? '').trim();
      const os = chave ? osPorIdentificador.get(chave) : undefined;
      const ordemServicoVinculada = os
        ? {
            numero: os.numero,
            subclienteNome:
              os.subclienteSnapshotNome ?? os.subcliente?.nome ?? null,
            veiculoPlaca: os.veiculo?.placa ?? null,
          }
        : undefined;
      return { ...a, ordemServicoVinculada };
    });
  }

  async findOne(id: number) {
    const aparelho = await this.prisma.aparelho.findUnique({
      where: { id },
      include: {
        cliente: true,
        lote: true,
        tecnico: true,
        kit: { select: { id: true, nome: true } },
        marcaSimcard: { include: { operadora: true } },
        planoSimcard: true,
        simVinculado: true,
        historico: { orderBy: { criadoEm: 'desc' } },
      },
    });
    if (!aparelho) throw new NotFoundException('Aparelho não encontrado');
    return aparelho;
  }

  async updateStatus(id: number, status: StatusAparelho, observacao?: string) {
    const aparelho = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.aparelhoHistorico.create({
        data: {
          aparelhoId: id,
          statusAnterior: aparelho.status,
          statusNovo: status,
          observacao,
        },
      });
      await tx.aparelho.update({ where: { id }, data: { status } });

      if (aparelho.tipo === 'RASTREADOR' && aparelho.simVinculadoId) {
        await tx.aparelhoHistorico.create({
          data: {
            aparelhoId: aparelho.simVinculadoId,
            statusAnterior: aparelho.simVinculado!.status,
            statusNovo: status,
            observacao: observacao ?? `Status atualizado junto ao rastreador`,
          },
        });
        await tx.aparelho.update({
          where: { id: aparelho.simVinculadoId },
          data: { status },
        });
      }
    });

    return this.prisma.aparelho.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true, cor: true } },
        lote: { select: { id: true, referencia: true } },
        tecnico: { select: { id: true, nome: true } },
        simVinculado: {
          select: { id: true, identificador: true, operadora: true },
        },
      },
    });
  }

  async getResumo() {
    const [total, porStatus, porTipo] = await Promise.all([
      this.prisma.aparelho.count(),
      this.prisma.aparelho.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.aparelho.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
      }),
    ]);

    return {
      total,
      porStatus: porStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.status }),
        {} as Record<string, number>,
      ),
      porTipo: porTipo.reduce(
        (acc, item) => ({ ...acc, [item.tipo]: item._count.tipo }),
        {} as Record<string, number>,
      ),
    };
  }

  async createIndividual(dto: CreateIndividualDto) {
    const {
      identificador,
      tipo,
      marca,
      modelo,
      operadora,
      marcaSimcardId,
      planoSimcardId,
      origem,
      responsavelEntrega,
      tecnicoId,
      observacoes,
      statusEntrada,
      categoriaFalha,
      destinoDefeito,
      motivoDefeito,
      proprietario,
      clienteId,
      notaFiscal,
      abaterDebitoId,
    } = dto;

    const existente = await this.prisma.aparelho.findFirst({
      where: { identificador },
    });

    if (existente) {
      throw new BadRequestException(
        `O identificador ${identificador} já está cadastrado no sistema`,
      );
    }

    let operadoraSim = operadora;
    if (tipo === 'SIM' && marcaSimcardId) {
      const marcaSim = await this.prisma.marcaSimcard.findUnique({
        where: { id: marcaSimcardId },
        include: { operadora: true },
      });
      if (!marcaSim)
        throw new BadRequestException('Marca de simcard não encontrada');
      operadoraSim = marcaSim.operadora.nome;
    }

    // SIMs always belong to Infinity — no client ownership, no debt abatement
    if (tipo === 'SIM') {
      return this.prisma.$transaction(async (tx) => {
        const aparelho = await tx.aparelho.create({
          data: {
            tipo: 'SIM',
            identificador,
            status: 'EM_ESTOQUE',
            proprietario: 'INFINITY',
            clienteId: null,
            operadora: operadoraSim ?? null,
            marcaSimcardId: marcaSimcardId ?? null,
            planoSimcardId: planoSimcardId ?? null,
            tecnicoId: tecnicoId || null,
            observacao: statusEntrada === 'EM_MANUTENCAO' ? 'Usado' : null,
          },
          include: {
            tecnico: { select: { id: true, nome: true } },
          },
        });
        await tx.aparelhoHistorico.create({
          data: {
            aparelhoId: aparelho.id,
            statusAnterior: 'EM_ESTOQUE',
            statusNovo: 'EM_ESTOQUE',
            observacao: [
              `Entrada individual - Origem: ${origem}`,
              responsavelEntrega ? `Responsável: ${responsavelEntrega}` : null,
              notaFiscal ? `Nota Fiscal: ${notaFiscal}` : null,
              'Vinculado à Infinity',
              observacoes ? `Obs: ${observacoes}` : null,
            ]
              .filter(Boolean)
              .join(' | '),
          },
        });
        return aparelho;
      });
    }

    // If abating a debt, override the owner to the creditor
    let finalProprietario: ProprietarioTipo = proprietario ?? 'INFINITY';
    let finalClienteId: number | null =
      proprietario === 'CLIENTE' ? (clienteId ?? null) : null;
    let debitoAbater: {
      devedorTipo: ProprietarioTipo;
      devedorClienteId: number | null;
      credorTipo: ProprietarioTipo;
      credorClienteId: number | null;
      marcaId: number;
      modeloId: number;
    } | null = null;

    if (abaterDebitoId) {
      const debito = await this.prisma.debitoRastreador.findUnique({
        where: { id: abaterDebitoId },
      });
      if (!debito) throw new BadRequestException('Débito não encontrado');
      if (debito.quantidade < 1)
        throw new BadRequestException('Débito já quitado');

      finalProprietario = debito.credorTipo;
      finalClienteId = debito.credorClienteId;
      debitoAbater = {
        devedorTipo: debito.devedorTipo,
        devedorClienteId: debito.devedorClienteId,
        credorTipo: debito.credorTipo,
        credorClienteId: debito.credorClienteId,
        marcaId: debito.marcaId,
        modeloId: debito.modeloId,
      };
    }

    const statusAparelho: StatusAparelho = 'EM_ESTOQUE';

    return this.prisma.$transaction(async (tx) => {
      const aparelho = await tx.aparelho.create({
        data: {
          tipo,
          identificador,
          status: statusAparelho,
          proprietario: finalProprietario,
          clienteId: finalClienteId,
          marca: marca ?? null,
          modelo: modelo ?? null,
          operadora: null,
          marcaSimcardId: null,
          planoSimcardId: null,
          tecnicoId: tecnicoId || null,
          observacao: statusEntrada === 'EM_MANUTENCAO' ? 'Usado' : null,
        },
        include: {
          tecnico: { select: { id: true, nome: true } },
        },
      });

      await tx.aparelhoHistorico.create({
        data: {
          aparelhoId: aparelho.id,
          statusAnterior: statusAparelho,
          statusNovo: statusAparelho,
          observacao: [
            `Entrada individual - Origem: ${origem}`,
            responsavelEntrega ? `Responsável: ${responsavelEntrega}` : null,
            notaFiscal ? `Nota Fiscal: ${notaFiscal}` : null,
            debitoAbater
              ? `Abate de dívida (débito ID ${abaterDebitoId})`
              : finalProprietario === 'CLIENTE'
                ? `Vinculado ao cliente ID ${finalClienteId}`
                : 'Vinculado à Infinity',
            statusEntrada === 'CANCELADO_DEFEITO'
              ? `Status: Defeito - ${categoriaFalha}${categoriaFalha === 'OUTRO' && motivoDefeito ? ` (${motivoDefeito})` : ''} - Destino: ${destinoDefeito}`
              : statusEntrada === 'EM_MANUTENCAO'
                ? 'Status: Usado'
                : 'Status: Novo/OK',
            observacoes ? `Obs: ${observacoes}` : null,
          ]
            .filter(Boolean)
            .join(' | '),
        },
      });

      if (debitoAbater) {
        await this.debitosService.consolidarDebitoTx(tx, {
          ...debitoAbater,
          delta: -1,
          aparelhoId: aparelho.id,
        });
      }

      return aparelho;
    });
  }
}
