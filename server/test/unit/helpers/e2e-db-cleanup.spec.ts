import { PrismaService } from 'src/prisma/prisma.service';
import {
  cleanupE2eRoles,
  cleanupE2eTecnicos,
  e2eRolesCargoCode,
  e2eRolesUserEmail,
} from '../../helpers/e2e-db-cleanup';

describe('cleanupE2eTecnicos', () => {
  it('chama deleteMany com prefixo de nome E2E', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = { tecnico: { deleteMany } } as unknown as PrismaService;

    await cleanupE2eTecnicos(prisma);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { nome: { startsWith: 'E2E' } },
    });
  });
});

describe('cleanupE2eRoles', () => {
  it('remove usuários e cargos criados pelos testes E2E de roles', async () => {
    const usuarioDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const cargoDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      usuario: { deleteMany: usuarioDeleteMany },
      cargo: { deleteMany: cargoDeleteMany },
    } as unknown as PrismaService;

    await cleanupE2eRoles(prisma);

    expect(usuarioDeleteMany).toHaveBeenCalledWith({
      where: { email: { endsWith: '@e2e-roles-nexus.test' } },
    });
    expect(cargoDeleteMany).toHaveBeenCalledWith({
      where: { code: { startsWith: 'E2E_ROLES_CARGO_' } },
    });
  });
});

describe('e2eRoles helpers', () => {
  it('e2eRolesCargoCode prefixa código de cargo', () => {
    expect(e2eRolesCargoCode('abc')).toBe('E2E_ROLES_CARGO_abc');
  });

  it('e2eRolesUserEmail usa sufixo de domínio reservado', () => {
    expect(e2eRolesUserEmail(99)).toBe('e2e_roles_99@e2e-roles-nexus.test');
  });
});
