import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const cwd = process.cwd();

let url: string | undefined = process.env.DATABASE_URL;

if (!url?.startsWith('mysql://')) {
  const envCandidates = [
    path.join(cwd, 'server', '.env'),
    path.join(cwd, '.env'),
  ];
  for (const envPath of envCandidates) {
    if (!fs.existsSync(envPath)) continue;
    dotenv.config({ path: envPath, override: true });
    url = process.env.DATABASE_URL;
    if (!url?.startsWith('mysql://')) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const m = content.match(/mysql:\/\/[^\s"'\r\n#]+/);
      url = m ? m[0].trim() : undefined;
    }
    break;
  }
}

if (!url?.startsWith('mysql://'))
  throw new Error(
    `DATABASE_URL deve ser MySQL. Use: DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"`,
  );

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx ts-node prisma/seed.ts',
  },
  datasource: {
    url,
  },
});
