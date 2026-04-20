import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProprietarioTipo } from '@prisma/client';
import { ListDebitosDto } from './dto/list-debitos.dto';

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
    } = params;

    // Não criar dívida de entidade consigo mesma
    if (devedorTipo === credorTipo && devedorClienteId === credorClienteId)
      return;

    let debitoId: number;
    let actualDelta = delta;

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
      await tx.debitoRastreador.update({
        where: { id: reverseExisting.id },
        data: { quantidade: { decrement: delta } },
      });
      debitoId = reverseExisting.id;
      actualDelta = -delta; // registrado como saída no histórico
    } else {
      // Upsert manual porque campos nullable em unique key não suportam upsert direto no Prisma/MySQL
      const existing = await tx.debitoRastreador.findFirst({
        where: {
          devedorTipo,
          devedorClienteId,
          credorTipo,
          credorClienteId,
          marcaId,
          modeloId,
        },
      });

      if (existing) {
        await tx.debitoRastreador.update({
          where: { id: existing.id },
          data: { quantidade: { increment: delta } },
        });
        debitoId = existing.id;
      } else {
        const created = await tx.debitoRastreador.create({
          data: {
            devedorTipo,
            devedorClienteId,
            credorTipo,
            credorClienteId,
            marcaId,
            modeloId,
            quantidade: delta,
          },
        });
        debitoId = created.id;
      }
    }

    await tx.historicoDebitoRastreador.create({
      data: {
        debitoId,
        pedidoId: pedidoId ?? null,
        loteId: loteId ?? null,
        aparelhoId: aparelhoId ?? null,
        delta: actualDelta,
      },
    });
  }

  async findAll(params: ListDebitosDto) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 100, 500);
    const skip = (page - 1) * limit;

    const where: Prisma.DebitoRastreadorWhereInput = {};
    if (params.devedorClienteId !== undefined)
      where.devedorClienteId = params.devedorClienteId;
    if (params.credorClienteId !== undefined)
      where.credorClienteId = params.credorClienteId;
    if (params.marcaId !== undefined) where.marcaId = params.marcaId;
    if (params.modeloId !== undefined) where.modeloId = params.modeloId;
    if (params.status === 'aberto') where.quantidade = { gt: 0 };
    if (params.status === 'quitado') where.quantidade = { lte: 0 };

    const [data, total] = await Promise.all([
      this.prisma.debitoRastreador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { atualizadoEm: 'desc' },
        include: {
          devedorCliente: { select: { id: true, nome: true } },
          credorCliente: { select: { id: true, nome: true } },
          marca: { select: { id: true, nome: true } },
          modelo: { select: { id: true, nome: true } },
          historicos: {
            orderBy: { criadoEm: 'asc' },
            include: {
              pedido: { select: { id: true, codigo: true } },
              lote: { select: { id: true, referencia: true } },
              aparelho: { select: { id: true, identificador: true } },
            },
          },
        },
      }),
      this.prisma.debitoRastreador.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const debito = await this.prisma.debitoRastreador.findUnique({
      where: { id },
      include: {
        devedorCliente: { select: { id: true, nome: true } },
        credorCliente: { select: { id: true, nome: true } },
        marca: { select: { id: true, nome: true } },
        modelo: { select: { id: true, nome: true } },
      },
    });
    if (!debito) throw new NotFoundException('Débito não encontrado');
    return debito;
  }
}
