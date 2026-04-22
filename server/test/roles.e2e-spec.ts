import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { RolesModule } from '../src/roles/roles.module';
import {
  cleanupE2eRoles,
  e2eRolesCargoCode,
  e2eRolesUserEmail,
} from './helpers/e2e-db-cleanup';

describe('Roles (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), RolesModule],
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
    await cleanupE2eRoles(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /roles retorna lista (array) com setor e permissões', async () => {
    const res = await request(app.getHttpServer()).get('/roles');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('setor');
      expect(res.body[0]).toHaveProperty('cargoPermissoes');
    }
  });

  it('GET /roles/paginated retorna data, total, page, limit e totalPages', async () => {
    const res = await request(app.getHttpServer()).get(
      '/roles/paginated?page=1&limit=2',
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      limit: 2,
      totalPages: expect.any(Number),
    });
  });

  it('GET /roles/setores retorna array de setores', async () => {
    const res = await request(app.getHttpServer()).get('/roles/setores');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /roles/permissions retorna array de permissões ordenável por code', async () => {
    const res = await request(app.getHttpServer()).get('/roles/permissions');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 1) {
      const a = res.body[0].code as string;
      const b = res.body[1].code as string;
      expect(a.localeCompare(b)).toBeLessThanOrEqual(0);
    }
  });

  it('POST /roles cria cargo, GET /roles/:id retorna usuariosVinculados, PATCH atualiza', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}`;
    const code = e2eRolesCargoCode(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E Cargo ${suffix}`,
        code,
        setorId: setor!.id,
        descricao: 'e2e',
      });

    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;
    expect(id).toEqual(expect.any(Number));

    const getRes = await request(app.getHttpServer()).get(`/roles/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({
      id,
      code,
      usuariosVinculados: expect.any(Number),
    });

    const patchRes = await request(app.getHttpServer())
      .patch(`/roles/${id}`)
      .send({ nome: `E2E Cargo Atualizado ${suffix}` });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.nome).toBe(`E2E Cargo Atualizado ${suffix}`);
  });

  it('POST /roles com mesmo setorId e code duplicado retorna 409', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}_dup`;
    const code = e2eRolesCargoCode(suffix);
    const body = {
      nome: `E2E Dup ${suffix}`,
      code,
      setorId: setor!.id,
    };

    const first = await request(app.getHttpServer()).post('/roles').send(body);
    expect([200, 201]).toContain(first.status);

    const second = await request(app.getHttpServer()).post('/roles').send(body);
    expect(second.status).toBe(409);
  });

  it('PATCH /roles/:id/permissions substitui vínculos e GET reflete permissões', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}_perm`;
    const code = e2eRolesCargoCode(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E Perm ${suffix}`,
        code,
        setorId: setor!.id,
      });
    expect([200, 201]).toContain(createRes.status);
    const cargoId = createRes.body.id as number;

    const perms = await prisma.permissao.findMany({ take: 2, orderBy: { id: 'asc' } });
    expect(perms.length).toBeGreaterThan(0);
    const ids = perms.map((p) => p.id);

    const patchRes = await request(app.getHttpServer())
      .patch(`/roles/${cargoId}/permissions`)
      .send({ permissionIds: ids });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.cargoPermissoes).toHaveLength(ids.length);

    const getRes = await request(app.getHttpServer()).get(`/roles/${cargoId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.cargoPermissoes.length).toBe(ids.length);

    const clearRes = await request(app.getHttpServer())
      .patch(`/roles/${cargoId}/permissions`)
      .send({ permissionIds: [] });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.cargoPermissoes).toHaveLength(0);
  });

  it('PATCH /roles/:id/permissions sem permissionIds retorna 400', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}_val`;
    const code = e2eRolesCargoCode(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E Val ${suffix}`,
        code,
        setorId: setor!.id,
      });
    expect([200, 201]).toContain(createRes.status);
    const cargoId = createRes.body.id as number;

    const res = await request(app.getHttpServer())
      .patch(`/roles/${cargoId}/permissions`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('PATCH /roles/:id/permissions com permissionIds não numérico retorna 400', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}_nan`;
    const code = e2eRolesCargoCode(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E NaN ${suffix}`,
        code,
        setorId: setor!.id,
      });
    expect([200, 201]).toContain(createRes.status);
    const cargoId = createRes.body.id as number;

    const res = await request(app.getHttpServer())
      .patch(`/roles/${cargoId}/permissions`)
      .send({ permissionIds: [1, 'x'] });

    expect(res.status).toBe(400);
  });

  it('PATCH /roles/:id/permissions com IDs duplicados falha na persistência', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}_dupperm`;
    const code = e2eRolesCargoCode(suffix);
    const createRes = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E DupPerm ${suffix}`,
        code,
        setorId: setor!.id,
      });
    expect([200, 201]).toContain(createRes.status);
    const cargoId = createRes.body.id as number;

    const p = await prisma.permissao.findFirst();
    expect(p).not.toBeNull();

    const res = await request(app.getHttpServer())
      .patch(`/roles/${cargoId}/permissions`)
      .send({ permissionIds: [p!.id, p!.id] });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('GET /roles/users/:userId/roles e PATCH substituem cargos do usuário', async () => {
    const setor = await prisma.setor.findFirst({
      where: { code: 'ADMINISTRATIVO' },
    });
    expect(setor).not.toBeNull();

    const suffix = `${Date.now()}_usr`;
    const codeA = e2eRolesCargoCode(`${suffix}_a`);
    const codeB = e2eRolesCargoCode(`${suffix}_b`);

    const cargoA = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E Usr A ${suffix}`,
        code: codeA,
        setorId: setor!.id,
      });
    const cargoB = await request(app.getHttpServer())
      .post('/roles')
      .send({
        nome: `E2E Usr B ${suffix}`,
        code: codeB,
        setorId: setor!.id,
      });
    expect([200, 201]).toContain(cargoA.status);
    expect([200, 201]).toContain(cargoB.status);

    const idA = cargoA.body.id as number;
    const idB = cargoB.body.id as number;

    const senhaHash = await bcrypt.hash('e2e_roles_pass', 8);
    const user = await prisma.usuario.create({
      data: {
        nome: `E2E User ${suffix}`,
        email: e2eRolesUserEmail(suffix),
        senhaHash,
        ativo: true,
        setor: 'ADMINISTRATIVO',
      },
    });

    const patchRes = await request(app.getHttpServer())
      .patch(`/roles/users/${user.id}/roles`)
      .send({ roleIds: [idA, idB] });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.usuarioCargos).toHaveLength(2);

    const getRes = await request(app.getHttpServer()).get(
      `/roles/users/${user.id}/roles`,
    );
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveLength(2);
    const returnedIds = getRes.body.map((c: { id: number }) => c.id).sort();
    expect(returnedIds).toEqual([idA, idB].sort((a, b) => a - b));

    const clearRes = await request(app.getHttpServer())
      .patch(`/roles/users/${user.id}/roles`)
      .send({ roleIds: [] });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.usuarioCargos).toHaveLength(0);
  });

  it('PATCH /roles/users/:userId/roles sem roleIds retorna 400', async () => {
    const senhaHash = await bcrypt.hash('e2e_roles_pass', 8);
    const suffix = `${Date.now()}_norole`;
    const user = await prisma.usuario.create({
      data: {
        nome: `E2E NoRole ${suffix}`,
        email: e2eRolesUserEmail(suffix),
        senhaHash,
        ativo: true,
        setor: 'ADMINISTRATIVO',
      },
    });

    const res = await request(app.getHttpServer())
      .patch(`/roles/users/${user.id}/roles`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('GET /roles/users/:userId/roles com usuário inexistente retorna 404', async () => {
    const res = await request(app.getHttpServer()).get(
      '/roles/users/999999999/roles',
    );
    expect(res.status).toBe(404);
  });

  it('GET /roles/:id com id inexistente retorna 404', async () => {
    const res = await request(app.getHttpServer()).get('/roles/999999999');
    expect(res.status).toBe(404);
  });

  it('GET /roles/users falha de validação de id numérico (ParseIntPipe)', async () => {
    const res = await request(app.getHttpServer()).get('/roles/users');
    expect(res.status).toBe(400);
  });

  it('GET /roles/:id com id não numérico retorna 400', async () => {
    const res = await request(app.getHttpServer()).get('/roles/abc');
    expect(res.status).toBe(400);
  });
});
