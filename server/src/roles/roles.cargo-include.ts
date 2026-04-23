import { Prisma } from '@prisma/client';

export const cargoIncludeSetorEPermissoes =
  Prisma.validator<Prisma.CargoInclude>()({
    setor: true,
    cargoPermissoes: { include: { permissao: true } },
  });

export const cargoIncludeSetorEPermissoesComContagemUsuarios =
  Prisma.validator<Prisma.CargoInclude>()({
    setor: true,
    cargoPermissoes: { include: { permissao: true } },
    _count: {
      select: { usuarioCargos: true },
    },
  });

export const cargoIncludeSomentePermissoes =
  Prisma.validator<Prisma.CargoInclude>()({
    cargoPermissoes: { include: { permissao: true } },
  });
