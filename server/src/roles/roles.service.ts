import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriaCargo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCargoDto {
  nome: string;
  code: string;
  setorId: number;
  descricao?: string;
  categoria?: CategoriaCargo;
  ativo?: boolean;
}

interface UpdateCargoDto {
  nome?: string;
  descricao?: string;
  categoria?: CategoriaCargo;
  ativo?: boolean;
}

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
    const { search, categoria, page = 1, limit = 15 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.nome = { contains: search };
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

  async create(data: CreateCargoDto) {
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

  async update(id: number, data: UpdateCargoDto) {
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
