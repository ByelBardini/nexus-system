import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoRastreadorDto } from './dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto';
import {
  StatusPedidoRastreador,
  TipoDestinoPedido,
  UrgenciaPedido,
} from '@prisma/client';

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
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(500, Math.max(1, params.limit ?? 500));
    const skip = (page - 1) * limit;

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

  async create(dto: CreatePedidoRastreadorDto, criadoPorId?: number) {
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

    const dataUpdate: { status: StatusPedidoRastreador; entregueEm?: Date } = {
      status: dto.status,
    };
    if (dto.status === StatusPedidoRastreador.ENTREGUE) {
      dataUpdate.entregueEm = new Date();
    }

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
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.pedidoRastreador.delete({ where: { id } });
  }
}
