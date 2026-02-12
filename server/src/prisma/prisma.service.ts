import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

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
  const database = parsed.pathname ? parsed.pathname.replace(/^\//, '').replace(/\/$/, '') : undefined;
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    database: database || undefined,
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('DATABASE_URL');
    const poolConfig = parseDatabaseUrl(url);
    const adapter = new PrismaMariaDb(poolConfig);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
