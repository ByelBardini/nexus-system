import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoAparelho, ProprietarioTipo, Prisma } from '@prisma/client';
import { CreateLoteDto } from './dto/create-lote.dto';

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

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
      marcaSimcardId,
      planoSimcardId,
      quantidade,
      valorUnitario,
      identificadores,
    } = dto;

    if (quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
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
          operadora: tipo === 'SIM' ? operadoraSim : null,
          marcaSimcardId: tipo === 'SIM' ? marcaSimcardId ?? null : null,
          planoSimcardId: tipo === 'SIM' ? planoSimcardId ?? null : null,
          quantidade: qtdFinal,
          valorUnitario,
          valorTotal,
        },
      });

      const aparelhosData: Prisma.AparelhoCreateManyInput[] = [];

      const baseSimData = {
        operadora: operadoraSim,
        marcaSimcardId: marcaSimcardId ?? undefined,
        planoSimcardId: planoSimcardId ?? undefined,
      };

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
            ...(tipo === 'SIM' ? baseSimData : { operadora: null }),
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
            ...(tipo === 'SIM' ? baseSimData : { operadora: null }),
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

  async getLotesParaPareamento(tipo: TipoAparelho) {
    const lotes = await this.prisma.loteAparelho.findMany({
      where: { tipo },
      include: {
        aparelhos: {
          where: { identificador: null, status: 'EM_ESTOQUE' },
          select: { id: true },
        },
      },
    });
    return lotes
      .filter((l) => l.aparelhos.length > 0)
      .map((l) => ({
        id: l.id,
        referencia: l.referencia,
        quantidadeDisponivelSemId: l.aparelhos.length,
        modelo: l.modelo ?? null,
        marca: l.marca ?? null,
        operadora: l.operadora ?? null,
        marcaSimcardId: l.marcaSimcardId ?? null,
      }));
  }
}
