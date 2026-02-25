import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';

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
  // Setores
  const setorAgendamento = await prisma.setor.upsert({
    where: { code: 'AGENDAMENTO' },
    update: {},
    create: { code: 'AGENDAMENTO', nome: 'Agendamento' },
  });
  const setorConfig = await prisma.setor.upsert({
    where: { code: 'CONFIG' },
    update: {},
    create: { code: 'CONFIG', nome: 'Configuração' },
  });

  // Permissões: LISTAR, CRIAR, EDITAR, EXCLUIR para cada área
  const permissionCodes = [
    'CONFIG.USUARIO.LISTAR',
    'CONFIG.USUARIO.CRIAR',
    'CONFIG.USUARIO.EDITAR',
    'CONFIG.USUARIO.EXCLUIR',
    'CONFIG.CARGO.LISTAR',
    'CONFIG.CARGO.CRIAR',
    'CONFIG.CARGO.EDITAR',
    'CONFIG.CARGO.EXCLUIR',
    'AGENDAMENTO.CLIENTE.LISTAR',
    'AGENDAMENTO.CLIENTE.CRIAR',
    'AGENDAMENTO.CLIENTE.EDITAR',
    'AGENDAMENTO.CLIENTE.EXCLUIR',
    'AGENDAMENTO.TECNICO.LISTAR',
    'AGENDAMENTO.TECNICO.CRIAR',
    'AGENDAMENTO.TECNICO.EDITAR',
    'AGENDAMENTO.TECNICO.EXCLUIR',
    'AGENDAMENTO.OS.LISTAR',
    'AGENDAMENTO.OS.CRIAR',
    'AGENDAMENTO.OS.EDITAR',
    'AGENDAMENTO.OS.EXCLUIR',
  ];

  for (const code of permissionCodes) {
    await prisma.permissao.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  const permissoes = await prisma.permissao.findMany();

  // Cargo admin no setor CONFIG com todas as permissões
  const cargoAdmin = await prisma.cargo.upsert({
    where: { setorId_code: { setorId: setorConfig.id, code: 'ADMIN' } },
    update: {},
    create: {
      setorId: setorConfig.id,
      code: 'ADMIN',
      nome: 'Administrador',
    },
  });

  // Vincular todas as permissões ao cargo admin
  for (const p of permissoes) {
    await prisma.cargoPermissao.upsert({
      where: {
        cargoId_permissaoId: { cargoId: cargoAdmin.id, permissaoId: p.id },
      },
      update: {},
      create: { cargoId: cargoAdmin.id, permissaoId: p.id },
    });
  }

  // Usuário admin
  const senhaHash = await bcrypt.hash('12345', 10);
  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@admin.com' },
    update: { senhaHash },
    create: {
      nome: 'Administrador',
      email: 'admin@admin.com',
      senhaHash,
      ativo: true,
    },
  });

  await prisma.usuarioCargo.upsert({
    where: { usuarioId_cargoId: { usuarioId: usuarioAdmin.id, cargoId: cargoAdmin.id } },
    update: {},
    create: { usuarioId: usuarioAdmin.id, cargoId: cargoAdmin.id },
  });

  console.log('Seed concluído: admin@admin.com / 12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
