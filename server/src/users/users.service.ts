import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginateParams } from '../common/pagination.helper';
import * as bcrypt from 'bcrypt';
import { SetorUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BCRYPT_SALT_ROUNDS } from './users.constants';
import {
  type UsuarioComAuthInclude,
  usuarioIncludeAuth,
  usuarioIncludeListagem,
} from './users.prisma-include';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeUser<T extends { senhaHash: string }>(
    user: T,
  ): Omit<T, 'senhaHash'> {
    const { senhaHash: _senhaHash, ...rest } = user;
    return rest;
  }

  async findAll() {
    const users = await this.prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      include: usuarioIncludeListagem,
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  async findAllPaginated(params: {
    search?: string;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = paginateParams(params, {
      maxLimit: 100,
      defaultLimit: 15,
    });
    const { search, ativo } = params;

    const where: {
      nome?: { contains: string; mode: 'insensitive' };
      email?: { contains: string; mode: 'insensitive' };
      ativo?: boolean;
      OR?: {
        nome?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }[];
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
        include: usuarioIncludeListagem,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: users.map((u) => this.sanitizeUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: usuarioIncludeListagem,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.sanitizeUser(user);
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email já cadastrado');
    const senhaHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        ativo: dto.ativo ?? true,
        senhaExpiradaEm: null,
        ...(dto.setor !== undefined ? { setor: dto.setor } : {}),
      },
    });
    return this.sanitizeUser(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const exists = await this.prisma.usuario.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (exists) throw new ConflictException('Email já cadastrado');
    }
    const data: {
      nome?: string;
      email?: string;
      ativo?: boolean;
      setor?: SetorUsuario | null;
    } = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    if (dto.setor !== undefined) data.setor = dto.setor;
    const user = await this.prisma.usuario.update({
      where: { id },
      data,
    });
    return this.sanitizeUser(user);
  }

  async resetPassword(id: number) {
    await this.findOne(id);
    const defaultPassword = '#Infinity123';
    const senhaHash = await bcrypt.hash(defaultPassword, BCRYPT_SALT_ROUNDS);
    await this.prisma.usuario.update({
      where: { id },
      data: { senhaHash, senhaExpiradaEm: null },
    });
    return { message: 'Senha resetada com sucesso' };
  }

  async findByIdWithPassword(
    id: number,
  ): Promise<UsuarioComAuthInclude | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: usuarioIncludeAuth,
    });
  }

  async updatePassword(id: number, senhaHash: string, senhaExpiradaEm: Date) {
    await this.prisma.usuario.update({
      where: { id },
      data: { senhaHash, senhaExpiradaEm },
    });
  }

  async findByEmail(email: string): Promise<UsuarioComAuthInclude | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: usuarioIncludeAuth,
    });
  }

  async findById(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: usuarioIncludeListagem,
    });
    return user ? this.sanitizeUser(user) : null;
  }

  getPermissions(user: UsuarioComAuthInclude) {
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
