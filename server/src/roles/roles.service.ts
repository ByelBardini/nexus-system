import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
