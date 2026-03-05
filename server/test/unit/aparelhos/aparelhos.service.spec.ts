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

  describe('createLote', () => {
    it('lança BadRequestException quando quantidade é zero', async () => {
      await expect(
        service.createLote({
          referencia: 'LOT-001',
          dataChegada: '2024-01-01',
          proprietarioTipo: 'INFINITY',
          tipo: 'RASTREADOR',
          quantidade: 0,
          valorUnitario: 100,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createLote({
          referencia: 'LOT-001',
          dataChegada: '2024-01-01',
          proprietarioTipo: 'INFINITY',
          tipo: 'RASTREADOR',
          quantidade: 0,
          valorUnitario: 100,
        }),
      ).rejects.toThrow('Quantidade deve ser maior que zero');
    });

    it('cria lote com aparelhos sem identificadores', async () => {
      const lote = { id: 1, referencia: 'LOT-001', aparelhos: [{ id: 1 }, { id: 2 }], cliente: null };
      prisma.loteAparelho.create.mockResolvedValue({ id: 1 });
      prisma.aparelho.createMany.mockResolvedValue({ count: 2 });
      prisma.loteAparelho.findUnique.mockResolvedValue(lote);

      const result = await service.createLote({
        referencia: 'LOT-001',
        dataChegada: '2024-01-01',
        proprietarioTipo: 'INFINITY',
        tipo: 'RASTREADOR',
        quantidade: 2,
        valorUnitario: 100,
      });

      expect(result).toEqual(lote);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('usa quantidade de identificadores quando fornecidos', async () => {
      const lote = { id: 1, referencia: 'LOT-002', aparelhos: [{ id: 1 }], cliente: null };
      prisma.loteAparelho.create.mockResolvedValue({ id: 1 });
      prisma.aparelho.createMany.mockResolvedValue({ count: 1 });
      prisma.loteAparelho.findUnique.mockResolvedValue(lote);

      await service.createLote({
        referencia: 'LOT-002',
        dataChegada: '2024-01-01',
        proprietarioTipo: 'INFINITY',
        tipo: 'RASTREADOR',
        quantidade: 5,
        valorUnitario: 100,
        identificadores: ['123456789012345'],
      });

      expect(prisma.loteAparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantidade: 1 }),
        }),
      );
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

  describe('getKits', () => {
    it('retorna kits não concluídos', async () => {
      const kits = [{ id: 1, nome: 'Kit-A' }, { id: 2, nome: 'Kit-B' }];
      prisma.kit.findMany.mockResolvedValue(kits);

      const result = await service.getKits();

      expect(result).toEqual(kits);
      expect(prisma.kit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { kitConcluido: false } }),
      );
    });
  });

  describe('getKitById', () => {
    it('lança NotFoundException quando kit não existe', async () => {
      prisma.kit.findUnique.mockResolvedValue(null);

      await expect(service.getKitById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getKitById(999)).rejects.toThrow('Kit não encontrado');
    });

    it('retorna kit quando encontrado', async () => {
      const kit = { id: 1, nome: 'Kit-A', aparelhos: [] };
      prisma.kit.findUnique.mockResolvedValue(kit);

      const result = await service.getKitById(1);

      expect(result).toEqual(kit);
    });
  });

  describe('updateAparelhoKit', () => {
    it('lança NotFoundException quando aparelho não existe', async () => {
      prisma.aparelho.findUnique.mockResolvedValue(null);

      await expect(service.updateAparelhoKit(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando aparelho não é RASTREADOR', async () => {
      prisma.aparelho.findUnique.mockResolvedValue({ id: 1, tipo: 'SIM' });

      await expect(service.updateAparelhoKit(1, 2)).rejects.toThrow(BadRequestException);
      await expect(service.updateAparelhoKit(1, 2)).rejects.toThrow(
        'Apenas rastreadores podem ser adicionados ao kit',
      );
    });

    it('atualiza kitId do aparelho rastreador', async () => {
      prisma.aparelho.findUnique.mockResolvedValue({ id: 1, tipo: 'RASTREADOR' });
      const updated = { id: 1, kitId: 5 };
      prisma.aparelho.update.mockResolvedValue(updated);

      const result = await service.updateAparelhoKit(1, 5);

      expect(result).toEqual(updated);
      expect(prisma.aparelho.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { kitId: 5 } });
    });
  });

  describe('criarOuBuscarKitPorNome', () => {
    it('retorna null quando nome é vazio', async () => {
      const result = await service.criarOuBuscarKitPorNome('');

      expect(result).toBeNull();
      expect(prisma.kit.findUnique).not.toHaveBeenCalled();
    });

    it('retorna kit existente quando nome já cadastrado', async () => {
      const kit = { id: 1, nome: 'Kit-A' };
      prisma.kit.findUnique.mockResolvedValue(kit);

      const result = await service.criarOuBuscarKitPorNome('Kit-A');

      expect(result).toEqual(kit);
      expect(prisma.kit.create).not.toHaveBeenCalled();
    });

    it('cria novo kit quando nome não existe', async () => {
      prisma.kit.findUnique.mockResolvedValue(null);
      const created = { id: 2, nome: 'Kit-Novo' };
      prisma.kit.create.mockResolvedValue(created);

      const result = await service.criarOuBuscarKitPorNome('Kit-Novo');

      expect(result).toEqual(created);
      expect(prisma.kit.create).toHaveBeenCalledWith({ data: { nome: 'Kit-Novo' } });
    });
  });

  describe('getLotesParaPareamento', () => {
    it('retorna somente lotes com saldo disponível', async () => {
      const lotes = [
        { id: 1, referencia: 'LOT-001', aparelhos: [{ id: 10 }, { id: 11 }] },
        { id: 2, referencia: 'LOT-002', aparelhos: [] },
      ];
      prisma.loteAparelho.findMany.mockResolvedValue(lotes);

      const result = await service.getLotesParaPareamento('RASTREADOR');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 1, referencia: 'LOT-001', quantidadeDisponivelSemId: 2 });
    });
  });
});
