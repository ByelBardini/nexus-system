import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      include: {
        usuarioCargos: {
          include: {
            cargo: {
              include: {
                setor: true,
                cargoPermissoes: true,
              },
            },
          },
        },
      },
    });
    return users.map(({ senhaHash: _, ...u }) => u);
  }

  async findAllPaginated(params: {
    search?: string;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, ativo, page = 1, limit = 15 } = params;
    const skip = (page - 1) * limit;

    const where: {
      nome?: { contains: string; mode: 'insensitive' };
      email?: { contains: string; mode: 'insensitive' };
      ativo?: boolean;
      OR?: { nome?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }[];
    } = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    const [users, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
        include: {
          usuarioCargos: {
            include: {
              cargo: {
                include: {
                  setor: true,
                  cargoPermissoes: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: users.map(({ senhaHash: _, ...u }) => u),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: { usuarioCargos: { include: { cargo: true } } },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const { senhaHash: _, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já cadastrado');
    const senhaHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        ativo: dto.ativo ?? true,
        setor: dto.setor as any,
      },
    });
    const { senhaHash: _, ...rest } = user;
    return rest;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const exists = await this.prisma.usuario.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (exists) throw new ConflictException('Email já cadastrado');
    }
    const data: { nome?: string; email?: string; ativo?: boolean; setor?: any } = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    if (dto.setor !== undefined) data.setor = dto.setor;
    const user = await this.prisma.usuario.update({
      where: { id },
      data,
    });
    const { senhaHash: _, ...rest } = user;
    return rest;
  }

  async resetPassword(id: number) {
    await this.findOne(id);
    const defaultPassword = '#Infinity123';
    const senhaHash = await bcrypt.hash(defaultPassword, 10);
    await this.prisma.usuario.update({
      where: { id },
      data: { senhaHash },
    });
    return { message: 'Senha resetada com sucesso' };
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        usuarioCargos: {
          include: {
            cargo: {
              include: {
                cargoPermissoes: {
                  include: { permissao: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findById(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: {
        usuarioCargos: {
          include: { cargo: true },
        },
      },
    });
  }

  getPermissions(user: NonNullable<Awaited<ReturnType<typeof this.findByEmail>>>) {
    const codes = new Set<string>();
    for (const uc of user.usuarioCargos) {
      for (const cp of uc.cargo.cargoPermissoes) {
        codes.add(cp.permissao.code);
      }
    }
    return Array.from(codes);
  }

  async updateLastLogin(id: number) {
    await this.prisma.usuario.update({
      where: { id },
      data: { ultimoAcesso: new Date() },
    });
  }
}
