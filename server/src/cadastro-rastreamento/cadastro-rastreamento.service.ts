import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrdemServico,
  Prisma,
  StatusAparelho,
  StatusCadastro,
  StatusOS,
  TipoAparelho,
  TipoOS,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConcluirCadastroDto } from './dto/concluir-cadastro.dto';
import { FindPendentesQueryDto } from './dto/find-pendentes-query.dto';

function normIdent(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

@Injectable()
export class CadastroRastreamentoService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── findPendentes ──────────────────────────────────────────────────────────

  async findPendentes(params: FindPendentesQueryDto) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, params.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.OrdemServicoWhereInput = {
      statusCadastro: { not: null },
    };

    if (params.plataforma) {
      where.plataforma = params.plataforma;
    }

    let dateRange: { gte: Date; lt: Date } | undefined;
    if (params.dataInicio && params.dataFim) {
      dateRange = { gte: params.dataInicio, lt: params.dataFim };
    }

    if (params.statusCadastro) {
      where.statusCadastro = params.statusCadastro;
      if (dateRange) {
        where.criadoEm = dateRange;
      }
    } else {
      const statusOu: Prisma.OrdemServicoWhereInput[] = [
        { statusCadastro: StatusCadastro.AGUARDANDO },
        {
          statusCadastro: {
            in: [StatusCadastro.EM_CADASTRO, StatusCadastro.CONCLUIDO],
          },
        },
      ];
      if (dateRange) {
        where.AND = [{ OR: statusOu }, { criadoEm: dateRange }];
      } else {
        where.OR = statusOu;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        skip,
        take: limit,
        include: {
          cliente: true,
          subcliente: true,
          tecnico: true,
          veiculo: true,
          criadoPor: true,
          concluidoPor: true,
        },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    const identificadores = [
      ...new Set(
        [
          ...data.map((o) => normIdent(o.idAparelho)),
          ...data.map((o) => normIdent(o.idEntrada)),
        ].filter((x): x is string => x != null),
      ),
    ];

    const aparelhoMap: Record<
      string,
      {
        marca: string | null;
        modelo: string | null;
        iccid: string | null;
        sim: {
          operadora: string | null;
          marcaNome: string | null;
          planoMb: number | null;
        } | null;
      }
    > = {};
    if (identificadores.length > 0) {
      const aparelhos = await this.prisma.aparelho.findMany({
        where: {
          tipo: TipoAparelho.RASTREADOR,
          identificador: { in: identificadores },
        },
        select: {
          identificador: true,
          marca: true,
          modelo: true,
          simVinculado: {
            select: {
              identificador: true,
              marcaSimcard: {
                select: {
                  nome: true,
                  operadora: { select: { nome: true } },
                },
              },
              planoSimcard: { select: { planoMb: true } },
            },
          },
        },
      });
      for (const a of aparelhos) {
        const key = normIdent(a.identificador);
        if (!key) continue;
        aparelhoMap[key] = {
          marca: a.marca,
          modelo: a.modelo,
          iccid: a.simVinculado?.identificador
            ? normIdent(a.simVinculado.identificador)
            : null,
          sim: a.simVinculado
            ? {
                operadora: a.simVinculado.marcaSimcard?.operadora?.nome ?? null,
                marcaNome: a.simVinculado.marcaSimcard?.nome ?? null,
                planoMb: a.simVinculado.planoSimcard?.planoMb ?? null,
              }
            : null,
        };
      }
    }

    const enrichedData = data.map((os) => {
      // Em REVISÃO: idAparelho é o aparelho original (sai do veículo) e
      // idEntrada é o novo (entra no veículo).
      // Em RETIRADA: o aparelho idAparelho sai do veículo e vai para
      // estoque — não há aparelho entrando.
      // Demais tipos (INSTALAÇÕES): entrada=idAparelho / saída=idEntrada.
      const isRevisao = os.tipo === TipoOS.REVISAO;
      const isRetirada = os.tipo === TipoOS.RETIRADA;
      const entradaId = isRetirada
        ? null
        : normIdent(isRevisao ? os.idEntrada : os.idAparelho);
      const saidaId = isRetirada
        ? normIdent(os.idAparelho)
        : normIdent(isRevisao ? os.idAparelho : os.idEntrada);
      return {
        ...os,
        aparelhoEntrada: entradaId ? (aparelhoMap[entradaId] ?? null) : null,
        aparelhoSaida: saidaId ? (aparelhoMap[saidaId] ?? null) : null,
      };
    });

    return { data: enrichedData, total };
  }

  // ─── iniciarCadastro ────────────────────────────────────────────────────────

  async iniciarCadastro(id: number) {
    const os = await this.prisma.ordemServico.findUnique({ where: { id } });

    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');

    if (os.status !== StatusOS.AGUARDANDO_CADASTRO) {
      throw new BadRequestException('OS não está em Aguardando Cadastro');
    }

    if (os.statusCadastro !== StatusCadastro.AGUARDANDO) {
      throw new BadRequestException('Cadastro não está no status Aguardando');
    }

    return this.prisma.ordemServico.update({
      where: { id },
      data: { statusCadastro: StatusCadastro.EM_CADASTRO },
    });
  }

  // ─── concluirCadastro ───────────────────────────────────────────────────────

  async concluirCadastro(id: number, dto: ConcluirCadastroDto, userId: number) {
    const os = await this.prisma.ordemServico.findUnique({ where: { id } });

    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');

    if (os.statusCadastro !== StatusCadastro.EM_CADASTRO) {
      throw new BadRequestException('Cadastro não está no status Em Cadastro');
    }

    const tiposInstalacao: TipoOS[] = [
      TipoOS.INSTALACAO_COM_BLOQUEIO,
      TipoOS.INSTALACAO_SEM_BLOQUEIO,
    ];

    if (tiposInstalacao.includes(os.tipo)) {
      return this._concluirInstalacao(os, dto, userId);
    }

    if (os.tipo === TipoOS.REVISAO) {
      return this._concluirRevisao(os, dto, userId);
    }

    if (os.tipo === TipoOS.RETIRADA) {
      return this._concluirRetirada(os, dto, userId);
    }

    throw new BadRequestException(
      `Tipo de OS '${os.tipo}' não suporta cadastro de rastreamento`,
    );
  }

  // ─── Privados ───────────────────────────────────────────────────────────────

  private async _concluirInstalacao(
    os: OrdemServico,
    dto: ConcluirCadastroDto,
    userId: number,
  ) {
    const aparelho = await this.prisma.aparelho.findFirst({
      where: { identificador: os.idAparelho! },
    });

    if (!aparelho) {
      throw new NotFoundException(
        `Aparelho com IMEI '${os.idAparelho}' não encontrado`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.aparelho.update({
        where: { id: aparelho.id },
        data: {
          subclienteId: os.subclienteId,
          veiculoId: os.veiculoId,
          status: StatusAparelho.INSTALADO,
        },
      });

      await tx.ordemServico.update({
        where: { id: os.id },
        data: this._dadosConclusaoOS(dto, userId),
      });

      await this._criarHistoricoConclusaoCadastro(tx, os.id);
    });

    return this.prisma.ordemServico.findUnique({ where: { id: os.id } });
  }

  private async _concluirRevisao(
    os: OrdemServico,
    dto: ConcluirCadastroDto,
    userId: number,
  ) {
    // Em REVISÃO: idAparelho é o aparelho ANTIGO (que estava instalado e
    // agora sai do veículo); idEntrada é o aparelho NOVO escolhido nos
    // testes (que passa a estar instalado).
    const aparelhoAntigo = os.idAparelho
      ? await this.prisma.aparelho.findFirst({
          where: { identificador: os.idAparelho },
        })
      : null;

    if (!os.idEntrada) {
      throw new BadRequestException(
        'OS de revisão sem IMEI de entrada informado nos testes',
      );
    }

    const aparelhoNovo = await this.prisma.aparelho.findFirst({
      where: { identificador: os.idEntrada },
    });

    if (!aparelhoNovo) {
      throw new NotFoundException(
        `Aparelho com IMEI '${os.idEntrada}' não encontrado`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (aparelhoAntigo) {
        await tx.aparelho.update({
          where: { id: aparelhoAntigo.id },
          data: {
            status: StatusAparelho.EM_ESTOQUE,
            subclienteId: null,
            veiculoId: null,
            observacao: 'aparelho usado',
          },
        });
      } else if (os.idAparelho) {
        await tx.aparelho.create({
          data: {
            identificador: os.idAparelho,
            tipo: TipoAparelho.RASTREADOR,
            observacao: 'aparelho usado',
            status: StatusAparelho.EM_ESTOQUE,
          },
        });
      }

      await tx.aparelho.update({
        where: { id: aparelhoNovo.id },
        data: {
          subclienteId: os.subclienteId,
          veiculoId: os.veiculoId,
          status: StatusAparelho.INSTALADO,
        },
      });

      await tx.ordemServico.update({
        where: { id: os.id },
        data: this._dadosConclusaoOS(dto, userId),
      });

      await this._criarHistoricoConclusaoCadastro(tx, os.id);
    });

    return this.prisma.ordemServico.findUnique({ where: { id: os.id } });
  }

  private async _concluirRetirada(
    os: OrdemServico,
    dto: ConcluirCadastroDto,
    userId: number,
  ) {
    const imeiRetirada = normIdent(os.idAparelho) ?? normIdent(os.idEntrada);

    const aparelho = imeiRetirada
      ? await this.prisma.aparelho.findFirst({
          where: { identificador: imeiRetirada },
        })
      : null;

    await this.prisma.$transaction(async (tx) => {
      if (aparelho) {
        await tx.aparelho.update({
          where: { id: aparelho.id },
          data: {
            status: StatusAparelho.EM_ESTOQUE,
            subclienteId: null,
            veiculoId: null,
          },
        });
      } else if (imeiRetirada) {
        await tx.aparelho.create({
          data: {
            identificador: imeiRetirada,
            tipo: TipoAparelho.RASTREADOR,
            observacao: 'aparelho usado',
            status: StatusAparelho.EM_ESTOQUE,
          },
        });
      }

      await tx.ordemServico.update({
        where: { id: os.id },
        data: this._dadosConclusaoOS(dto, userId),
      });

      await this._criarHistoricoConclusaoCadastro(tx, os.id);
    });

    return this.prisma.ordemServico.findUnique({ where: { id: os.id } });
  }

  private async _criarHistoricoConclusaoCadastro(
    tx: Prisma.TransactionClient,
    ordemServicoId: number,
  ) {
    await tx.oSHistorico.create({
      data: {
        ordemServicoId,
        statusAnterior: StatusOS.AGUARDANDO_CADASTRO,
        statusNovo: StatusOS.FINALIZADO,
      },
    });
  }

  private _dadosConclusaoOS(
    dto: ConcluirCadastroDto,
    userId: number,
  ): Prisma.OrdemServicoUncheckedUpdateInput {
    return {
      status: StatusOS.FINALIZADO,
      statusCadastro: StatusCadastro.CONCLUIDO,
      plataforma: dto.plataforma,
      concluidoEm: new Date(),
      concluidoPorId: userId,
    };
  }
}
