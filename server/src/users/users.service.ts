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
      include: { usuarioCargos: { include: { cargo: { include: { setor: true } } } } },
    });
    return users.map(({ senhaHash: _, ...u }) => u);
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
    const data: { nome?: string; email?: string; senhaHash?: string; ativo?: boolean } = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    if (dto.password) data.senhaHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.usuario.update({
      where: { id },
      data,
    });
    const { senhaHash: _, ...rest } = user;
    return rest;
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
}
