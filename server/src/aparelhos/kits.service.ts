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
    return this.prisma.aparelho.update({
      where: { id: aparelhoId },
      data: { kitId },
    });
  }

  async getAparelhosDisponiveisParaKit() {
    const where: Prisma.AparelhoWhereInput = {
      tipo: 'RASTREADOR',
      status: 'CONFIGURADO',
      kitId: null,
      clienteId: null,
      tecnicoId: null,
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
}
