import { usuarioIncludeAuth, usuarioIncludeListagem } from 'src/users/users.prisma-include';

describe('users.prisma-include', () => {
  it('listagem inclui setor e cargoPermissoes sem nested permissao', () => {
    const cargo =
      usuarioIncludeListagem.usuarioCargos &&
      typeof usuarioIncludeListagem.usuarioCargos === 'object' &&
      'include' in usuarioIncludeListagem.usuarioCargos
        ? usuarioIncludeListagem.usuarioCargos.include?.cargo
        : undefined;
    expect(cargo && typeof cargo === 'object' && 'include' in cargo).toBe(
      true,
    );
    if (cargo && typeof cargo === 'object' && 'include' in cargo) {
      expect(cargo.include).toMatchObject({
        setor: true,
        cargoPermissoes: true,
      });
    }
  });

  it('auth inclui permissao dentro de cargoPermissoes', () => {
    const cargo =
      usuarioIncludeAuth.usuarioCargos &&
      typeof usuarioIncludeAuth.usuarioCargos === 'object' &&
      'include' in usuarioIncludeAuth.usuarioCargos
        ? usuarioIncludeAuth.usuarioCargos.include?.cargo
        : undefined;
    expect(cargo && typeof cargo === 'object' && 'include' in cargo).toBe(
      true,
    );
    if (cargo && typeof cargo === 'object' && 'include' in cargo) {
      expect(cargo.include).toEqual({
        cargoPermissoes: { include: { permissao: true } },
      });
    }
  });
});
