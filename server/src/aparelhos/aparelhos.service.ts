import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoAparelho, ProprietarioTipo, StatusAparelho, Prisma } from '@prisma/client';

interface CreateLoteDto {
  referencia: string;
  notaFiscal?: string | null;
  dataChegada: string;
  proprietarioTipo: ProprietarioTipo;
  clienteId?: number | null;
  tipo: TipoAparelho;
  marca?: string | null;
  modelo?: string | null;
  operadora?: string | null;
  quantidade: number;
  valorUnitario: number;
  identificadores?: string[];
}

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
        simVinculado: { select: { id: true, identificador: true, operadora: true } },
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
        simVinculado: true,
        historico: { orderBy: { criadoEm: 'desc' } },
      },
    });
    if (!aparelho) throw new NotFoundException('Aparelho não encontrado');
    return aparelho;
  }

  async createLote(dto: CreateLoteDto) {
    const {
      referencia,
      notaFiscal,
      dataChegada,
      proprietarioTipo,
      clienteId,
      tipo,
      marca,
      modelo,
      operadora,
      quantidade,
      valorUnitario,
      identificadores,
    } = dto;

    if (quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }

    const temIdentificadores = identificadores && identificadores.length > 0;
    const qtdFinal = temIdentificadores ? identificadores.length : quantidade;
    const valorTotal = qtdFinal * valorUnitario;

    return this.prisma.$transaction(async (tx) => {
      const lote = await tx.loteAparelho.create({
        data: {
          referencia,
          notaFiscal,
          dataChegada: new Date(dataChegada),
          tipo,
          proprietario: proprietarioTipo,
          clienteId: proprietarioTipo === 'CLIENTE' ? clienteId : null,
          marca: tipo === 'RASTREADOR' ? marca : null,
          modelo: tipo === 'RASTREADOR' ? modelo : null,
          operadora: tipo === 'SIM' ? operadora : null,
          quantidade: qtdFinal,
          valorUnitario,
          valorTotal,
        },
      });

      const aparelhosData: Prisma.AparelhoCreateManyInput[] = [];
      
      if (temIdentificadores) {
        for (const identificador of identificadores) {
          aparelhosData.push({
            tipo,
            identificador,
            status: 'EM_ESTOQUE',
            proprietario: proprietarioTipo,
            clienteId: proprietarioTipo === 'CLIENTE' ? clienteId : null,
            marca: tipo === 'RASTREADOR' ? marca : null,
            modelo: tipo === 'RASTREADOR' ? modelo : null,
            operadora: tipo === 'SIM' ? operadora : null,
            loteId: lote.id,
            valorUnitario,
          });
        }
      } else {
        for (let i = 0; i < quantidade; i++) {
          aparelhosData.push({
            tipo,
            identificador: null,
            status: 'EM_ESTOQUE',
            proprietario: proprietarioTipo,
            clienteId: proprietarioTipo === 'CLIENTE' ? clienteId : null,
            marca: tipo === 'RASTREADOR' ? marca : null,
            modelo: tipo === 'RASTREADOR' ? modelo : null,
            operadora: tipo === 'SIM' ? operadora : null,
            loteId: lote.id,
            valorUnitario,
          });
        }
      }

      await tx.aparelho.createMany({ data: aparelhosData });

      return tx.loteAparelho.findUnique({
        where: { id: lote.id },
        include: {
          aparelhos: true,
          cliente: { select: { id: true, nome: true } },
        },
      });
    });
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
}
