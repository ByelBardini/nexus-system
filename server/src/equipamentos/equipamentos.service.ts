import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { CreateOperadoraDto } from './dto/create-operadora.dto';
import { UpdateOperadoraDto } from './dto/update-operadora.dto';

@Injectable()
export class EquipamentosService {
  constructor(private readonly prisma: PrismaService) {}

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
    const existing = await this.prisma.marcaEquipamento.findUnique({
      where: { nome: dto.nome },
    });
    if (existing) throw new ConflictException('Marca já existe');

    return this.prisma.marcaEquipamento.create({
      data: { nome: dto.nome },
    });
  }

  async updateMarca(id: number, dto: UpdateMarcaDto) {
    await this.findOneMarca(id);

    if (dto.nome) {
      const existing = await this.prisma.marcaEquipamento.findFirst({
        where: { nome: dto.nome, id: { not: id } },
      });
      if (existing) throw new ConflictException('Marca já existe');
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

    const existing = await this.prisma.modeloEquipamento.findFirst({
      where: { marcaId: dto.marcaId, nome: dto.nome },
    });
    if (existing) throw new ConflictException('Modelo já existe para esta marca');

    return this.prisma.modeloEquipamento.create({
      data: { nome: dto.nome, marcaId: dto.marcaId },
      include: { marca: true },
    });
  }

  async updateModelo(id: number, dto: UpdateModeloDto) {
    const modelo = await this.findOneModelo(id);

    if (dto.nome) {
      const existing = await this.prisma.modeloEquipamento.findFirst({
        where: { marcaId: modelo.marcaId, nome: dto.nome, id: { not: id } },
      });
      if (existing) throw new ConflictException('Modelo já existe para esta marca');
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
    const existing = await this.prisma.operadora.findUnique({
      where: { nome: dto.nome },
    });
    if (existing) throw new ConflictException('Operadora já existe');

    return this.prisma.operadora.create({
      data: { nome: dto.nome },
    });
  }

  async updateOperadora(id: number, dto: UpdateOperadoraDto) {
    await this.findOneOperadora(id);

    if (dto.nome) {
      const existing = await this.prisma.operadora.findFirst({
        where: { nome: dto.nome, id: { not: id } },
      });
      if (existing) throw new ConflictException('Operadora já existe');
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
}
