import { BadGatewayException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { consultarPlaca } from 'api-placa-fipe';
import { CriarOuBuscarVeiculoDto } from './dto/criar-ou-buscar-veiculo.dto';
import { placaNormalizadaOuNull } from './veiculos.helpers';

interface PlacaResultado {
  marca?: string;
  modelo?: string;
  anoModelo?: string | number;
  anoFabricacao?: string | number;
  cor?: string;
  tipoVeiculo?: string;
}

@Injectable()
export class VeiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async criarOuBuscarPorPlaca(dados: CriarOuBuscarVeiculoDto) {
    const raw = placaNormalizadaOuNull(dados.placa);
    if (!raw) return null;
    const anoNum =
      typeof dados.ano === 'string' ? parseInt(dados.ano, 10) : dados.ano;
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
    const raw = placaNormalizadaOuNull(placa);
    if (!raw) return null;
    let resultado: PlacaResultado | null | undefined;
    try {
      resultado = (await consultarPlaca(raw)) as PlacaResultado | null;
    } catch {
      throw new BadGatewayException(
        'Erro ao consultar API de placas. Tente novamente.',
      );
    }
    if (!resultado) return null;
    return {
      marca: resultado.marca ?? '',
      modelo: resultado.modelo ?? '',
      ano: resultado.anoModelo ?? resultado.anoFabricacao ?? '',
      cor: resultado.cor ?? '',
      tipo: resultado.tipoVeiculo ?? '',
    };
  }

  async findAll(search?: string) {
    const where = search?.trim() ? { placa: { contains: search.trim() } } : {};
    return this.prisma.veiculo.findMany({
      where,
      orderBy: { placa: 'asc' },
      take: 50,
    });
  }
}
