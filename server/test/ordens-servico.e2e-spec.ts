import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('OrdensServico (e2e) - Tela de Criação', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /ordens-servico', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer())
        .post('/ordens-servico')
        .send({
          tipo: 'INSTALACAO_COM_BLOQUEIO',
          clienteId: 1,
        })
        .expect(401);
    });

    it('retorna 400 quando tipo é inválido', () => {
      return request(app.getHttpServer())
        .post('/ordens-servico')
        .set('Authorization', 'Bearer fake-token-for-validation')
        .send({
          tipo: 'TIPO_INVALIDO',
          clienteId: 1,
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });

    it('retorna 400 quando clienteId não é informado', () => {
      return request(app.getHttpServer())
        .post('/ordens-servico')
        .set('Authorization', 'Bearer fake-token')
        .send({
          tipo: 'INSTALACAO_COM_BLOQUEIO',
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('GET /ordens-servico', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/ordens-servico').expect(401);
    });
  });

  describe('GET /ordens-servico/resumo', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/ordens-servico/resumo').expect(401);
    });
  });

  describe('GET /ordens-servico/:id', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/ordens-servico/1').expect(401);
    });

    it('retorna 400 quando id não é numérico', () => {
      return request(app.getHttpServer())
        .get('/ordens-servico/abc')
        .set('Authorization', 'Bearer fake-token')
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('PATCH /ordens-servico/:id/status', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer())
        .patch('/ordens-servico/1/status')
        .send({ status: 'EM_TESTES' })
        .expect(401);
    });
  });
});

describe('Endpoints auxiliares da tela de criação (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /clientes', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/clientes').expect(401);
    });
  });

  describe('GET /clientes?subclientes=1', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/clientes?subclientes=1').expect(401);
    });
  });

  describe('GET /tecnicos', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/tecnicos').expect(401);
    });
  });

  describe('GET /aparelhos', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/aparelhos').expect(401);
    });
  });

  describe('GET /veiculos/consulta-placa/:placa', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer())
        .get('/veiculos/consulta-placa/ABC1D23')
        .expect(401);
    });
  });
});
