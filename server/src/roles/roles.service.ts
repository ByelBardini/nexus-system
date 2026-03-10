import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { paginateParams } from '../common/pagination.helper';
import { CategoriaCargo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

interface FindAllParams {
  search?: string;
  categoria?: CategoriaCargo;
  page?: number;
  limit?: number;
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllWithSectors() {
    return this.prisma.cargo.findMany({
      orderBy: [{ setor: { code: 'asc' } }, { code: 'asc' }],
      include: {
        setor: true,
        cargoPermissoes: { include: { permissao: true } },
      },
    });
  }

  async findAllPaginated(params: FindAllParams) {
    const { page, limit, skip } = paginateParams(params, {
      maxLimit: 100,
      defaultLimit: 15,
    });
    const { search, categoria } = params;

    const where: { nome?: { contains: string; mode: 'insensitive' }; categoria?: CategoriaCargo } = {};

    if (search) {
      where.nome = { contains: search, mode: 'insensitive' };
    }

    if (categoria) {
      where.categoria = categoria;
    }

    const [cargos, total] = await Promise.all([
      this.prisma.cargo.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nome: 'asc' }],
        include: {
          setor: true,
          cargoPermissoes: { include: { permissao: true } },
          _count: {
            select: { usuarioCargos: true },
          },
        },
      }),
      this.prisma.cargo.count({ where }),
    ]);

    return {
      data: cargos.map((cargo) => ({
        ...cargo,
        usuariosVinculados: cargo._count.usuarioCargos,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number) {
    const cargo = await this.prisma.cargo.findUnique({
      where: { id },
      include: {
        setor: true,
        cargoPermissoes: { include: { permissao: true } },
        _count: {
          select: { usuarioCargos: true },
        },
      },
    });

    if (!cargo) throw new NotFoundException('Cargo não encontrado');

    return {
      ...cargo,
      usuariosVinculados: cargo._count.usuarioCargos,
    };
  }

  async create(data: CreateRoleDto) {
    const existing = await this.prisma.cargo.findFirst({
      where: { setorId: data.setorId, code: data.code },
    });
    if (existing) {
      throw new ConflictException('Cargo com este código já existe no setor');
    }
    return this.prisma.cargo.create({
      data: {
        nome: data.nome,
        code: data.code,
        setorId: data.setorId,
        descricao: data.descricao,
        categoria: data.categoria ?? 'OPERACIONAL',
        ativo: data.ativo ?? true,
      },
      include: {
        setor: true,
        cargoPermissoes: { include: { permissao: true } },
      },
    });
  }

  async update(id: number, data: UpdateRoleDto) {
    const cargo = await this.prisma.cargo.findUnique({ where: { id } });
    if (!cargo) throw new NotFoundException('Cargo não encontrado');

    return this.prisma.cargo.update({
      where: { id },
      data,
      include: {
        setor: true,
        cargoPermissoes: { include: { permissao: true } },
      },
    });
  }

  async findAllSetores() {
    return this.prisma.setor.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findAllPermissions() {
    return this.prisma.permissao.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async updateRolePermissions(cargoId: number, permissaoIds: number[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.cargoPermissao.deleteMany({ where: { cargoId } });
      if (permissaoIds.length > 0) {
        await tx.cargoPermissao.createMany({
          data: permissaoIds.map((permissaoId) => ({ cargoId, permissaoId })),
        });
      }
    });
    return this.prisma.cargo.findUniqueOrThrow({
      where: { id: cargoId },
      include: { cargoPermissoes: { include: { permissao: true } } },
    });
  }

  async getUserRoles(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { usuarioCargos: { include: { cargo: true } } },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario.usuarioCargos.map((uc) => uc.cargo);
  }

  async updateUserRoles(usuarioId: number, cargoIds: number[]) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.$transaction(async (tx) => {
      await tx.usuarioCargo.deleteMany({ where: { usuarioId } });
      if (cargoIds.length > 0) {
        await tx.usuarioCargo.createMany({
          data: cargoIds.map((cargoId) => ({ usuarioId, cargoId })),
        });
      }
    });
    return this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      include: { usuarioCargos: { include: { cargo: true } } },
    });
  }
}
