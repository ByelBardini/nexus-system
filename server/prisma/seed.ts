import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';

import { CLIENTE_INFINITY_ID } from '../src/common/constants';
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
  // Setores
  const setorAgendamento = await prisma.setor.upsert({
    where: { code: 'AGENDAMENTO' },
    update: {},
    create: { code: 'AGENDAMENTO', nome: 'Agendamento & Ordens' },
  });
  const setorAdmin = await prisma.setor.upsert({
    where: { code: 'ADMINISTRATIVO' },
    update: {},
    create: { code: 'ADMINISTRATIVO', nome: 'Administrativo' },
  });
  const setorConfig = await prisma.setor.upsert({
    where: { code: 'CONFIGURACAO' },
    update: {},
    create: { code: 'CONFIGURACAO', nome: 'Configuração' },
  });

  for (const code of PERMISSION_CODES) {
    await prisma.permissao.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  const permissoes = await prisma.permissao.findMany();

  // Cargo admin no setor ADMINISTRATIVO com todas as permissões
  const cargoAdmin = await prisma.cargo.upsert({
    where: { setorId_code: { setorId: setorAdmin.id, code: 'ADMIN' } },
    update: {
      categoria: 'ADMINISTRATIVO',
      descricao: 'Cargo administrativo com todas as permissões',
    },
    create: {
      setorId: setorAdmin.id,
      code: 'ADMIN',
      nome: 'Administrador',
      categoria: 'ADMINISTRATIVO',
      descricao: 'Cargo administrativo com todas as permissões',
    },
  });

  // Vincular todas as permissões ao cargo admin criado
  for (const p of permissoes) {
    await prisma.cargoPermissao.upsert({
      where: {
        cargoId_permissaoId: { cargoId: cargoAdmin.id, permissaoId: p.id },
      },
      update: {},
      create: { cargoId: cargoAdmin.id, permissaoId: p.id },
    });
  }

  // Vincular todas as permissões a TODOS os cargos admin existentes (qualquer setor)
  const todosCargosAdmin = await prisma.cargo.findMany({
    where: {
      OR: [
        { code: 'ADMIN' },
        { nome: { contains: 'Administrador' } },
      ],
    },
  });

  for (const cargo of todosCargosAdmin) {
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

  // Cliente Infinity (empresa dona do sistema, ID fixo) - usado em ordens no modo Infinity
  // Não aparece na lista de Empresas (excluído em ClientesService.findAll)
  const existe = await prisma.cliente.findUnique({
    where: { id: CLIENTE_INFINITY_ID },
  });
  if (!existe) {
    await prisma.$executeRaw`
      INSERT INTO clientes (id, nome, nome_fantasia, tipo_contrato, estoque_proprio, status)
      VALUES (${CLIENTE_INFINITY_ID}, 'Infinity', 'Infinity', 'COMODATO', 0, 'ATIVO')
      ON DUPLICATE KEY UPDATE nome = 'Infinity', nome_fantasia = 'Infinity'
    `;
    console.log('Cliente Infinity (id 999999) criado');
  }

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
