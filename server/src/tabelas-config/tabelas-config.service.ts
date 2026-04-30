import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaFalhaDto } from './dto/create-categoria-falha.dto';
import { UpdateCategoriaFalhaDto } from './dto/update-categoria-falha.dto';

@Injectable()
export class TabelasConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async listarCategoriasFalha() {
    return this.prisma.categoriaFalhaRastreador.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async listarCategoriasFalhaAtivas() {
    return this.prisma.categoriaFalhaRastreador.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async criarCategoriaFalha(dto: CreateCategoriaFalhaDto) {
    const existente = await this.prisma.categoriaFalhaRastreador.findUnique({
      where: { nome: dto.nome },
    });
    if (existente) {
      throw new BadRequestException(
        `Categoria de falha "${dto.nome}" já existe`,
      );
    }
    return this.prisma.categoriaFalhaRastreador.create({
      data: {
        nome: dto.nome,
        motivaTexto: dto.motivaTexto ?? false,
      },
    });
  }

  async atualizarCategoriaFalha(id: number, dto: UpdateCategoriaFalhaDto) {
    const categoria = await this.prisma.categoriaFalhaRastreador.findUnique({
      where: { id },
    });
    if (!categoria) {
      throw new NotFoundException(
        `Categoria de falha com id ${id} não encontrada`,
      );
    }
    return this.prisma.categoriaFalhaRastreador.update({
      where: { id },
      data: dto,
    });
  }

  async desativarCategoriaFalha(id: number) {
    const categoria = await this.prisma.categoriaFalhaRastreador.findUnique({
      where: { id },
    });
    if (!categoria) {
      throw new NotFoundException(
        `Categoria de falha com id ${id} não encontrada`,
      );
    }
    return this.prisma.categoriaFalhaRastreador.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
