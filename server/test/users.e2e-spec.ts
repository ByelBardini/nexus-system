import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SetorUsuario } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersModule } from '../src/users/users.module';
import { BCRYPT_SALT_ROUNDS } from '../src/users/users.constants';
import {
  cleanupE2eUsers,
  e2eUsersEmail,
} from './helpers/e2e-db-cleanup';
import * as bcrypt from 'bcrypt';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await cleanupE2eUsers(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users retorna array sem senhaHash e com usuarioCargos', async () => {
    const res = await request(app.getHttpServer()).get('/users');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).not.toHaveProperty('senhaHash');
      expect(res.body[0]).toHaveProperty('usuarioCargos');
      expect(Array.isArray(res.body[0].usuarioCargos)).toBe(true);
    }
  });

  it('GET /users/paginated retorna data, total, page, limit e totalPages', async () => {
    const res = await request(app.getHttpServer()).get(
      '/users/paginated?page=1&limit=2',
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      limit: 2,
      totalPages: expect.any(Number),
    });
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).not.toHaveProperty('senhaHash');
      expect(res.body.data[0]).toHaveProperty('usuarioCargos');
    }
  });

  it('GET /users/paginated aplica filtro ativo', async () => {
    const suffix = `${Date.now()}_ativo`;
    const email = e2eUsersEmail(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: `E2E Ativo ${suffix}`,
        email,
        password: 'abcd',
        ativo: true,
        setor: SetorUsuario.ADMINISTRATIVO,
      });
    expect([200, 201]).toContain(createRes.status);

    const ativos = await request(app.getHttpServer()).get(
      '/users/paginated?ativo=true&limit=100',
    );
    expect(ativos.status).toBe(200);
    expect(
      ativos.body.data.some((u: { email: string }) => u.email === email),
    ).toBe(true);

    const inativos = await request(app.getHttpServer()).get(
      '/users/paginated?ativo=false&limit=200',
    );
    expect(inativos.status).toBe(200);
    expect(
      inativos.body.data.some((u: { email: string }) => u.email === email),
    ).toBe(false);
  });

  it('POST /users cria usuário com setor do enum Prisma e GET /users/:id reflete cargos', async () => {
    const suffix = `${Date.now()}`;
    const email = e2eUsersEmail(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: `E2E User ${suffix}`,
        email,
        password: 'senha-segura',
        ativo: true,
        setor: SetorUsuario.CONFIGURACAO,
      });

    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;
    expect(id).toEqual(expect.any(Number));
    expect(createRes.body).not.toHaveProperty('senhaHash');
    expect(createRes.body.setor).toBe(SetorUsuario.CONFIGURACAO);

    const getRes = await request(app.getHttpServer()).get(`/users/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.email).toBe(email);
    expect(getRes.body).not.toHaveProperty('senhaHash');
    expect(getRes.body).toHaveProperty('usuarioCargos');
    expect(Array.isArray(getRes.body.usuarioCargos)).toBe(true);
  });

  it('POST /users com setor inválido retorna 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'E2E Invalid Enum',
        email: e2eUsersEmail(`inv_${Date.now()}`),
        password: 'abcd',
        setor: 'SETOR_INEXISTENTE',
      });

    expect(res.status).toBe(400);
  });

  it('POST /users com senha curta retorna 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'E2E Short',
        email: e2eUsersEmail(`short_${Date.now()}`),
        password: 'abc',
      });

    expect(res.status).toBe(400);
  });

  it('POST /users com email duplicado retorna 409', async () => {
    const email = e2eUsersEmail(`dup_${Date.now()}`);
    const first = await request(app.getHttpServer()).post('/users').send({
      nome: 'E2E Dup A',
      email,
      password: 'abcd',
    });
    expect([200, 201]).toContain(first.status);

    const second = await request(app.getHttpServer()).post('/users').send({
      nome: 'E2E Dup B',
      email,
      password: 'abcd',
    });
    expect(second.status).toBe(409);
  });

  it('POST /users com setor null persiste setor nulo', async () => {
    const email = e2eUsersEmail(`nullsetor_${Date.now()}`);
    const res = await request(app.getHttpServer()).post('/users').send({
      nome: 'E2E Null Setor',
      email,
      password: 'abcd',
      setor: null,
    });

    expect([200, 201]).toContain(res.status);
    const row = await prisma.usuario.findUnique({ where: { email } });
    expect(row?.setor).toBeNull();
  });

  it('GET /users/:id inexistente retorna 404', async () => {
    const res = await request(app.getHttpServer()).get('/users/999999999');
    expect(res.status).toBe(404);
  });

  it('PATCH /users/:id atualiza campos e rejeita enum inválido', async () => {
    const suffix = `${Date.now()}_patch`;
    const email = e2eUsersEmail(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: `E2E Patch ${suffix}`,
        email,
        password: 'abcd',
        setor: SetorUsuario.AGENDAMENTO,
      });
    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;

    const badEnum = await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .send({ setor: 'INVALIDO' });
    expect(badEnum.status).toBe(400);

    const patchRes = await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .send({
        nome: `E2E Patched ${suffix}`,
        setor: SetorUsuario.ADMINISTRATIVO,
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.nome).toBe(`E2E Patched ${suffix}`);
    expect(patchRes.body.setor).toBe(SetorUsuario.ADMINISTRATIVO);
    expect(patchRes.body).not.toHaveProperty('senhaHash');
  });

  it('PATCH /users/:id com setor null limpa setor no banco', async () => {
    const suffix = `${Date.now()}_nullpatch`;
    const email = e2eUsersEmail(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: `E2E Null Patch ${suffix}`,
        email,
        password: 'abcd',
        setor: SetorUsuario.ADMINISTRATIVO,
      });
    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;

    const patchRes = await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .send({ setor: null });
    expect(patchRes.status).toBe(200);

    const row = await prisma.usuario.findUnique({ where: { id } });
    expect(row?.setor).toBeNull();
  });

  it('PATCH /users/:id com email de outro usuário retorna 409', async () => {
    const t = Date.now();
    const emailA = e2eUsersEmail(`conf_a_${t}`);
    const emailB = e2eUsersEmail(`conf_b_${t}`);
    const a = await request(app.getHttpServer()).post('/users').send({
      nome: 'E2E A',
      email: emailA,
      password: 'abcd',
    });
    const b = await request(app.getHttpServer()).post('/users').send({
      nome: 'E2E B',
      email: emailB,
      password: 'abcd',
    });
    expect([200, 201]).toContain(a.status);
    expect([200, 201]).toContain(b.status);
    const idA = a.body.id as number;

    const conflict = await request(app.getHttpServer())
      .patch(`/users/${idA}`)
      .send({ email: emailB });
    expect(conflict.status).toBe(409);
  });

  it('POST /users/:id/reset-password atualiza hash com custo bcrypt configurado', async () => {
    const email = e2eUsersEmail(`reset_${Date.now()}`);
    const createRes = await request(app.getHttpServer()).post('/users').send({
      nome: 'E2E Reset',
      email,
      password: 'abcd',
    });
    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;

    const before = await prisma.usuario.findUnique({ where: { id } });
    expect(before?.senhaHash).toBeTruthy();

    const resetRes = await request(app.getHttpServer()).post(
      `/users/${id}/reset-password`,
    );
    expect([200, 201]).toContain(resetRes.status);
    expect(resetRes.body).toMatchObject({
      message: 'Senha resetada com sucesso',
    });

    const after = await prisma.usuario.findUnique({ where: { id } });
    expect(after?.senhaHash).not.toBe(before?.senhaHash);
    const rounds = bcrypt.getRounds(after!.senhaHash);
    expect(rounds).toBe(BCRYPT_SALT_ROUNDS);
  });

  it('POST /users/:id/reset-password com id inexistente retorna 404', async () => {
    const res = await request(app.getHttpServer()).post(
      '/users/999999999/reset-password',
    );
    expect(res.status).toBe(404);
  });
});
