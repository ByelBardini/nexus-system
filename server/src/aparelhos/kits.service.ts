import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class KitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKits() {
    const kits = await this.prisma.kit.findMany({
      where: { kitConcluido: false },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });
    return kits;
  }

  async getKitsComDetalhes() {
    const kits = await this.prisma.kit.findMany({
      orderBy: { nome: 'asc' },
      include: {
        aparelhos: {
          select: { marca: true, modelo: true, operadora: true },
        },
        _count: { select: { aparelhos: true } },
      },
    });
    return kits.map((k) => {
      const modelos = new Set<string>();
      const operadoras = new Set<string>();
      k.aparelhos.forEach((a) => {
        if (a.marca || a.modelo) modelos.add([a.marca, a.modelo].filter(Boolean).join(' / '));
        if (a.operadora) operadoras.add(a.operadora);
      });
      return {
        id: k.id,
        nome: k.nome,
        criadoEm: k.criadoEm,
        kitConcluido: k.kitConcluido,
        quantidade: k._count.aparelhos,
        modelosOperadoras:
          [...modelos, ...operadoras].filter(Boolean).join(', ') || '-',
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
      throw new BadRequestException('Apenas rastreadores podem ser adicionados ao kit');
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
    modeloEquipamentoId?: number;
    marcaEquipamentoId?: number;
    operadoraId?: number;
  }) {
    const { clienteId, modeloEquipamentoId, marcaEquipamentoId, operadoraId } = params;

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

    const where: Prisma.AparelhoWhereInput = {
      tipo: 'RASTREADOR',
      status: 'CONFIGURADO',
      kitId: null,
      clienteId: clienteId ?? null,
      tecnicoId: null,
      ...(marcaNome ? { marca: marcaNome } : {}),
      ...(modeloNome ? { modelo: modeloNome } : {}),
      ...(operadoraNome ? { simVinculado: { operadora: operadoraNome } } : {}),
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
    return pedidos.find((p) => this.extrairKitIds(p.kitIds).includes(kitId)) ?? null;
  }

  private async validarAparelhoParaKit(aparelhoId: number, kitId: number): Promise<void> {
    const pedido = await this.getPedidoParaKit(kitId);
    if (!pedido) return;

    const aparelho = await this.prisma.aparelho.findUnique({
      where: { id: aparelhoId },
      include: { simVinculado: { select: { operadora: true } } },
    });
    if (!aparelho) return;

    if (pedido.modeloEquipamento) {
      if (aparelho.modelo !== pedido.modeloEquipamento.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: modelo deve ser "${pedido.modeloEquipamento.nome}"`,
        );
      }
      if (pedido.marcaEquipamento && aparelho.marca !== pedido.marcaEquipamento.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: marca deve ser "${pedido.marcaEquipamento.nome}"`,
        );
      }
    } else if (pedido.marcaEquipamento) {
      if (aparelho.marca !== pedido.marcaEquipamento.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: marca deve ser "${pedido.marcaEquipamento.nome}"`,
        );
      }
    }

    if (pedido.operadora) {
      const simOperadora = aparelho.simVinculado?.operadora ?? null;
      if (simOperadora !== pedido.operadora.nome) {
        throw new BadRequestException(
          `Aparelho não atende ao pedido: operadora do SIM deve ser "${pedido.operadora.nome}"`,
        );
      }
    }

    if (pedido.deClienteId !== null && aparelho.clienteId !== pedido.deClienteId) {
      throw new BadRequestException(
        `Aparelho não atende ao pedido: deve pertencer ao cliente remetente especificado`,
      );
    }
  }
}
