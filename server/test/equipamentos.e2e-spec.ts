import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { EquipamentosModule } from 'src/equipamentos/equipamentos.module';

class AllowAllPermissionsGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('Equipamentos (e2e) — validação de parâmetros', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EquipamentosModule],
    })
      .overrideGuard(PermissionsGuard)
      .useClass(AllowAllPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /equipamentos/marcas/:id com id não numérico retorna 400', async () => {
    const res = await request(app.getHttpServer()).get(
      '/equipamentos/marcas/abc',
    );

    expect(res.status).toBe(400);
  });

  it('GET /equipamentos/modelos?marcaId=xyz retorna 400', async () => {
    const res = await request(app.getHttpServer()).get(
      '/equipamentos/modelos?marcaId=xyz',
    );

    expect(res.status).toBe(400);
  });

  it('GET /equipamentos/modelos sem marcaId permanece 200', async () => {
    const res = await request(app.getHttpServer()).get('/equipamentos/modelos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /equipamentos/planos-simcard?marcaSimcardId=bad retorna 400', async () => {
    const res = await request(app.getHttpServer()).get(
      '/equipamentos/planos-simcard?marcaSimcardId=not-a-number',
    );

    expect(res.status).toBe(400);
  });
});
