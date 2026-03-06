import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { consultarPlaca } from 'api-placa-fipe';

function normalizarPlaca(placa: string): string {
  return placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
}

@Injectable()
export class VeiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async criarOuBuscarPorPlaca(dados: {
    placa: string;
    marca: string;
    modelo: string;
    ano?: string | number;
    cor?: string;
  }) {
    const raw = normalizarPlaca(dados.placa);
    if (raw.length < 7) return null;
    const anoNum = dados.ano ? (typeof dados.ano === 'string' ? parseInt(dados.ano, 10) : dados.ano) : null;
    const existing = await this.prisma.veiculo.findUnique({
      where: { placa: raw },
    });
    if (existing) return existing;
    return this.prisma.veiculo.create({
      data: {
        placa: raw,
        marca: dados.marca || 'Não informado',
        modelo: dados.modelo || 'Não informado',
        ano: Number.isNaN(anoNum) || anoNum == null ? null : anoNum,
        cor: dados.cor || null,
      },
    });
  }

  async consultaPlaca(placa: string) {
    const raw = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)
    if (raw.length < 7) return null
    const resultado = await consultarPlaca(raw)
    if (!resultado) return null
    return {
      marca: resultado.marca ?? '',
      modelo: resultado.modelo ?? '',
      ano: resultado.anoModelo ?? resultado.anoFabricacao ?? '',
      cor: resultado.cor ?? '',
      tipo: resultado.tipoVeiculo ?? '',
    }
  }

  async findAll(search?: string) {
    const where = search?.trim()
      ? { placa: { contains: search.trim() } }
      : {};
    return this.prisma.veiculo.findMany({
      where,
      orderBy: { placa: 'asc' },
      take: 50,
    });
  }
}
