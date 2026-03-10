import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusAparelho } from '@prisma/client';
import { CreateIndividualDto } from './dto/create-individual.dto';

@Injectable()
export class AparelhosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.aparelho.findMany({
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
        historico: {
          orderBy: { criadoEm: 'desc' },
          take: 5,
        },
      },
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

    await this.prisma.aparelhoHistorico.create({
      data: {
        aparelhoId: id,
        statusAnterior: aparelho.status,
        statusNovo: status,
        observacao,
      },
    });

    return this.prisma.aparelho.update({
      where: { id },
      data: { status },
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
