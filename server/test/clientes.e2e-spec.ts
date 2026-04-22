import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Clientes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
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

  describe('GET /clientes/:id', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/clientes/1').expect(401);
    });
  });

  describe('POST /clientes', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer())
        .post('/clientes')
        .send({ nome: 'Empresa Teste' })
        .expect(401);
    });
  });

  describe('PATCH /clientes/:id', () => {
    it('retorna 401 sem token de autenticação', () => {
      return request(app.getHttpServer())
        .patch('/clientes/1')
        .send({ nome: 'Atualizado' })
        .expect(401);
    });
  });
});
