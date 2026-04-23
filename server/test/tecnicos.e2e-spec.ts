import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { GeocodingService } from '../src/common/geocoding/geocoding.service';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { TecnicosModule } from '../src/tecnicos/tecnicos.module';
import { cleanupE2eTecnicos } from './helpers/e2e-db-cleanup';

class BlockTecnicosPostPermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      method: string;
      path?: string;
    }>();
    const path = req.path ?? '';
    if (req.method === 'POST' && path === '/tecnicos') {
      throw new ForbiddenException('Sem permissão para esta ação');
    }
    return true;
  }
}

describe('Tecnicos (e2e)', () => {
  let app: INestApplication<App>;
  let geocodeMock: jest.Mock;

  beforeAll(async () => {
    geocodeMock = jest.fn();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), TecnicosModule],
    })
      .overrideProvider(GeocodingService)
      .useValue({ geocode: geocodeMock })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await cleanupE2eTecnicos(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    geocodeMock.mockReset();
  });

  it('GET /tecnicos retorna lista com campos de coordenadas', async () => {
    const res = await request(app.getHttpServer()).get('/tecnicos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('latitude');
      expect(res.body[0]).toHaveProperty('longitude');
      expect(res.body[0]).toHaveProperty('geocodingPrecision');
    }
  });

  it('POST /tecnicos com endereço chama geocode e persiste coords no retorno', async () => {
    geocodeMock.mockResolvedValue({
      lat: -23.55,
      lng: -46.63,
      precision: 'EXATO',
    });
    const suffix = Date.now();
    const res = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E Técnico ${suffix}`,
        cpfCnpj: `${suffix}`,
        cep: '01310-100',
        logradouro: 'Av Paulista',
        numero: '1000',
        cidadeEndereco: 'São Paulo',
        estadoEndereco: 'SP',
        precos: {
          instalacaoComBloqueio: 0,
          instalacaoSemBloqueio: 0,
          revisao: 0,
          retirada: 0,
          deslocamento: 0,
        },
      });

    expect([200, 201]).toContain(res.status);
    expect(geocodeMock).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      latitude: expect.anything(),
      longitude: expect.anything(),
      geocodingPrecision: 'EXATO',
    });
  });

  it('POST /tecnicos com geocode null mantém latitude nula', async () => {
    geocodeMock.mockResolvedValue(null);
    const suffix = Date.now() + 1;
    const res = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E Sem Geo ${suffix}`,
        cidadeEndereco: 'Nowhere',
        estadoEndereco: 'SP',
        precos: {
          instalacaoComBloqueio: 0,
          instalacaoSemBloqueio: 0,
          revisao: 0,
          retirada: 0,
          deslocamento: 0,
        },
      });

    expect([200, 201]).toContain(res.status);
    expect(geocodeMock).toHaveBeenCalled();
    expect(res.body.latitude).toBeNull();
    expect(res.body.longitude).toBeNull();
  });

  it('PATCH /tecnicos/:id sem mudar endereço não chama geocode novamente', async () => {
    geocodeMock.mockResolvedValue({
      lat: -22,
      lng: -43,
      precision: 'EXATO',
    });
    const suffix = Date.now() + 2;
    const createRes = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E Patch ${suffix}`,
        cep: '20040-020',
        logradouro: 'Rua A',
        numero: '1',
        cidadeEndereco: 'Rio de Janeiro',
        estadoEndereco: 'RJ',
        precos: {
          instalacaoComBloqueio: 0,
          instalacaoSemBloqueio: 0,
          revisao: 0,
          retirada: 0,
          deslocamento: 0,
        },
      });

    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;
    geocodeMock.mockClear();

    const patchRes = await request(app.getHttpServer())
      .patch(`/tecnicos/${id}`)
      .send({ nome: `E2E Patch Renomeado ${suffix}` });

    expect(patchRes.status).toBe(200);
    expect(geocodeMock).not.toHaveBeenCalled();
  });

  it('PATCH /tecnicos/:id mudando CEP chama geocode', async () => {
    geocodeMock.mockResolvedValue({
      lat: -22,
      lng: -43,
      precision: 'EXATO',
    });
    const suffix = Date.now() + 3;
    const createRes = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E CEP ${suffix}`,
        cep: '20040-020',
        logradouro: 'Rua A',
        numero: '1',
        cidadeEndereco: 'Rio de Janeiro',
        estadoEndereco: 'RJ',
        precos: {
          instalacaoComBloqueio: 0,
          instalacaoSemBloqueio: 0,
          revisao: 0,
          retirada: 0,
          deslocamento: 0,
        },
      });

    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;
    geocodeMock.mockClear();
    geocodeMock.mockResolvedValue({
      lat: -10,
      lng: -20,
      precision: 'CIDADE',
    });

    const patchRes = await request(app.getHttpServer())
      .patch(`/tecnicos/${id}`)
      .send({
        cep: '01310-100',
        logradouro: 'Rua A',
        numero: '1',
        cidadeEndereco: 'Rio de Janeiro',
        estadoEndereco: 'RJ',
      });

    expect(patchRes.status).toBe(200);
    expect(geocodeMock).toHaveBeenCalledTimes(1);
  });

  it('GET /tecnicos/:id retorna técnico com preços após criação', async () => {
    geocodeMock.mockResolvedValue(null);
    const suffix = Date.now() + 10;
    const createRes = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E GetOne ${suffix}`,
        precos: {
          instalacaoComBloqueio: 100,
          instalacaoSemBloqueio: 80,
          revisao: 50,
          retirada: 10,
          deslocamento: 5,
        },
      });

    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;

    const getRes = await request(app.getHttpServer()).get(`/tecnicos/${id}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({
      id,
      nome: `E2E GetOne ${suffix}`,
      precos: expect.objectContaining({
        revisao: expect.anything(),
        instalacaoComBloqueio: expect.anything(),
      }),
    });
  });

  it('GET /tecnicos/:id retorna 404 para id inexistente', async () => {
    const res = await request(app.getHttpServer()).get('/tecnicos/999999999');
    expect(res.status).toBe(404);
  });

  it('POST /tecnicos sem precos retorna técnico sem objeto precos preenchido pelo ORM', async () => {
    geocodeMock.mockResolvedValue(null);
    const suffix = Date.now() + 11;
    const res = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E Sem Precos ${suffix}`,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.precos).toBeNull();
  });

  it('PATCH /tecnicos/:id com precos parciais preserva demais valores numéricos', async () => {
    geocodeMock.mockResolvedValue(null);
    const suffix = Date.now() + 12;
    const createRes = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({
        nome: `E2E Merge Preco ${suffix}`,
        precos: {
          instalacaoComBloqueio: 100,
          instalacaoSemBloqueio: 90,
          revisao: 40,
          retirada: 20,
          deslocamento: 15,
        },
      });

    expect([200, 201]).toContain(createRes.status);
    const id = createRes.body.id as number;

    const patchRes = await request(app.getHttpServer())
      .patch(`/tecnicos/${id}`)
      .send({
        precos: { revisao: 77 },
      });

    expect(patchRes.status).toBe(200);
    const p = patchRes.body.precos;
    expect(p).toBeDefined();
    expect(Number(p.revisao)).toBe(77);
    expect(Number(p.instalacaoComBloqueio)).toBe(100);
    expect(Number(p.instalacaoSemBloqueio)).toBe(90);
    expect(Number(p.retirada)).toBe(20);
    expect(Number(p.deslocamento)).toBe(15);
  });
});

describe('Tecnicos (e2e) — permissão POST', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const geocodeMock = jest.fn();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), TecnicosModule],
    })
      .overrideProvider(GeocodingService)
      .useValue({ geocode: geocodeMock })
      .overrideGuard(PermissionsGuard)
      .useClass(BlockTecnicosPostPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await cleanupE2eTecnicos(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tecnicos retorna 403 quando guard nega AGENDAMENTO.TECNICO.CRIAR', async () => {
    const res = await request(app.getHttpServer())
      .post('/tecnicos')
      .send({ nome: 'Bloqueado' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/permissão/i);
  });
});
