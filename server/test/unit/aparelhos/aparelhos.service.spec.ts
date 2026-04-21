import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AparelhosService } from 'src/aparelhos/aparelhos.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
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
        {
          provide: DebitosRastreadoresService,
          useValue: { consolidarDebitoTx: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AparelhosService>(AparelhosService);
    jest.clearAllMocks();
  });

  describe('findParaTestes', () => {
    it('retorna rastreadores COM_TECNICO do cliente especificado', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      const aparelhos = [
        {
          id: 1,
          identificador: '862345678901234',
          tipo: 'RASTREADOR',
          status: 'COM_TECNICO',
          cliente: { id: 1, nome: 'Cliente A' },
        },
      ];
      prisma.aparelho.findMany.mockResolvedValue(aparelhos);

      const result = await service.findParaTestes(1);

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'EM_TESTES',
            idAparelho: { not: null },
          }),
        }),
      );
      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: 'RASTREADOR',
            status: 'COM_TECNICO',
            OR: expect.arrayContaining([
              { proprietario: 'INFINITY' },
              { proprietario: 'CLIENTE', clienteId: 1 },
            ]),
          }),
        }),
      );
      expect(result).toEqual(aparelhos);
    });

    it('filtra por tecnicoId quando fornecido', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.aparelho.findMany.mockResolvedValue([]);

      await service.findParaTestes(1, 5);

      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tecnicoId: 5,
          }),
        }),
      );
    });

    it('exclui aparelhos em uso em outra OS EM_TESTES da lista disponível', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([
        { idAparelho: 'IMEI-EM-USO' },
      ]);
      prisma.aparelho.findMany.mockResolvedValue([]);

      await service.findParaTestes(1);

      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            identificador: { notIn: ['IMEI-EM-USO'] },
          }),
        }),
      );
    });

    it('exclui a própria OS do filtro quando ordemServicoId é informado', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.aparelho.findMany.mockResolvedValue([]);

      await service.findParaTestes(1, null, 42);

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'EM_TESTES',
            idAparelho: { not: null },
            id: { not: 42 },
          }),
        }),
      );
    });

    it('retorna array vazio quando não há aparelhos elegíveis', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.aparelho.findMany.mockResolvedValue([]);

      const result = await service.findParaTestes(1);

      expect(result).toEqual([]);
    });

    it('com tecnicoId: não filtra por proprietário — mostra todos os aparelhos do técnico', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.aparelho.findMany.mockResolvedValue([]);

      await service.findParaTestes(1, 5);

      const whereUsado = prisma.aparelho.findMany.mock.calls[0]?.[0]?.where;
      expect(whereUsado).not.toHaveProperty('OR');
      expect(whereUsado).not.toHaveProperty('proprietario');
    });

    it('sem tecnicoId: mantém filtro OR de proprietário (INFINITY ou cliente)', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.aparelho.findMany.mockResolvedValue([]);

      await service.findParaTestes(3);

      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { proprietario: 'INFINITY' },
              { proprietario: 'CLIENTE', clienteId: 3 },
            ]),
          }),
        }),
      );
    });
  });

  describe('findAll — cliente.cor', () => {
    it('inclui cor no select do cliente em findAll', async () => {
      prisma.aparelho.findMany.mockResolvedValue([]);
      prisma.ordemServico.findMany.mockResolvedValue([]);

      await service.findAll();

      const call = prisma.aparelho.findMany.mock.calls[0][0];
      expect(call.include.cliente.select).toMatchObject({ cor: true });
    });
  });

  describe('findAll', () => {
    it('retorna lista de aparelhos com includes e ordemServicoVinculada', async () => {
      const aparelhos = [
        {
          id: 1,
          identificador: '123456789012345',
          tipo: 'RASTREADOR',
          status: 'EM_ESTOQUE',
        },
      ];
      prisma.aparelho.findMany.mockResolvedValue(aparelhos);
      prisma.ordemServico.findMany.mockResolvedValue([
        {
          numero: 72,
          idAparelho: '123456789012345',
          subclienteSnapshotNome: 'Sub A',
          subcliente: { nome: 'Sub A' },
          veiculo: { placa: 'ABC1D23' },
        },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        identificador: '123456789012345',
        ordemServicoVinculada: {
          numero: 72,
          subclienteNome: 'Sub A',
          veiculoPlaca: 'ABC1D23',
        },
      });
      expect(prisma.aparelho.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { criadoEm: 'desc' } }),
      );
      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idAparelho: { in: ['123456789012345'] } },
        }),
      );
    });

    it('retorna aparelhos sem ordemServicoVinculada quando não há OS vinculada', async () => {
      const aparelhos = [
        {
          id: 1,
          identificador: '999999999999999',
          tipo: 'RASTREADOR',
          status: 'EM_ESTOQUE',
        },
      ];
      prisma.aparelho.findMany.mockResolvedValue(aparelhos);
      prisma.ordemServico.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result[0].ordemServicoVinculada).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando aparelho não existe', async () => {
      prisma.aparelho.findUnique.mockResolvedValue(null);

      const promise = service.findOne(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Aparelho não encontrado');
    });

    it('retorna aparelho quando encontrado', async () => {
      const aparelho = {
        id: 1,
        identificador: '123',
        tipo: 'RASTREADOR',
        historico: [],
      };
      prisma.aparelho.findUnique.mockResolvedValue(aparelho);

      const result = await service.findOne(1);

      expect(result).toEqual(aparelho);
    });
  });

  describe('createIndividual', () => {
    it('lança BadRequestException quando identificador já existe', async () => {
      prisma.aparelho.findFirst.mockResolvedValue({
        id: 1,
        identificador: 'IMEI123',
      });

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
      const aparelho = {
        id: 1,
        identificador: 'IMEI456',
        tipo: 'RASTREADOR',
        tecnico: null,
      };
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

    it('SIM é criado com proprietario=INFINITY independente do proprietario enviado', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);
      const sim = {
        id: 2,
        identificador: '89550012345678901234',
        tipo: 'SIM',
        tecnico: null,
      };
      prisma.aparelho.create.mockResolvedValue(sim);
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.createIndividual({
        identificador: '89550012345678901234',
        tipo: 'SIM',
        proprietario: 'CLIENTE',
        clienteId: 99,
        origem: 'COMPRA_AVULSA',
        statusEntrada: 'NOVO_OK',
      });

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'SIM',
            proprietario: 'INFINITY',
            clienteId: null,
          }),
        }),
      );
      expect(result).toEqual(sim);
    });

    it('SIM ignora abaterDebitoId e não consulta débitos', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);
      prisma.aparelho.create.mockResolvedValue({
        id: 3,
        tipo: 'SIM',
        tecnico: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.createIndividual({
        identificador: '89550012345678901235',
        tipo: 'SIM',
        abaterDebitoId: 7,
        origem: 'COMPRA_AVULSA',
        statusEntrada: 'NOVO_OK',
      });

      expect(prisma.debitoRastreador.findUnique).not.toHaveBeenCalled();
    });

    it('SIM resolve operadora a partir de marcaSimcardId', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);
      prisma.marcaSimcard.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Getrak',
        operadora: { nome: 'Claro' },
      });
      prisma.aparelho.create.mockResolvedValue({
        id: 4,
        tipo: 'SIM',
        tecnico: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      await service.createIndividual({
        identificador: '89550012345678901236',
        tipo: 'SIM',
        marcaSimcardId: 1,
        origem: 'COMPRA_AVULSA',
        statusEntrada: 'NOVO_OK',
      });

      expect(prisma.aparelho.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ operadora: 'Claro' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('lança NotFoundException quando aparelho não existe', async () => {
      prisma.aparelho.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'EM_ESTOQUE')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('registra histórico e atualiza status', async () => {
      const aparelho = { id: 1, status: 'EM_ESTOQUE', historico: [] };
      const updated = { id: 1, status: 'CONFIGURADO' };
      prisma.aparelho.findUnique
        .mockResolvedValueOnce(aparelho)
        .mockResolvedValueOnce(updated);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
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
