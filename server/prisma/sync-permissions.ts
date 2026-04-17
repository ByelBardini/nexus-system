/**
 * Sincroniza permissões no banco sem rodar o seed completo.
 * Use quando adicionar novas permissões em permission-codes.ts:
 *
 *   npm run prisma:sync-permissions --prefix server
 */
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

import { PERMISSION_CODES } from './permission-codes';

dotenv.config();

function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  user?: string;
  password?: string;
  database?: string;
} {
  const normalized = url.startsWith('mysql://')
    ? url.replace(/^mysql:\/\//, 'mariadb://')
    : url;
  const parsed = new URL(normalized);
  const database = parsed.pathname
    ? parsed.pathname.replace(/^\//, '').replace(/\/$/, '')
    : undefined;
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    database: database || undefined,
  };
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const poolConfig = parseDatabaseUrl(url);
const adapter = new PrismaMariaDb(poolConfig);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Sincronizando permissões...');

  for (const code of PERMISSION_CODES) {
    await prisma.permissao.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  // Remove permissões obsoletas (não presentes em PERMISSION_CODES)
  const { count: deletedCount } = await prisma.permissao.deleteMany({
    where: { code: { notIn: [...PERMISSION_CODES] } },
  });
  if (deletedCount > 0) {
    console.log(`Permissões obsoletas removidas: ${deletedCount}`);
  }

  const permissoes = await prisma.permissao.findMany();

  const cargosAdmin = await prisma.cargo.findMany({
    where: {
      OR: [{ code: 'ADMIN' }, { nome: { contains: 'Administrador' } }],
    },
  });

  for (const cargo of cargosAdmin) {
    for (const p of permissoes) {
      await prisma.cargoPermissao.upsert({
        where: {
          cargoId_permissaoId: { cargoId: cargo.id, permissaoId: p.id },
        },
        update: {},
        create: { cargoId: cargo.id, permissaoId: p.id },
      });
    }
  }

  console.log(
    `Permissões sincronizadas: ${PERMISSION_CODES.length} códigos, ${cargosAdmin.length} cargos admin atualizados.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
