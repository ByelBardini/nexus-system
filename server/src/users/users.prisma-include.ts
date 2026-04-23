import { Prisma } from '@prisma/client';

/** Listagem e detalhe admin: cargo com setor e vínculos de permissão. */
export const usuarioIncludeListagem = {
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
} satisfies Prisma.UsuarioInclude;

/** Login e resolução de permissões: inclui entidade `permissao` em cada vínculo. */
export const usuarioIncludeAuth = {
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
} satisfies Prisma.UsuarioInclude;

export type UsuarioComListagemInclude = Prisma.UsuarioGetPayload<{
  include: typeof usuarioIncludeListagem;
}>;

export type UsuarioComAuthInclude = Prisma.UsuarioGetPayload<{
  include: typeof usuarioIncludeAuth;
}>;
