import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AparelhosService } from 'src/aparelhos/aparelhos.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('AparelhosService', () => {
  let service: AparelhosService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AparelhosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AparelhosService>(AparelhosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retorna lista de aparelhos com includes', async () => {
      const aparelhos = [
        { id: 1, identificador: '123456789012345', tipo: 'RASTREADOR', status: 'EM_ESTOQUE' },
      ];
      prisma.aparelho.findMany.mockResolvedValue(aparelhos);

      const result = await service.findAll();

      expect(result).toEqual(aparelhos);
      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { criadoEm: 'desc' } }),
      );
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando aparelho não existe', async () => {
      prisma.aparelho.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Aparelho não encontrado');
    });

    it('retorna aparelho quando encontrado', async () => {
      const aparelho = { id: 1, identificador: '123', tipo: 'RASTREADOR', historico: [] };
      prisma.aparelho.findUnique.mockResolvedValue(aparelho);

      const result = await service.findOne(1);

      expect(result).toEqual(aparelho);
    });
  });

  describe('createIndividual', () => {
    it('lança BadRequestException quando identificador já existe', async () => {
      prisma.aparelho.findFirst.mockResolvedValue({ id: 1, identificador: 'IMEI123' });

      await expect(
        service.createIndividual({
          identificador: 'IMEI123',
          tipo: 'RASTREADOR',
          origem: 'COMPRA_AVULSA',
          statusEntrada: 'NOVO_OK',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cria aparelho individual novo', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);
      const aparelho = { id: 1, identificador: 'IMEI456', tipo: 'RASTREADOR', tecnico: null };
      prisma.aparelho.create.mockResolvedValue(aparelho);
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.createIndividual({
        identificador: 'IMEI456',
        tipo: 'RASTREADOR',
        origem: 'COMPRA_AVULSA',
        statusEntrada: 'NOVO_OK',
      });

      expect(result).toEqual(aparelho);
      expect(prisma.aparelhoHistorico.create).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('lança NotFoundException quando aparelho não existe', async () => {
      prisma.aparelho.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'EM_ESTOQUE')).rejects.toThrow(NotFoundException);
    });

    it('registra histórico e atualiza status', async () => {
      const aparelho = { id: 1, status: 'EM_ESTOQUE', historico: [] };
      prisma.aparelho.findUnique.mockResolvedValue(aparelho);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      const updated = { id: 1, status: 'CONFIGURADO' };
      prisma.aparelho.update.mockResolvedValue(updated);

      const result = await service.updateStatus(1, 'CONFIGURADO', 'Obs');

      expect(prisma.aparelhoHistorico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            aparelhoId: 1,
            statusAnterior: 'EM_ESTOQUE',
            statusNovo: 'CONFIGURADO',
            observacao: 'Obs',
          }),
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe('getResumo', () => {
    it('retorna total e contagens agrupadas por status e tipo', async () => {
      prisma.aparelho.count.mockResolvedValue(10);
      prisma.aparelho.groupBy
        .mockResolvedValueOnce([
          { status: 'EM_ESTOQUE', _count: { status: 7 } },
          { status: 'CONFIGURADO', _count: { status: 3 } },
        ])
        .mockResolvedValueOnce([
          { tipo: 'RASTREADOR', _count: { tipo: 6 } },
          { tipo: 'SIM', _count: { tipo: 4 } },
        ]);

      const result = await service.getResumo();

      expect(result.total).toBe(10);
      expect(result.porStatus).toMatchObject({ EM_ESTOQUE: 7, CONFIGURADO: 3 });
      expect(result.porTipo).toMatchObject({ RASTREADOR: 6, SIM: 4 });
    });
  });

});
