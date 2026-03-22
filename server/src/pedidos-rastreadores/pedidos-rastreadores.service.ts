import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoRastreadorDto } from './dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto';
import {
  Prisma,
  StatusPedidoRastreador,
  StatusAparelho,
  TipoDestinoPedido,
  UrgenciaPedido,
} from '@prisma/client';
import { paginateParams } from '../common/pagination.helper';

const includeBase = {
  tecnico: true,
  cliente: true,
  subcliente: { include: { cliente: true } },
  deCliente: true,
  marcaEquipamento: true,
  modeloEquipamento: { include: { marca: true } },
  operadora: true,
  criadoPor: true,
};

@Injectable()
export class PedidosRastreadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: StatusPedidoRastreador;
    search?: string;
  }) {
    const { page, limit, skip } = paginateParams(params, {
      maxLimit: 500,
      defaultLimit: 500,
    });

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.search?.trim()) {
      const s = params.search.trim();
      where.OR = [
        { codigo: { contains: s, mode: 'insensitive' as const } },
        { tecnico: { nome: { contains: s, mode: 'insensitive' as const } } },
        { cliente: { nome: { contains: s, mode: 'insensitive' as const } } },
        {
          subcliente: {
            nome: { contains: s, mode: 'insensitive' as const },
          },
        },
        {
          subcliente: {
            cliente: { nome: { contains: s, mode: 'insensitive' as const } },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.pedidoRastreador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: includeBase,
      }),
      this.prisma.pedidoRastreador.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedidoRastreador.findUnique({
      where: { id },
      include: {
        ...includeBase,
        historico: { orderBy: { criadoEm: 'desc' }, take: 50 },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido de rastreador não encontrado');
    }
    return pedido;
  }

  private extrairKitIds(val: unknown): number[] {
    if (val == null) return [];
    let arr: unknown;
    if (typeof val === 'string') {
      try {
        arr = JSON.parse(val) as unknown;
      } catch {
        return [];
      }
    } else {
      arr = val;
    }
    return Array.isArray(arr)
      ? arr.filter((x): x is number => typeof x === 'number')
      : [];
  }

  private static isUniqueConstraintError(e: unknown): boolean {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
  }

  async create(dto: CreatePedidoRastreadorDto, criadoPorId?: number) {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.createOnce(dto, criadoPorId);
      } catch (e) {
        if (attempt < maxRetries - 1 && PedidosRastreadoresService.isUniqueConstraintError(e)) {
          continue;
        }
        throw e;
      }
    }
    throw new Error('create pedido-rastreador: retries exhausted');
  }

  private async createOnce(dto: CreatePedidoRastreadorDto, criadoPorId?: number) {
    const ultimo = await this.prisma.pedidoRastreador.findFirst({
      orderBy: { id: 'desc' },
      select: { codigo: true },
    });
    const seq = ultimo?.codigo
      ? parseInt(ultimo.codigo.replace(/^PED-/i, ''), 10) + 1
      : 1;
    const codigo = `PED-${String(seq).padStart(4, '0')}`;

    const tecnicoId = dto.tipoDestino === TipoDestinoPedido.TECNICO ? dto.tecnicoId : null;
    const clienteId = dto.tipoDestino === TipoDestinoPedido.CLIENTE ? dto.clienteId ?? null : null;
    const subclienteId = dto.tipoDestino === TipoDestinoPedido.CLIENTE ? dto.subclienteId ?? null : null;

    const dataSolicitacao = dto.dataSolicitacao ? new Date(dto.dataSolicitacao) : new Date();
    const marcaEquipamentoId = dto.marcaEquipamentoId ?? null;
    const modeloEquipamentoId = dto.modeloEquipamentoId ?? null;
    const operadoraId = dto.operadoraId ?? null;
    const deClienteId = dto.deClienteId ?? null;

    return this.prisma.pedidoRastreador.create({
      data: {
        codigo,
        tipoDestino: dto.tipoDestino,
        tecnicoId,
        clienteId,
        subclienteId,
        deClienteId,
        quantidade: dto.quantidade,
        urgencia: dto.urgencia ?? UrgenciaPedido.MEDIA,
        dataSolicitacao,
        marcaEquipamentoId,
        modeloEquipamentoId,
        operadoraId,
        criadoPorId,
        observacao: dto.observacao,
      },
      include: includeBase,
    });
  }

  async updateStatus(id: number, dto: UpdateStatusPedidoDto) {
    const pedido = await this.findOne(id);
    const statusAnterior = pedido.status;
    if (statusAnterior === dto.status) return this.findOne(id);

    const dataUpdate: Prisma.PedidoRastreadorUncheckedUpdateInput = {
      status: dto.status,
    };
    if (dto.status === StatusPedidoRastreador.ENTREGUE) {
      dataUpdate.entregueEm = new Date();
    } else if (dto.status === StatusPedidoRastreador.CONFIGURADO) {
      dataUpdate.entregueEm = null;
    }

    // Regra de negócio: ao retroceder para CONFIGURADO (Despachado/Entregue → Configurado),
    // equipamentos vinculados aos kits do pedido voltam para CONFIGURADO ("Em Kit" no frontend)
    const novoStatusAparelho: StatusAparelho | null =
      dto.status === StatusPedidoRastreador.DESPACHADO
        ? StatusAparelho.DESPACHADO
        : dto.status === StatusPedidoRastreador.ENTREGUE
          ? StatusAparelho.COM_TECNICO
          : (statusAnterior === StatusPedidoRastreador.DESPACHADO ||
              statusAnterior === StatusPedidoRastreador.ENTREGUE) &&
            dto.status === StatusPedidoRastreador.CONFIGURADO
            ? StatusAparelho.CONFIGURADO
            : null;

    let kitIds: number[] =
      dto.kitIds && dto.kitIds.length > 0
        ? dto.kitIds.map((id) => Number(id))
        : [];

    if (kitIds.length === 0 && novoStatusAparelho !== null) {
      kitIds = this.extrairKitIds(pedido.kitIds);
    }

    // Salva kitIds em qualquer status quando fornecido (permite filtrar kits no pareamento independentemente do status)
    // Se kitIds vazio, preserva os existentes no banco (evita desvincular sem intenção explícita)
    if (kitIds.length > 0) {
      dataUpdate.kitIds = kitIds;
    }

    const statusRestritivos = [
      StatusPedidoRastreador.CONFIGURADO,
      StatusPedidoRastreador.DESPACHADO,
      StatusPedidoRastreador.ENTREGUE,
    ];

    const kitIdsAntigos = this.extrairKitIds(pedido.kitIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.pedidoRastreadorHistorico.create({
        data: {
          pedidoRastreadorId: id,
          statusAnterior,
          statusNovo: dto.status,
          observacao: dto.observacao,
        },
      });
      await tx.pedidoRastreador.update({
        where: { id },
        data: dataUpdate,
      });

      // Atualiza kit_concluido: true quando avança para CONFIGURADO/DESPACHADO/ENTREGUE
      if (
        (dto.status === StatusPedidoRastreador.CONFIGURADO ||
          dto.status === StatusPedidoRastreador.DESPACHADO ||
          dto.status === StatusPedidoRastreador.ENTREGUE) &&
        kitIds.length > 0
      ) {
        await tx.kit.updateMany({
          where: { id: { in: kitIds } },
          data: { kitConcluido: true },
        });
      }

      // Ao retroceder para SOLICITADO/EM_CONFIGURACAO, libera kits que não estão em outros pedidos restritivos
      if (
        (dto.status === StatusPedidoRastreador.SOLICITADO || dto.status === StatusPedidoRastreador.EM_CONFIGURACAO) &&
        kitIdsAntigos.length > 0
      ) {
        const outrosPedidos = await tx.pedidoRastreador.findMany({
          where: {
            id: { not: id },
            status: { in: statusRestritivos },
            kitIds: { not: Prisma.DbNull },
          },
          select: { kitIds: true },
        });
        const kitIdsAindaEmUso = new Set(
          outrosPedidos.flatMap((p) => this.extrairKitIds(p.kitIds)),
        );
        for (const kitId of kitIdsAntigos) {
          if (!kitIdsAindaEmUso.has(kitId)) {
            await tx.kit.update({ where: { id: kitId }, data: { kitConcluido: false } });
          }
        }
      }

      if (novoStatusAparelho && kitIds.length > 0) {
        const aparelhos = await tx.aparelho.findMany({
          where: {
            kitId: { in: kitIds },
            tipo: 'RASTREADOR',
          },
          select: { id: true, status: true, simVinculadoId: true, simVinculado: { select: { id: true, status: true } } },
        });

        const dataAparelho: {
          status: StatusAparelho;
          tecnicoId?: number | null;
          clienteId?: number | null;
        } = {
          status: novoStatusAparelho,
        };
        if (novoStatusAparelho === StatusAparelho.COM_TECNICO) {
          if (pedido.tipoDestino === TipoDestinoPedido.CLIENTE) {
            // Pedido para cliente: vincular ao cliente destino (cliente principal ou pai do subcliente)
            const targetClienteId =
              pedido.clienteId ??
              (pedido.subclienteId && pedido.subcliente
                ? pedido.subcliente.clienteId
                : null);
            dataAparelho.clienteId = targetClienteId ?? null;
            dataAparelho.tecnicoId = null;
          } else {
            // Pedido para técnico: vincular ao técnico e à empresa remetente (deCliente)
            // dto.deClienteId permite informar no momento de concluir, para pedidos criados sem "De Cliente"
            const empresaId = dto.deClienteId ?? pedido.deClienteId ?? null;
            dataAparelho.tecnicoId = pedido.tecnicoId ?? null;
            dataAparelho.clienteId = empresaId;
          }
        } else if (novoStatusAparelho === StatusAparelho.CONFIGURADO || novoStatusAparelho === StatusAparelho.DESPACHADO) {
          dataAparelho.tecnicoId = null;
          dataAparelho.clienteId = null;
        }

        for (const ap of aparelhos) {
          await tx.aparelhoHistorico.create({
            data: {
              aparelhoId: ap.id,
              statusAnterior: ap.status,
              statusNovo: novoStatusAparelho,
              observacao: `Pedido ${pedido.codigo} ${dto.status}`,
            },
          });
          await tx.aparelho.update({
            where: { id: ap.id },
            data: dataAparelho,
          });

          if (ap.simVinculadoId && ap.simVinculado) {
            await tx.aparelhoHistorico.create({
              data: {
                aparelhoId: ap.simVinculadoId,
                statusAnterior: ap.simVinculado.status,
                statusNovo: novoStatusAparelho,
                observacao: `Pedido ${pedido.codigo} ${dto.status}`,
              },
            });
            await tx.aparelho.update({
              where: { id: ap.simVinculadoId },
              data: { status: novoStatusAparelho },
            });
          }
        }
      }
    });

    return this.findOne(id);
  }

  async updateKitIds(id: number, kitIds: number[]) {
    await this.findOne(id);
    return this.prisma.pedidoRastreador.update({
      where: { id },
      data: { kitIds },
      include: includeBase,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.pedidoRastreador.delete({ where: { id } });
  }
}
