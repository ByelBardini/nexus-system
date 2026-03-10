import { BadGatewayException, Injectable } from '@nestjs/common';
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
    ano: string | number;
    cor: string;
  }) {
    const raw = normalizarPlaca(dados.placa);
    if (raw.length < 7) return null;
    const anoNum = typeof dados.ano === 'string' ? parseInt(dados.ano, 10) : dados.ano;
    const ano = Number.isNaN(anoNum) ? 0 : anoNum;
    return this.prisma.veiculo.upsert({
      where: { placa: raw },
      create: {
        placa: raw,
        marca: dados.marca.trim(),
        modelo: dados.modelo.trim(),
        ano,
        cor: dados.cor.trim(),
      },
      update: {},
    });
  }

  async consultaPlaca(placa: string) {
    const raw = normalizarPlaca(placa);
    if (raw.length < 7) return null;
    let resultado;
    try {
      resultado = await consultarPlaca(raw);
    } catch {
      throw new BadGatewayException('Erro ao consultar API de placas. Tente novamente.');
    }
    if (!resultado) return null;
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
