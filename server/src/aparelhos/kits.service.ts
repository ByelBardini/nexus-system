import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TipoDestinoPedido } from '@prisma/client';

@Injectable()
export class KitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKitsComDetalhes() {
    const kits = await this.prisma.kit.findMany({
      orderBy: { nome: 'asc' },
      include: {
        aparelhos: {
          select: {
            marca: true,
            modelo: true,
            operadora: true,
            simVinculado: { select: { operadora: true } },
          },
        },
        _count: { select: { aparelhos: true } },
      },
    });
    return kits.map((k) => {
      const marcaModeloSet = new Set<string>();
      const operadoraDisplaySet = new Set<string>();
      const marcaSet = new Set<string>();
      const modeloSet = new Set<string>();
      const operadoraSet = new Set<string>();
      k.aparelhos.forEach((a) => {
        if (a.marca || a.modelo)
          marcaModeloSet.add([a.marca, a.modelo].filter(Boolean).join(' / '));
        if (a.marca) marcaSet.add(a.marca);
        if (a.modelo) modeloSet.add(a.modelo);
        const op = a.simVinculado?.operadora ?? a.operadora;
        if (op) {
          operadoraDisplaySet.add(op);
          operadoraSet.add(op);
        }
      });
      return {
        id: k.id,
        nome: k.nome,
        criadoEm: k.criadoEm,
        kitConcluido: k.kitConcluido,
        quantidade: k._count.aparelhos,
        modelosOperadoras:
          [...marcaModeloSet, ...operadoraDisplaySet]
            .filter(Boolean)
            .join(', ') || '-',
        marcas: Array.from(marcaSet),
        modelos: Array.from(modeloSet),
        operadoras: Array.from(operadoraSet),
      };
    });
  }

  async getKitById(id: number) {
    const kit = await this.prisma.kit.findUnique({
      where: { id },
      include: {
        aparelhos: {
          where: { tipo: 'RASTREADOR' },
          include: {
            simVinculado: { select: { identificador: true, operadora: true } },
            cliente: { select: { id: true, nome: true } },
            tecnico: { select: { id: true, nome: true } },
            kit: { select: { id: true, nome: true } },
          },
        },
      },
    });
    if (!kit) throw new NotFoundException('Kit não encontrado');
    return kit;
  }

  async updateAparelhoKit(aparelhoId: number, kitId: number | null) {
    const aparelho = await this.prisma.aparelho.findUnique({
      where: { id: aparelhoId },
    });
    if (!aparelho) throw new NotFoundException('Aparelho não encontrado');
    if (aparelho.tipo !== 'RASTREADOR') {
      throw new BadRequestException(
        'Apenas rastreadores podem ser adicionados ao kit',
      );
    }
    if (kitId !== null) {
      await this.validarAparelhoParaKit(aparelhoId, kitId);
    }
    return this.prisma.aparelho.update({
      where: { id: aparelhoId },
      data: { kitId },
    });
  }

  async getAparelhosDisponiveisParaKit(params: {
    clienteId?: number;
    clienteIds?: number[];
    includeInfinity?: boolean;
    modeloEquipamentoId?: number;
    marcaEquipamentoId?: number;
    operadoraId?: number;
  }) {
    const {
      clienteId,
      clienteIds,
      includeInfinity,
      modeloEquipamentoId,
      marcaEquipamentoId,
      operadoraId,
    } = params;

    let modeloNome: string | undefined;
    let marcaNome: string | undefined;
    let operadoraNome: string | undefined;

    if (modeloEquipamentoId) {
      const modelo = await this.prisma.modeloEquipamento.findUnique({
        where: { id: modeloEquipamentoId },
        include: { marca: true },
      });
      if (modelo) {
        modeloNome = modelo.nome;
        marcaNome = modelo.marca.nome;
      }
    } else if (marcaEquipamentoId) {
      const marca = await this.prisma.marcaEquipamento.findUnique({
        where: { id: marcaEquipamentoId },
      });
      if (marca) marcaNome = marca.nome;
    }

    if (operadoraId) {
      const operadora = await this.prisma.operadora.findUnique({
        where: { id: operadoraId },
      });
      if (operadora) operadoraNome = operadora.nome;
    }

    const nenhumFiltroCliente =
      !clienteId && !(clienteIds && clienteIds.length > 0) && !includeInfinity;
    const usarFiltroMultiCliente =
      (clienteIds && clienteIds.length > 0) || includeInfinity;
    const clienteWhere: Prisma.AparelhoWhereInput = nenhumFiltroCliente
      ? {}
      : usarFiltroMultiCliente
        ? {
            OR: [
              ...(clienteIds && clienteIds.length > 0
                ? [{ clienteId: { in: clienteIds } }]
                : []),
              ...(includeInfinity ? [{ clienteId: null }] : []),
            ],
          }
        : { clienteId: clienteId ?? null };

    const where: Prisma.AparelhoWhereInput = {
      tipo: 'RASTREADOR',
      status: 'CONFIGURADO',
      kitId: null,
      tecnicoId: null,
      ...(marcaNome ? { marca: marcaNome } : {}),
      ...(modeloNome ? { modelo: modeloNome } : {}),
      ...(operadoraNome ? { simVinculado: { operadora: operadoraNome } } : {}),
      ...clienteWhere,
    };

    return this.prisma.aparelho.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        simVinculado: { select: { identificador: true, operadora: true } },
        cliente: { select: { id: true, nome: true } },
      },
    });
  }

  async criarOuBuscarKitPorNome(nome: string) {
    const trimmed = nome.trim();
    if (!trimmed) return null;
    return this.prisma.kit.upsert({
      where: { nome: trimmed },
      create: { nome: trimmed },
      update: {},
    });
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

  private async getPedidoParaKit(kitId: number) {
    const pedidos = await this.prisma.pedidoRastreador.findMany({
      where: { kitIds: { not: Prisma.DbNull } },
      include: {
        marcaEquipamento: { select: { nome: true } },
        modeloEquipamento: { select: { nome: true } },
        operadora: { select: { nome: true } },
      },
    });
    return (
      pedidos.find((p) => this.extrairKitIds(p.kitIds).includes(kitId)) ?? null
    );
  }

  private aplicarValidacaoPedido(
    pedido: {
      modeloEquipamento: { nome: string } | null;
      marcaEquipamento: { nome: string } | null;
      operadora: { nome: string } | null;
    },
    dados: {
      marca?: string | null;
      modelo?: string | null;
      operadora?: string | null;
    },
  ): void {
    if (pedido.modeloEquipamento) {
      if (dados.modelo !== pedido.modeloEquipamento.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: modelo deve ser "${pedido.modeloEquipamento.nome}"`,
        );
      }
      if (
        pedido.marcaEquipamento &&
        dados.marca !== pedido.marcaEquipamento.nome
      ) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: marca deve ser "${pedido.marcaEquipamento.nome}"`,
        );
      }
    } else if (pedido.marcaEquipamento) {
      if (dados.marca !== pedido.marcaEquipamento.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: marca deve ser "${pedido.marcaEquipamento.nome}"`,
        );
      }
    }

    if (pedido.operadora) {
      if (dados.operadora !== pedido.operadora.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: operadora do SIM deve ser "${pedido.operadora.nome}"`,
        );
      }
    }
  }

  private async validarAparelhoParaKit(
    aparelhoId: number,
    kitId: number,
  ): Promise<void> {
    const pedido = await this.getPedidoParaKit(kitId);
    if (!pedido) return;

    const aparelho = await this.prisma.aparelho.findUnique({
      where: { id: aparelhoId },
      include: { simVinculado: { select: { operadora: true } } },
    });
    if (!aparelho) return;

    this.aplicarValidacaoPedido(pedido, {
      marca: aparelho.marca,
      modelo: aparelho.modelo,
      operadora: aparelho.simVinculado?.operadora ?? null,
    });

    // Pedidos MISTO usam aparelhos de múltiplos proprietários intencionalmente
    if (
      pedido.tipoDestino !== TipoDestinoPedido.MISTO &&
      pedido.deClienteId !== null &&
      aparelho.clienteId !== pedido.deClienteId
    ) {
      throw new BadRequestException(
        `Aparelho não atende ao pedido: deve pertencer ao cliente remetente especificado`,
      );
    }
  }
}
