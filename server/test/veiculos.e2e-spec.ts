jest.mock('api-placa-fipe', () => ({
  consultarPlaca: jest.fn(),
}));

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
import { consultarPlaca } from 'api-placa-fipe';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { VeiculosModule } from 'src/veiculos/veiculos.module';

class AllowAllPermissionsGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const PLACA_E2E_CRIAR = 'E2EV7C0';
const PLACA_E2E_LIST = 'E2EV7L0';
const PLACA_E2E_CONS = 'E2EV7N0';

describe('Veiculos (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), VeiculosModule],
    })
      .overrideGuard(PermissionsGuard)
      .useClass(AllowAllPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  beforeEach(() => {
    (consultarPlaca as jest.Mock).mockReset();
  });

  afterAll(async () => {
    await prisma.veiculo.deleteMany({
      where: { placa: { startsWith: 'E2EV7' } },
    });
    await app.close();
  });

  describe('POST /veiculos/criar-ou-buscar', () => {
    it('retorna 400 quando placa tem menos de 7 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/veiculos/criar-ou-buscar')
        .send({
          placa: 'ABC12',
          marca: 'Fiat',
          modelo: 'Uno',
          ano: '2020',
          cor: 'Branco',
        });

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando falta campo obrigatório', async () => {
      const res = await request(app.getHttpServer())
        .post('/veiculos/criar-ou-buscar')
        .send({
          placa: PLACA_E2E_CRIAR,
          marca: 'Fiat',
          modelo: 'Uno',
          ano: '2020',
        });

      expect(res.status).toBe(400);
    });

    it('retorna 201 com corpo vazio quando placa normalizada tem menos de 7 (edge DTO vs service)', async () => {
      const res = await request(app.getHttpServer())
        .post('/veiculos/criar-ou-buscar')
        .send({
          placa: 'A-B-C-1-2',
          marca: 'Fiat',
          modelo: 'Uno',
          ano: '2020',
          cor: 'Branco',
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({});
    });

    it('cria veículo e retorna registro com placa normalizada', async () => {
      await prisma.veiculo.deleteMany({ where: { placa: PLACA_E2E_CRIAR } });

      const res = await request(app.getHttpServer())
        .post('/veiculos/criar-ou-buscar')
        .send({
          placa: `  ${PLACA_E2E_CRIAR.slice(0, 3)}-${PLACA_E2E_CRIAR.slice(3)}  `,
          marca: ' Fiat ',
          modelo: ' Uno ',
          ano: '2021',
          cor: ' Branco ',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        placa: PLACA_E2E_CRIAR,
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2021,
        cor: 'Branco',
      });
      expect(res.body.id).toBeDefined();
    });
  });

  describe('GET /veiculos', () => {
    it('encontra veículo pelo search (não depende do take=50 na listagem completa)', async () => {
      await prisma.veiculo.deleteMany({ where: { placa: PLACA_E2E_LIST } });
      await prisma.veiculo.create({
        data: {
          placa: PLACA_E2E_LIST,
          marca: 'Ford',
          modelo: 'Ka',
          ano: 2019,
          cor: 'Prata',
        },
      });

      const resSearch = await request(app.getHttpServer()).get(
        `/veiculos?search=${PLACA_E2E_LIST}`,
      );

      expect(resSearch.status).toBe(200);
      expect(Array.isArray(resSearch.body)).toBe(true);
      expect(
        resSearch.body.some(
          (v: { placa: string }) => v.placa === PLACA_E2E_LIST,
        ),
      ).toBe(true);
    });
  });

  describe('GET /veiculos/consulta-placa/:placa', () => {
    it('retorna 200 com null quando placa inválida (curta)', async () => {
      const res = await request(app.getHttpServer()).get(
        '/veiculos/consulta-placa/ABC',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });

    it('retorna 502 quando API externa falha', async () => {
      (consultarPlaca as jest.Mock).mockRejectedValue(new Error('falha'));

      const res = await request(app.getHttpServer()).get(
        `/veiculos/consulta-placa/${PLACA_E2E_CONS}`,
      );

      expect(res.status).toBe(502);
    });

    it('retorna dados mapeados quando API externa responde', async () => {
      (consultarPlaca as jest.Mock).mockResolvedValue({
        marca: 'VW',
        modelo: 'Gol',
        anoModelo: 2018,
        cor: 'Preto',
        tipoVeiculo: 'AUTO',
      });

      const res = await request(app.getHttpServer()).get(
        `/veiculos/consulta-placa/e2ev-7n0`,
      );

      expect(consultarPlaca).toHaveBeenCalledWith(PLACA_E2E_CONS);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        marca: 'VW',
        modelo: 'Gol',
        ano: 2018,
        cor: 'Preto',
        tipo: 'AUTO',
      });
    });
  });
});
