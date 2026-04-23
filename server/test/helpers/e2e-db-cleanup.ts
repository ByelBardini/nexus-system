import { PrismaService } from 'src/prisma/prisma.service';

const PREFIXO_NOME_TECNICO_E2E = 'E2E';

const E2E_ROLES_CARGO_CODE_PREFIX = 'E2E_ROLES_CARGO_';
const E2E_ROLES_USER_EMAIL_SUFFIX = '@e2e-roles-nexus.test';

export async function cleanupE2eTecnicos(prisma: PrismaService): Promise<void> {
  await prisma.tecnico.deleteMany({
    where: { nome: { startsWith: PREFIXO_NOME_TECNICO_E2E } },
  });
}

export function e2eRolesCargoCode(unique: string | number): string {
  return `${E2E_ROLES_CARGO_CODE_PREFIX}${unique}`;
}

export function e2eRolesUserEmail(unique: string | number): string {
  return `e2e_roles_${unique}${E2E_ROLES_USER_EMAIL_SUFFIX}`;
}

export async function cleanupE2eRoles(prisma: PrismaService): Promise<void> {
  await prisma.usuario.deleteMany({
    where: { email: { endsWith: E2E_ROLES_USER_EMAIL_SUFFIX } },
  });
  await prisma.cargo.deleteMany({
    where: { code: { startsWith: E2E_ROLES_CARGO_CODE_PREFIX } },
  });
}

const E2E_USERS_EMAIL_SUFFIX = '@e2e-users-nexus.test';

export function e2eUsersEmail(unique: string | number): string {
  return `e2e_users_${unique}${E2E_USERS_EMAIL_SUFFIX}`;
}

export async function cleanupE2eUsers(prisma: PrismaService): Promise<void> {
  await prisma.usuario.deleteMany({
    where: { email: { endsWith: E2E_USERS_EMAIL_SUFFIX } },
  });
}
