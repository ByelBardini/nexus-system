import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { CreateOperadoraDto } from './dto/create-operadora.dto';
import { UpdateOperadoraDto } from './dto/update-operadora.dto';
import { CreateMarcaSimcardDto } from './dto/create-marca-simcard.dto';
import { UpdateMarcaSimcardDto } from './dto/update-marca-simcard.dto';
import { CreatePlanoSimcardDto } from './dto/create-plano-simcard.dto';
import { UpdatePlanoSimcardDto } from './dto/update-plano-simcard.dto';

@Injectable()
export class EquipamentosService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertUnique<T>(
    check: () => Promise<T | null>,
    message: string,
  ): Promise<void> {
    const existing = await check();
    if (existing) throw new ConflictException(message);
  }

  // ============= MARCAS =============

  async findAllMarcas() {
    return this.prisma.marcaEquipamento.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { modelos: true } },
      },
    });
  }

  async findOneMarca(id: number) {
    const marca = await this.prisma.marcaEquipamento.findUnique({
      where: { id },
      include: { modelos: { orderBy: { nome: 'asc' } } },
    });
    if (!marca) throw new NotFoundException('Marca não encontrada');
    return marca;
  }

  async createMarca(dto: CreateMarcaDto) {
    await this.assertUnique(
      () =>
        this.prisma.marcaEquipamento.findUnique({ where: { nome: dto.nome } }),
      'Marca já existe',
    );
    return this.prisma.marcaEquipamento.create({
      data: { nome: dto.nome },
    });
  }

  async updateMarca(id: number, dto: UpdateMarcaDto) {
    await this.findOneMarca(id);
    if (dto.nome) {
      await this.assertUnique(
        () =>
          this.prisma.marcaEquipamento.findFirst({
            where: { nome: dto.nome!, id: { not: id } },
          }),
        'Marca já existe',
      );
    }
    return this.prisma.marcaEquipamento.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMarca(id: number) {
    await this.findOneMarca(id);
    return this.prisma.marcaEquipamento.delete({ where: { id } });
  }

  // ============= MODELOS =============

  async findAllModelos(marcaId?: number) {
    return this.prisma.modeloEquipamento.findMany({
      where: marcaId ? { marcaId } : undefined,
      orderBy: [{ marca: { nome: 'asc' } }, { nome: 'asc' }],
      include: { marca: true },
    });
  }

  async findOneModelo(id: number) {
    const modelo = await this.prisma.modeloEquipamento.findUnique({
      where: { id },
      include: { marca: true },
    });
    if (!modelo) throw new NotFoundException('Modelo não encontrado');
    return modelo;
  }

  async createModelo(dto: CreateModeloDto) {
    const marca = await this.prisma.marcaEquipamento.findUnique({
      where: { id: dto.marcaId },
    });
    if (!marca) throw new NotFoundException('Marca não encontrada');
    await this.assertUnique(
      () =>
        this.prisma.modeloEquipamento.findFirst({
          where: { marcaId: dto.marcaId, nome: dto.nome },
        }),
      'Modelo já existe para esta marca',
    );
    return this.prisma.modeloEquipamento.create({
      data: {
        nome: dto.nome,
        marcaId: dto.marcaId,
        minCaracteresImei: dto.minCaracteresImei ?? null,
      },
      include: { marca: true },
    });
  }

  async updateModelo(id: number, dto: UpdateModeloDto) {
    const modelo = await this.findOneModelo(id);
    if (dto.nome) {
      await this.assertUnique(
        () =>
          this.prisma.modeloEquipamento.findFirst({
            where: {
              marcaId: modelo.marcaId,
              nome: dto.nome!,
              id: { not: id },
            },
          }),
        'Modelo já existe para esta marca',
      );
    }
    return this.prisma.modeloEquipamento.update({
      where: { id },
      data: dto,
      include: { marca: true },
    });
  }

  async deleteModelo(id: number) {
    await this.findOneModelo(id);
    return this.prisma.modeloEquipamento.delete({ where: { id } });
  }

  // ============= OPERADORAS =============

  async findAllOperadoras() {
    return this.prisma.operadora.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findOneOperadora(id: number) {
    const operadora = await this.prisma.operadora.findUnique({
      where: { id },
    });
    if (!operadora) throw new NotFoundException('Operadora não encontrada');
    return operadora;
  }

  async createOperadora(dto: CreateOperadoraDto) {
    await this.assertUnique(
      () => this.prisma.operadora.findUnique({ where: { nome: dto.nome } }),
      'Operadora já existe',
    );
    return this.prisma.operadora.create({
      data: { nome: dto.nome },
    });
  }

  async updateOperadora(id: number, dto: UpdateOperadoraDto) {
    await this.findOneOperadora(id);
    if (dto.nome) {
      await this.assertUnique(
        () =>
          this.prisma.operadora.findFirst({
            where: { nome: dto.nome!, id: { not: id } },
          }),
        'Operadora já existe',
      );
    }
    return this.prisma.operadora.update({
      where: { id },
      data: dto,
    });
  }

  async deleteOperadora(id: number) {
    await this.findOneOperadora(id);
    return this.prisma.operadora.delete({ where: { id } });
  }

  // ============= MARCAS SIMCARD =============

  async findAllMarcasSimcard(operadoraId?: number) {
    return this.prisma.marcaSimcard.findMany({
      where: operadoraId ? { operadoraId } : undefined,
      orderBy: [{ operadora: { nome: 'asc' } }, { nome: 'asc' }],
      include: {
        operadora: true,
        planos: { where: { ativo: true }, orderBy: { planoMb: 'asc' } },
      },
    });
  }

  async findOneMarcaSimcard(id: number) {
    const marca = await this.prisma.marcaSimcard.findUnique({
      where: { id },
      include: { operadora: true, planos: { orderBy: { planoMb: 'asc' } } },
    });
    if (!marca) throw new NotFoundException('Marca de simcard não encontrada');
    return marca;
  }

  async createMarcaSimcard(dto: CreateMarcaSimcardDto) {
    const operadora = await this.prisma.operadora.findUnique({
      where: { id: dto.operadoraId },
    });
    if (!operadora) throw new NotFoundException('Operadora não encontrada');
    await this.assertUnique(
      () =>
        this.prisma.marcaSimcard.findFirst({
          where: { operadoraId: dto.operadoraId, nome: dto.nome },
        }),
      'Marca já existe para esta operadora',
    );
    return this.prisma.marcaSimcard.create({
      data: {
        nome: dto.nome,
        operadoraId: dto.operadoraId,
        temPlanos: dto.temPlanos ?? false,
        minCaracteresIccid: dto.minCaracteresIccid ?? null,
      },
      include: { operadora: true },
    });
  }

  async updateMarcaSimcard(id: number, dto: UpdateMarcaSimcardDto) {
    const marca = await this.findOneMarcaSimcard(id);

    if (dto.operadoraId !== undefined) {
      const operadora = await this.prisma.operadora.findUnique({
        where: { id: dto.operadoraId },
      });
      if (!operadora) throw new NotFoundException('Operadora não encontrada');
    }

    const operadoraIdFinal = dto.operadoraId ?? marca.operadoraId;
    const nomeFinal = dto.nome ?? marca.nome;
    await this.assertUnique(
      () =>
        this.prisma.marcaSimcard.findFirst({
          where: {
            operadoraId: operadoraIdFinal,
            nome: nomeFinal,
            id: { not: id },
          },
        }),
      'Marca já existe para esta operadora',
    );
    return this.prisma.marcaSimcard.update({
      where: { id },
      data: dto,
      include: { operadora: true },
    });
  }

  async deleteMarcaSimcard(id: number) {
    await this.findOneMarcaSimcard(id);
    return this.prisma.marcaSimcard.delete({ where: { id } });
  }

  // ============= PLANOS SIMCARD =============

  async findAllPlanosSimcard(marcaSimcardId?: number) {
    return this.prisma.planoSimcard.findMany({
      where: marcaSimcardId ? { marcaSimcardId } : undefined,
      orderBy: [
        { marcaSimcard: { operadora: { nome: 'asc' } } },
        { marcaSimcard: { nome: 'asc' } },
        { planoMb: 'asc' },
      ],
      include: { marcaSimcard: { include: { operadora: true } } },
    });
  }

  async findOnePlanoSimcard(id: number) {
    const plano = await this.prisma.planoSimcard.findUnique({
      where: { id },
      include: { marcaSimcard: { include: { operadora: true } } },
    });
    if (!plano) throw new NotFoundException('Plano de simcard não encontrado');
    return plano;
  }

  async createPlanoSimcard(dto: CreatePlanoSimcardDto) {
    const marca = await this.prisma.marcaSimcard.findUnique({
      where: { id: dto.marcaSimcardId },
    });
    if (!marca) throw new NotFoundException('Marca de simcard não encontrada');
    await this.assertUnique(
      () =>
        this.prisma.planoSimcard.findUnique({
          where: {
            marcaSimcardId_planoMb: {
              marcaSimcardId: dto.marcaSimcardId,
              planoMb: dto.planoMb,
            },
          },
        }),
      'Plano já existe para esta marca',
    );
    const [plano] = await this.prisma.$transaction([
      this.prisma.planoSimcard.create({
        data: {
          marcaSimcardId: dto.marcaSimcardId,
          planoMb: dto.planoMb,
        },
        include: { marcaSimcard: { include: { operadora: true } } },
      }),
      this.prisma.marcaSimcard.update({
        where: { id: dto.marcaSimcardId },
        data: { temPlanos: true },
      }),
    ]);
    return plano;
  }

  async updatePlanoSimcard(id: number, dto: UpdatePlanoSimcardDto) {
    const plano = await this.findOnePlanoSimcard(id);
    if (dto.planoMb !== undefined) {
      const existing = await this.prisma.planoSimcard.findUnique({
        where: {
          marcaSimcardId_planoMb: {
            marcaSimcardId: plano.marcaSimcardId,
            planoMb: dto.planoMb,
          },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Plano já existe para esta marca');
      }
    }
    return this.prisma.planoSimcard.update({
      where: { id },
      data: dto,
      include: { marcaSimcard: { include: { operadora: true } } },
    });
  }

  async deletePlanoSimcard(id: number) {
    const plano = await this.findOnePlanoSimcard(id);
    const atualizado = await this.prisma.planoSimcard.update({
      where: { id },
      data: { ativo: false },
      include: { marcaSimcard: { include: { operadora: true } } },
    });
    const count = await this.prisma.planoSimcard.count({
      where: { marcaSimcardId: plano.marcaSimcardId, ativo: true },
    });
    if (count === 0) {
      await this.prisma.marcaSimcard.update({
        where: { id: plano.marcaSimcardId },
        data: { temPlanos: false },
      });
    }
    return atualizado;
  }
}
