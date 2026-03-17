import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { StatusAparelho, StatusOS } from '@prisma/client';
import { CreateIndividualDto } from './dto/create-individual.dto';

@Injectable()
export class AparelhosService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly selectParaTestes = {
    id: true,
    identificador: true,
    marca: true,
    modelo: true,
    status: true,
    operadora: true,
    criadoEm: true,
    cliente: { select: { id: true, nome: true } },
    tecnico: { select: { id: true, nome: true } },
    marcaSimcard: { select: { id: true, nome: true, operadora: { select: { id: true, nome: true } } } },
    planoSimcard: { select: { id: true, planoMb: true } },
    simVinculado: {
      select: {
        id: true,
        identificador: true,
        operadora: true,
        marcaSimcard: { select: { nome: true, operadora: { select: { nome: true } } } },
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
    }
    if (ordemServicoId != null) {
      whereEmUso.id = { not: ordemServicoId }
    }
    const idsEmUso = await this.prisma.ordemServico.findMany({
      where: whereEmUso,
      select: { idAparelho: true },
    })
    const identificadoresEmUso = idsEmUso
      .map((o) => o.idAparelho)
      .filter((x): x is string => !!x)

    let idAparelhoVinculado: string | null = null
    if (ordemServicoId != null) {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: ordemServicoId },
        select: { idAparelho: true },
      })
      idAparelhoVinculado = os?.idAparelho?.trim() || null
    }

    const where = {
      tipo: 'RASTREADOR' as const,
      status: 'COM_TECNICO' as StatusAparelho,
      OR: [
        { proprietario: 'INFINITY' as const },
        { proprietario: 'CLIENTE' as const, clienteId },
      ],
      tecnicoId: tecnicoId != null ? tecnicoId : null,
      ...(identificadoresEmUso.length > 0
        ? { identificador: { notIn: identificadoresEmUso } }
        : {}),
    };
    const lista = await this.prisma.aparelho.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      select: this.selectParaTestes,
    })

    if (!idAparelhoVinculado) return lista
    const jaIncluido = lista.some(
      (a) => (a.identificador ?? '').trim().toLowerCase() === idAparelhoVinculado!.trim().toLowerCase(),
    )
    if (jaIncluido) return lista

    const vinculado = await this.prisma.aparelho.findFirst({
      where: {
        tipo: 'RASTREADOR',
        identificador: idAparelhoVinculado,
      },
      select: this.selectParaTestes,
    })
    if (!vinculado) return lista
    return [vinculado, ...lista]
  }

  async findAll() {
    const aparelhos = await this.prisma.aparelho.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        lote: { select: { id: true, referencia: true } },
        tecnico: { select: { id: true, nome: true } },
        kit: { select: { id: true, nome: true } },
        marcaSimcard: { select: { id: true, nome: true, operadora: { select: { id: true, nome: true } } } },
        planoSimcard: { select: { id: true, planoMb: true } },
        simVinculado: {
          select: {
            id: true,
            identificador: true,
            operadora: true,
            marcaSimcard: { select: { id: true, nome: true } },
            planoSimcard: { select: { id: true, planoMb: true } },
          },
        },
        aparelhosVinculados: {
          select: {
            id: true,
            identificador: true,
          },
        },
        historico: {
          orderBy: { criadoEm: 'desc' },
          take: 5,
        },
      },
    });

    const identificadores = aparelhos
      .filter((a) => a.tipo === 'RASTREADOR' && a.identificador?.trim())
      .map((a) => a.identificador!.trim());

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
      const key = (a.identificador ?? '').trim();
      const os = key ? osPorIdentificador.get(key) : undefined;
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
        cliente: { select: { id: true, nome: true } },
        lote: { select: { id: true, referencia: true } },
        tecnico: { select: { id: true, nome: true } },
        simVinculado: { select: { id: true, identificador: true, operadora: true } },
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
      if (!marcaSim) throw new BadRequestException('Marca de simcard não encontrada');
      operadoraSim = marcaSim.operadora.nome;
    }

    const statusAparelho: StatusAparelho = 'EM_ESTOQUE';

    const aparelho = await this.prisma.aparelho.create({
      data: {
        tipo,
        identificador,
        status: statusAparelho,
        proprietario: 'INFINITY',
        marca: tipo === 'RASTREADOR' ? marca : null,
        modelo: tipo === 'RASTREADOR' ? modelo : null,
        operadora: tipo === 'SIM' ? operadoraSim : null,
        marcaSimcardId: tipo === 'SIM' ? marcaSimcardId ?? null : null,
        planoSimcardId: tipo === 'SIM' ? planoSimcardId ?? null : null,
        tecnicoId: tecnicoId || null,
      },
      include: {
        tecnico: { select: { id: true, nome: true } },
      },
    });

    await this.prisma.aparelhoHistorico.create({
      data: {
        aparelhoId: aparelho.id,
        statusAnterior: statusAparelho,
        statusNovo: statusAparelho,
        observacao: [
          `Entrada individual - Origem: ${origem}`,
          responsavelEntrega ? `Responsável: ${responsavelEntrega}` : null,
          statusEntrada === 'CANCELADO_DEFEITO'
            ? `Status: Defeito - ${categoriaFalha} - Destino: ${destinoDefeito}`
            : statusEntrada === 'EM_MANUTENCAO'
              ? 'Status: Em manutenção'
              : 'Status: Novo/OK',
          observacoes ? `Obs: ${observacoes}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      },
    });

    return aparelho;
  }
}
