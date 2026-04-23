import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProprietarioTipo } from '@prisma/client';
import { ListDebitosDto } from './dto/list-debitos.dto';
import {
  buildDebitoRastreadorFindInclude,
  debitoRastreadorClienteMarcaModeloInclude,
} from './debito-rastreador.include';

export interface ConsolidarDebitoParams {
  devedorTipo: ProprietarioTipo;
  devedorClienteId: number | null;
  credorTipo: ProprietarioTipo;
  credorClienteId: number | null;
  marcaId: number;
  modeloId: number;
  delta: number;
  pedidoId?: number | null;
  loteId?: number | null;
  aparelhoId?: number | null;
  ordemServicoId?: number | null;
}

@Injectable()
export class DebitosRastreadoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consolidar (criar ou incrementar) um débito dentro de uma transação Prisma existente.
   * Chamado pelo PedidosRastreadoresService durante a transição de status.
   */
  async consolidarDebitoTx(
    tx: Prisma.TransactionClient,
    params: ConsolidarDebitoParams,
  ): Promise<void> {
    const {
      devedorTipo,
      devedorClienteId,
      credorTipo,
      credorClienteId,
      marcaId,
      modeloId,
      delta,
      pedidoId,
      loteId,
      aparelhoId,
      ordemServicoId,
    } = params;

    // Não criar dívida de entidade consigo mesma
    if (devedorTipo === credorTipo && devedorClienteId === credorClienteId)
      return;

    const historicoBase = {
      pedidoId: pedidoId ?? null,
      loteId: loteId ?? null,
      aparelhoId: aparelhoId ?? null,
      ordemServicoId: ordemServicoId ?? null,
    };

    const forwardWhere = {
      devedorTipo,
      devedorClienteId,
      credorTipo,
      credorClienteId,
      marcaId,
      modeloId,
    };

    // Verificar se existe dívida no sentido reverso (ex: AASC→Infinity quando estamos registrando Infinity→AASC).
    // Nesse caso, é uma "devolução": abate a dívida existente em vez de criar uma nova oposta.
    const reverseExisting = await tx.debitoRastreador.findFirst({
      where: {
        devedorTipo: credorTipo,
        devedorClienteId: credorClienteId,
        credorTipo: devedorTipo,
        credorClienteId: devedorClienteId,
        marcaId,
        modeloId,
      },
    });

    if (reverseExisting && reverseExisting.quantidade > 0) {
      const saldoReverso = reverseExisting.quantidade;

      if (delta <= saldoReverso) {
        await tx.debitoRastreador.update({
          where: { id: reverseExisting.id },
          data: { quantidade: { decrement: delta } },
        });
        await tx.historicoDebitoRastreador.create({
          data: {
            ...historicoBase,
            debitoId: reverseExisting.id,
            delta: -delta,
          },
        });
        return;
      }

      await tx.debitoRastreador.update({
        where: { id: reverseExisting.id },
        data: { quantidade: 0 },
      });
      await tx.historicoDebitoRastreador.create({
        data: {
          ...historicoBase,
          debitoId: reverseExisting.id,
          delta: -saldoReverso,
        },
      });

      const remainder = delta - saldoReverso;
      if (remainder <= 0) return;

      const existingForward = await tx.debitoRastreador.findFirst({
        where: forwardWhere,
      });

      let forwardDebitoId: number;
      if (existingForward) {
        await tx.debitoRastreador.update({
          where: { id: existingForward.id },
          data: { quantidade: { increment: remainder } },
        });
        forwardDebitoId = existingForward.id;
      } else {
        const created = await tx.debitoRastreador.create({
          data: {
            ...forwardWhere,
            quantidade: remainder,
          },
        });
        forwardDebitoId = created.id;
      }

      await tx.historicoDebitoRastreador.create({
        data: {
          ...historicoBase,
          debitoId: forwardDebitoId,
          delta: remainder,
        },
      });
      return;
    }

    // Upsert manual porque campos nullable em unique key não suportam upsert direto no Prisma/MySQL
    const existing = await tx.debitoRastreador.findFirst({
      where: forwardWhere,
    });

    let debitoId: number;
    if (existing) {
      await tx.debitoRastreador.update({
        where: { id: existing.id },
        data: { quantidade: { increment: delta } },
      });
      debitoId = existing.id;
    } else {
      const created = await tx.debitoRastreador.create({
        data: {
          ...forwardWhere,
          quantidade: delta,
        },
      });
      debitoId = created.id;
    }

    await tx.historicoDebitoRastreador.create({
      data: {
        ...historicoBase,
        debitoId,
        delta,
      },
    });
  }

  async findAll(params: ListDebitosDto) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 100, 500);
    const skip = (page - 1) * limit;
    const incluirHistoricos = params.incluirHistoricos ?? false;

    const where: Prisma.DebitoRastreadorWhereInput = {};
    if (params.devedorTipo !== undefined)
      where.devedorTipo = params.devedorTipo;
    if (params.credorTipo !== undefined) where.credorTipo = params.credorTipo;
    if (params.devedorClienteId !== undefined)
      where.devedorClienteId = params.devedorClienteId;
    if (params.credorClienteId !== undefined)
      where.credorClienteId = params.credorClienteId;
    if (params.marcaId !== undefined) where.marcaId = params.marcaId;
    if (params.modeloId !== undefined) where.modeloId = params.modeloId;
    if (params.status === 'aberto') where.quantidade = { gt: 0 };
    if (params.status === 'quitado') where.quantidade = { lte: 0 };

    const include = buildDebitoRastreadorFindInclude(incluirHistoricos);

    const [data, total] = await Promise.all([
      this.prisma.debitoRastreador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { atualizadoEm: 'desc' },
        include,
      }),
      this.prisma.debitoRastreador.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const debito = await this.prisma.debitoRastreador.findUnique({
      where: { id },
      include: debitoRastreadorClienteMarcaModeloInclude,
    });
    if (!debito) throw new NotFoundException('Débito não encontrado');
    return debito;
  }
}
