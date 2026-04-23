import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoRastreadorDto } from './dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto';
import { BulkAparelhoDestinatarioDto } from './dto/bulk-aparelho-destinatario.dto';
import { ORDEM_STATUS_PEDIDO_RASTREADOR } from './pedidos-rastreadores.constants';
import { PEDIDO_RASTREADOR_INCLUDE_BASE } from './pedidos-rastreadores-include';
import { extrairKitIds } from './pedidos-rastreadores-kit-ids.helper';
import {
  resolveNonMistoClienteDestino,
  resolveNonMistoTecnicoDestino,
  resolveTargetClienteId,
} from './pedidos-rastreadores-destino.helpers';
import { PedidosRastreadoresProprietarioDebitoHelper } from './pedidos-rastreadores-proprietario-debito.helper';
import {
  Prisma,
  StatusPedidoRastreador,
  StatusAparelho,
  TipoDestinoPedido,
  UrgenciaPedido,
  ProprietarioTipo,
} from '@prisma/client';
import { paginateParams } from '../common/pagination.helper';

@Injectable()
export class PedidosRastreadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proprietarioDebitoHelper: PedidosRastreadoresProprietarioDebitoHelper,
  ) {}

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
        {
          itens: {
            some: {
              cliente: { nome: { contains: s, mode: 'insensitive' as const } },
            },
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
        include: PEDIDO_RASTREADOR_INCLUDE_BASE,
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
        ...PEDIDO_RASTREADOR_INCLUDE_BASE,
        historico: { orderBy: { criadoEm: 'desc' }, take: 50 },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido de rastreador não encontrado');
    }
    return pedido;
  }

  private static isUniqueConstraintError(e: unknown): boolean {
    return (
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
    );
  }

  async create(dto: CreatePedidoRastreadorDto, criadoPorId?: number) {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.createOnce(dto, criadoPorId);
      } catch (e) {
        if (
          attempt < maxRetries - 1 &&
          PedidosRastreadoresService.isUniqueConstraintError(e)
        ) {
          continue;
        }
        throw e;
      }
    }
    throw new Error('create pedido-rastreador: retries exhausted');
  }

  private async createOnce(
    dto: CreatePedidoRastreadorDto,
    criadoPorId?: number,
  ) {
    const ultimo = await this.prisma.pedidoRastreador.findFirst({
      orderBy: { id: 'desc' },
      select: { codigo: true },
    });
    const seq = ultimo?.codigo
      ? parseInt(ultimo.codigo.replace(/^PED-/i, ''), 10) + 1
      : 1;
    const codigo = `PED-${String(seq).padStart(4, '0')}`;

    const isMisto = dto.tipoDestino === TipoDestinoPedido.MISTO;
    const tecnicoId =
      dto.tipoDestino === TipoDestinoPedido.TECNICO ||
      dto.tipoDestino === TipoDestinoPedido.MISTO
        ? dto.tecnicoId
        : null;
    const clienteId =
      dto.tipoDestino === TipoDestinoPedido.CLIENTE
        ? (dto.clienteId ?? null)
        : null;
    const subclienteId =
      dto.tipoDestino === TipoDestinoPedido.CLIENTE
        ? (dto.subclienteId ?? null)
        : null;
    const quantidade = isMisto
      ? dto.itens!.reduce((s, i) => s + i.quantidade, 0)
      : dto.quantidade!;

    const dataSolicitacao = dto.dataSolicitacao
      ? new Date(dto.dataSolicitacao)
      : new Date();
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
        quantidade,
        urgencia: dto.urgencia ?? UrgenciaPedido.MEDIA,
        dataSolicitacao,
        marcaEquipamentoId,
        modeloEquipamentoId,
        operadoraId,
        criadoPorId,
        observacao: dto.observacao,
        ...(isMisto &&
          dto.itens && {
            itens: {
              create: dto.itens.map((item) => ({
                proprietario: item.proprietario,
                clienteId:
                  item.proprietario === 'CLIENTE'
                    ? (item.clienteId ?? null)
                    : null,
                quantidade: item.quantidade,
                marcaEquipamentoId: item.marcaEquipamentoId ?? null,
                modeloEquipamentoId: item.modeloEquipamentoId ?? null,
                operadoraId: item.operadoraId ?? null,
              })),
            },
          }),
      },
      include: PEDIDO_RASTREADOR_INCLUDE_BASE,
    });
  }

  async bulkSetDestinatarios(
    pedidoId: number,
    dto: BulkAparelhoDestinatarioDto,
  ) {
    const pedido = await this.prisma.pedidoRastreador.findUnique({
      where: { id: pedidoId },
      include: {
        itens: { include: { cliente: { select: { id: true, nome: true } } } },
      },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    const { destinatarioProprietario, destinatarioClienteId: clienteIdRaw } =
      dto;
    const destinatarioClienteId = clienteIdRaw ?? null;

    const item = pedido.itens.find(
      (i) =>
        i.proprietario === destinatarioProprietario &&
        (destinatarioProprietario === ProprietarioTipo.INFINITY
          ? true
          : i.clienteId === destinatarioClienteId),
    );
    if (!item) {
      throw new BadRequestException(
        'Destinatário não encontrado nos itens do pedido',
      );
    }

    const jaAtribuidos = await this.prisma.pedidoRastreadorAparelho.count({
      where: {
        pedidoRastreadorId: pedidoId,
        destinatarioProprietario,
        destinatarioClienteId,
        aparelhoId: { notIn: dto.aparelhoIds },
      },
    });

    if (jaAtribuidos + dto.aparelhoIds.length > item.quantidade) {
      throw new BadRequestException(
        `Quota excedida: máximo ${item.quantidade} rastreadores para este destinatário, já atribuídos: ${jaAtribuidos}`,
      );
    }

    for (const aparelhoId of dto.aparelhoIds) {
      await this.prisma.pedidoRastreadorAparelho.upsert({
        where: {
          pedidoRastreadorId_aparelhoId: {
            pedidoRastreadorId: pedidoId,
            aparelhoId,
          },
        },
        create: {
          pedidoRastreadorId: pedidoId,
          aparelhoId,
          destinatarioProprietario,
          destinatarioClienteId,
        },
        update: { destinatarioProprietario, destinatarioClienteId },
      });
    }
  }

  async getAparelhosDestinatarios(pedidoId: number) {
    const pedido = await this.prisma.pedidoRastreador.findUnique({
      where: { id: pedidoId },
      include: {
        itens: { include: { cliente: { select: { id: true, nome: true } } } },
        aparelhosDestinatarios: true,
      },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    const assignments = pedido.aparelhosDestinatarios.map((a) => ({
      aparelhoId: a.aparelhoId,
      destinatarioProprietario: a.destinatarioProprietario,
      destinatarioClienteId: a.destinatarioClienteId,
    }));

    const quotaUsage = pedido.itens.map((item) => {
      const atribuido = pedido.aparelhosDestinatarios.filter(
        (a) =>
          a.destinatarioProprietario === item.proprietario &&
          a.destinatarioClienteId === item.clienteId,
      ).length;
      return {
        proprietario: item.proprietario,
        clienteId: item.clienteId,
        clienteNome:
          item.proprietario === ProprietarioTipo.INFINITY
            ? 'Infinity'
            : (item.cliente?.nome ?? null),
        atribuido,
        total: item.quantidade,
      };
    });

    return { assignments, quotaUsage };
  }

  async removeAparelhoDestinatario(pedidoId: number, aparelhoId: number) {
    await this.prisma.pedidoRastreadorAparelho.deleteMany({
      where: { pedidoRastreadorId: pedidoId, aparelhoId },
    });
  }

  async updateStatus(id: number, dto: UpdateStatusPedidoDto) {
    const pedido = await this.findOne(id);
    const statusAnterior = pedido.status;
    if (statusAnterior === dto.status) return this.findOne(id);

    const indiceAnterior =
      ORDEM_STATUS_PEDIDO_RASTREADOR.indexOf(statusAnterior);
    const indiceNovo = ORDEM_STATUS_PEDIDO_RASTREADOR.indexOf(dto.status);
    if (
      statusAnterior === StatusPedidoRastreador.DESPACHADO &&
      indiceNovo < indiceAnterior
    ) {
      throw new BadRequestException(
        'Não é possível retroceder um pedido que já foi despachado.',
      );
    }

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
    // Nota: statusAnterior === DESPACHADO já foi bloqueado acima (throw), então
    // a única transição válida que reseta equipamentos é ENTREGUE → CONFIGURADO.
    const novoStatusAparelho: StatusAparelho | null =
      dto.status === StatusPedidoRastreador.DESPACHADO
        ? StatusAparelho.DESPACHADO
        : dto.status === StatusPedidoRastreador.ENTREGUE
          ? StatusAparelho.COM_TECNICO
          : statusAnterior === StatusPedidoRastreador.ENTREGUE &&
              dto.status === StatusPedidoRastreador.CONFIGURADO
            ? StatusAparelho.CONFIGURADO
            : null;

    let kitIds: number[] =
      dto.kitIds && dto.kitIds.length > 0
        ? dto.kitIds.map((id) => Number(id))
        : [];

    if (kitIds.length === 0 && novoStatusAparelho !== null) {
      kitIds = extrairKitIds(pedido.kitIds);
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

    const kitIdsAntigos = extrairKitIds(pedido.kitIds);

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
        (dto.status === StatusPedidoRastreador.SOLICITADO ||
          dto.status === StatusPedidoRastreador.EM_CONFIGURACAO) &&
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
          outrosPedidos.flatMap((p) => extrairKitIds(p.kitIds)),
        );
        for (const kitId of kitIdsAntigos) {
          if (!kitIdsAindaEmUso.has(kitId)) {
            await tx.kit.update({
              where: { id: kitId },
              data: { kitConcluido: false },
            });
          }
        }
      }

      if (novoStatusAparelho && kitIds.length > 0) {
        const aparelhos = await tx.aparelho.findMany({
          where: { kitId: { in: kitIds }, tipo: 'RASTREADOR' },
          select: {
            id: true,
            status: true,
            simVinculadoId: true,
            simVinculado: { select: { id: true, status: true } },
            proprietario: true,
            clienteId: true,
            marca: true,
            modelo: true,
          },
        });

        // Para pedidos MISTO na entrega: validar que todos os aparelhos têm destinatário definido
        type AssignmentMap = Map<
          number,
          {
            destinatarioProprietario: ProprietarioTipo;
            destinatarioClienteId: number | null;
          }
        >;
        let mistoAssignmentsMap: AssignmentMap | null = null;

        if (
          pedido.tipoDestino === TipoDestinoPedido.MISTO &&
          (novoStatusAparelho === StatusAparelho.COM_TECNICO ||
            novoStatusAparelho === StatusAparelho.DESPACHADO)
        ) {
          const assignments = await tx.pedidoRastreadorAparelho.findMany({
            where: { pedidoRastreadorId: id },
          });
          const assignedIds = new Set(assignments.map((a) => a.aparelhoId));
          const semDestinatario = aparelhos.filter(
            (ap) => !assignedIds.has(ap.id),
          );
          if (semDestinatario.length > 0) {
            throw new BadRequestException(
              `${semDestinatario.length} aparelho(s) sem destinatário definido. Atribua um cliente a todos os rastreadores antes de entregar.`,
            );
          }
          mistoAssignmentsMap = new Map(
            assignments.map((a) => [
              a.aparelhoId,
              {
                destinatarioProprietario: a.destinatarioProprietario,
                destinatarioClienteId: a.destinatarioClienteId,
              },
            ]),
          );
        }

        // Destino não-MISTO para detecção de dívidas no DESPACHADO e COM_TECNICO
        let nonMistoDestino: {
          proprietario: ProprietarioTipo;
          clienteId: number | null;
        } | null = null;

        if (
          pedido.tipoDestino !== TipoDestinoPedido.MISTO &&
          (novoStatusAparelho === StatusAparelho.DESPACHADO ||
            novoStatusAparelho === StatusAparelho.COM_TECNICO)
        ) {
          if (pedido.tipoDestino === TipoDestinoPedido.CLIENTE) {
            nonMistoDestino = resolveNonMistoClienteDestino(pedido);
          } else if (pedido.tipoDestino === TipoDestinoPedido.TECNICO) {
            nonMistoDestino = resolveNonMistoTecnicoDestino(
              dto.deClienteId,
              pedido.deClienteId,
            );
          }
        }

        // Dados compartilhados para pedidos não-MISTO
        const sharedDataAparelho: {
          status: StatusAparelho;
          tecnicoId?: number | null;
          clienteId?: number | null;
          proprietario?: ProprietarioTipo;
        } = { status: novoStatusAparelho };

        if (
          novoStatusAparelho === StatusAparelho.COM_TECNICO &&
          !mistoAssignmentsMap
        ) {
          if (pedido.tipoDestino === TipoDestinoPedido.CLIENTE) {
            const targetClienteId = resolveTargetClienteId(pedido);
            sharedDataAparelho.clienteId = targetClienteId ?? null;
            sharedDataAparelho.tecnicoId = null;
            sharedDataAparelho.proprietario = targetClienteId
              ? ProprietarioTipo.CLIENTE
              : ProprietarioTipo.INFINITY;
          } else {
            const tev = resolveNonMistoTecnicoDestino(
              dto.deClienteId,
              pedido.deClienteId,
            );
            sharedDataAparelho.tecnicoId = pedido.tecnicoId ?? null;
            sharedDataAparelho.clienteId = tev.clienteId;
            sharedDataAparelho.proprietario = tev.proprietario;
          }
        } else if (
          novoStatusAparelho === StatusAparelho.CONFIGURADO ||
          novoStatusAparelho === StatusAparelho.DESPACHADO
        ) {
          sharedDataAparelho.tecnicoId = null;
          sharedDataAparelho.clienteId = null;
        }

        const marcaModeloCache = new Map<
          string,
          { marcaId: number; modeloId: number } | null
        >();

        for (const ap of aparelhos) {
          let dataAparelho = sharedDataAparelho;

          if (mistoAssignmentsMap) {
            const assignment = mistoAssignmentsMap.get(ap.id)!;
            const destProprietario = assignment.destinatarioProprietario;
            const destClienteId = assignment.destinatarioClienteId;

            await this.proprietarioDebitoHelper.consolidarDebitoSeProprietarioMudou(
              tx,
              marcaModeloCache,
              {
                ap: {
                  marca: ap.marca,
                  modelo: ap.modelo,
                  proprietario: ap.proprietario,
                  clienteId: ap.clienteId,
                },
                destProprietario,
                destClienteId,
                pedidoId: pedido.id,
              },
            );

            dataAparelho = {
              status: novoStatusAparelho,
              proprietario: destProprietario,
              clienteId: destClienteId,
              tecnicoId:
                novoStatusAparelho === StatusAparelho.COM_TECNICO
                  ? (pedido.tecnicoId ?? null)
                  : null,
            };
          } else if (nonMistoDestino) {
            const { proprietario: destProprietario, clienteId: destClienteId } =
              nonMistoDestino;
            const srcProprietario = ap.proprietario;
            const srcClienteId = ap.clienteId;
            const proprietarioMudou =
              srcProprietario !== destProprietario ||
              srcClienteId !== destClienteId;

            await this.proprietarioDebitoHelper.consolidarDebitoSeProprietarioMudou(
              tx,
              marcaModeloCache,
              {
                ap: {
                  marca: ap.marca,
                  modelo: ap.modelo,
                  proprietario: ap.proprietario,
                  clienteId: ap.clienteId,
                },
                destProprietario,
                destClienteId,
                pedidoId: pedido.id,
              },
            );
            // DESPACHADO: transfere ownership (mesma condição de antes: exige marca/modelo no aparelho)
            if (
              proprietarioMudou &&
              ap.marca &&
              ap.modelo &&
              novoStatusAparelho === StatusAparelho.DESPACHADO
            ) {
              dataAparelho = {
                status: novoStatusAparelho,
                proprietario: destProprietario,
                clienteId: destClienteId,
                tecnicoId: null,
              };
            }
          }

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
      include: PEDIDO_RASTREADOR_INCLUDE_BASE,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.pedidoRastreador.delete({ where: { id } });
  }
}
