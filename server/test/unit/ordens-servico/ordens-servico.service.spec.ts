import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdensServicoService } from 'src/ordens-servico/ordens-servico.service';
import { HtmlOrdemServicoGenerator } from 'src/ordens-servico/html-ordem-servico.generator';
import { PdfOrdemServicoGenerator } from 'src/ordens-servico/pdf-ordem-servico.generator';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import {
  StatusOS,
  StatusCadastro,
  StatusAparelho,
  TipoOS,
} from '@prisma/client';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('OrdensServicoService', () => {
  let service: OrdensServicoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let htmlGenerator: jest.Mocked<HtmlOrdemServicoGenerator>;
  let pdfGenerator: jest.Mocked<PdfOrdemServicoGenerator>;
  let debitosService: jest.Mocked<DebitosRastreadoresService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    htmlGenerator = {
      gerar: jest.fn(),
    } as unknown as jest.Mocked<HtmlOrdemServicoGenerator>;
    pdfGenerator = {
      gerar: jest.fn(),
    } as unknown as jest.Mocked<PdfOrdemServicoGenerator>;
    debitosService = {
      consolidarDebitoTx: jest.fn(),
    } as unknown as jest.Mocked<DebitosRastreadoresService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdensServicoService,
        { provide: PrismaService, useValue: prisma },
        { provide: HtmlOrdemServicoGenerator, useValue: htmlGenerator },
        { provide: PdfOrdemServicoGenerator, useValue: pdfGenerator },
        { provide: DebitosRastreadoresService, useValue: debitosService },
      ],
    }).compile();

    service = module.get<OrdensServicoService>(OrdensServicoService);
    jest.clearAllMocks();
  });

  describe('getClienteInfinityOuCriar', () => {
    it('retorna id do cliente Infinity existente', async () => {
      prisma.cliente.findFirst.mockResolvedValue({ id: 7, nome: 'Infinity' });

      const result = await service.getClienteInfinityOuCriar();

      expect(result).toBe(7);
      expect(prisma.cliente.create).not.toHaveBeenCalled();
    });

    it('cria cliente Infinity quando não existe e retorna o id', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);
      prisma.cliente.create.mockResolvedValue({ id: 3, nome: 'Infinity' });

      const result = await service.getClienteInfinityOuCriar();

      expect(result).toBe(3);
      expect(prisma.cliente.create).toHaveBeenCalledWith({
        data: { nome: 'Infinity', nomeFantasia: 'Infinity' },
      });
    });
  });

  describe('getResumo', () => {
    it('retorna contagens por status', async () => {
      prisma.ordemServico.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(10);

      const result = await service.getResumo();

      expect(result).toEqual({
        agendado: 5,
        emTestes: 3,
        testesRealizados: 2,
        aguardandoCadastro: 1,
        finalizado: 10,
      });
      expect(prisma.ordemServico.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('findTestando', () => {
    it('retorna lista de OS com status EM_TESTES sem filtro', async () => {
      const items = [
        {
          id: 1,
          numero: 100,
          status: StatusOS.EM_TESTES,
          atualizadoEm: new Date('2025-01-01T10:00:00Z'),
          historico: [],
          cliente: { id: 1, nome: 'Cliente A' },
          subcliente: { id: 1, nome: 'Sub A' },
          veiculo: { id: 1, placa: 'ABC-1234', marca: null, modelo: null },
          tecnico: { id: 1, nome: 'Técnico X' },
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);

      const result = await service.findTestando();

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: StatusOS.EM_TESTES },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('historico');
      expect(result[0]).toHaveProperty('tempoEmTestesMin');
    });

    it('calcula tempoEmTestesMin corretamente usando histórico de entrada', async () => {
      jest.useFakeTimers();
      const now = new Date('2025-01-15T12:00:00Z');
      jest.setSystemTime(now);
      const entradaEmTestes = new Date(now.getTime() - 60 * 60 * 1000);
      const items = [
        {
          id: 1,
          numero: 100,
          status: StatusOS.EM_TESTES,
          atualizadoEm: now,
          historico: [{ criadoEm: entradaEmTestes }],
          cliente: { id: 1, nome: 'Cliente A' },
          subcliente: null,
          veiculo: null,
          tecnico: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);

      const result = await service.findTestando();

      expect(result[0].tempoEmTestesMin).toBe(60);
      jest.useRealTimers();
    });

    it('usa atualizadoEm como fallback quando historico[0] está ausente', async () => {
      jest.useFakeTimers();
      const now = new Date('2025-01-15T12:00:00Z');
      jest.setSystemTime(now);
      const atualizado = new Date(now.getTime() - 30 * 60 * 1000);
      const items = [
        {
          id: 1,
          numero: 100,
          status: StatusOS.EM_TESTES,
          atualizadoEm: atualizado,
          historico: [],
          cliente: { id: 1, nome: 'Cliente A' },
          subcliente: null,
          veiculo: null,
          tecnico: null,
        },
      ];
      prisma.ordemServico.findMany.mockResolvedValue(items);

      const result = await service.findTestando();

      expect(result[0].tempoEmTestesMin).toBe(30);
      jest.useRealTimers();
    });

    it('filtra por número quando search é numérico', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);

      await service.findTestando('29480');

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: StatusOS.EM_TESTES,
            OR: expect.arrayContaining([{ numero: 29480 }]),
          }),
        }),
      );
    });

    it('filtra por texto quando search é string', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);

      await service.findTestando('ABC-1234');

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: StatusOS.EM_TESTES,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('retorna resultado paginado com defaults de page=1 e limit=15', async () => {
      const items = [{ id: 1, numero: 1, status: StatusOS.AGENDADO }];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: items,
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      });
      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 15 }),
      );
    });

    it('filtra por status quando informado', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findAll({ status: StatusOS.AGENDADO });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: StatusOS.AGENDADO }),
        }),
      );
    });

    it('filtra por search numérico no número da OS', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findAll({ search: '42' });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ numero: 42 }]),
          }),
        }),
      );
    });

    it('filtra por search textual nos campos de cliente, técnico e veículo', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      await service.findAll({ search: 'Carlos' });

      expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('limita page ao máximo de 100', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      const result = await service.findAll({ limit: 200 });

      expect(result.limit).toBe(100);
    });

    it('garante page mínimo de 1', async () => {
      prisma.ordemServico.findMany.mockResolvedValue([]);
      prisma.ordemServico.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 0 });

      expect(result.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      const promise = service.findOne(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Ordem de serviço não encontrada');
    });

    it('retorna OS quando encontrada', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      const result = await service.findOne(1);

      expect(result).toEqual(os);
    });
  });

  describe('create', () => {
    it('gera número sequencial e cria OS', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 41 } });
      const created = { id: 1, numero: 42, status: StatusOS.AGENDADO };
      prisma.ordemServico.create.mockResolvedValue(created);

      const result = await service.create(
        { tipo: 'INSTALACAO', clienteId: 1 } as any,
        100,
      );

      expect(result.numero).toBe(42);
      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: 42, criadoPorId: 100 }),
        }),
      );
    });

    it('usa número 1 quando não há OS anteriores', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({
        _max: { numero: null },
      });
      prisma.ordemServico.create.mockResolvedValue({ id: 1, numero: 1 });

      await service.create({ tipo: 'INSTALACAO' } as any);

      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: 1 }),
        }),
      );
    });

    it('usa status AGENDADO como padrão', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 0 } });
      prisma.ordemServico.create.mockResolvedValue({ id: 1, numero: 1 });

      await service.create({ tipo: 'INSTALACAO' } as any);

      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusOS.AGENDADO }),
        }),
      );
    });

    it('cria OS com subclienteId, tecnicoId, veiculoId e observacoes quando informados', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 10 } });
      const created = {
        id: 1,
        numero: 11,
        clienteId: 1,
        subclienteId: 2,
        tecnicoId: 3,
        veiculoId: 4,
        observacoes: 'Obs da OS',
      };
      prisma.ordemServico.create.mockResolvedValue(created);

      const result = await service.create({
        tipo: 'INSTALACAO_COM_BLOQUEIO',
        clienteId: 1,
        subclienteId: 2,
        tecnicoId: 3,
        veiculoId: 4,
        observacoes: 'Obs da OS',
      } as any);

      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numero: 11,
            tipo: 'INSTALACAO_COM_BLOQUEIO',
            clienteId: 1,
            subclienteId: 2,
            tecnicoId: 3,
            veiculoId: 4,
            observacoes: 'Obs da OS',
          }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('cria subcliente e OS na mesma transação quando subclienteCreate é informado', async () => {
      const createdSub = { id: 10, clienteId: 1, nome: 'Sub Novo' };
      const createdOS = {
        id: 1,
        numero: 6,
        clienteId: 1,
        subclienteId: 10,
        cliente: {},
        subcliente: { id: 10, nome: 'Sub Novo' },
        veiculo: null,
        tecnico: null,
      };
      prisma.subcliente.create.mockResolvedValue(createdSub);
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 5 } });
      prisma.ordemServico.create.mockResolvedValue(createdOS);

      const result = await service.create({
        tipo: 'INSTALACAO',
        clienteId: 1,
        subclienteCreate: {
          nome: 'Sub Novo',
          cep: '12345-678',
          cidade: 'São Paulo',
          estado: 'SP',
          telefone: '11999999999',
          cobrancaTipo: 'INFINITY',
        },
      } as any);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.subcliente.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clienteId: 1,
          nome: 'Sub Novo',
          cep: '12345-678',
          cidade: 'São Paulo',
          estado: 'SP',
          telefone: '11999999999',
          cobrancaTipo: 'INFINITY',
        }),
      });
      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numero: 6,
            subclienteId: 10,
          }),
        }),
      );
      expect(result).toEqual(createdOS);
    });

    it('inclui cliente, subcliente, veiculo e tecnico no retorno', async () => {
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: 0 } });
      const created = {
        id: 1,
        numero: 1,
        cliente: { id: 1, nome: 'Cliente A' },
        subcliente: { id: 1, nome: 'Sub A' },
        veiculo: { id: 1, placa: 'ABC-1234' },
        tecnico: { id: 1, nome: 'Técnico X' },
      };
      prisma.ordemServico.create.mockResolvedValue(created);

      const result = await service.create({
        tipo: 'RETIRADA',
        clienteId: 1,
      } as any);

      expect(result).toMatchObject({
        cliente: { nome: 'Cliente A' },
        subcliente: { nome: 'Sub A' },
        veiculo: { placa: 'ABC-1234' },
        tecnico: { nome: 'Técnico X' },
      });
      expect(prisma.ordemServico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            cliente: true,
            subcliente: true,
            veiculo: true,
            tecnico: true,
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(999, { status: StatusOS.EM_TESTES }),
      ).rejects.toThrow(NotFoundException);
    });

    it('retorna OS sem alterar quando status já é o mesmo', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      const result = await service.updateStatus(1, {
        status: StatusOS.AGENDADO,
      });

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(os);
    });

    it('registra histórico e atualiza status quando novo status é diferente', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.EM_TESTES });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateStatus(1, {
        status: StatusOS.EM_TESTES,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toMatchObject({ status: StatusOS.EM_TESTES });
    });

    it('lança BadRequestException para transição inválida (EM_TESTES → FINALIZADO)', async () => {
      const os = {
        id: 1,
        numero: 1,
        status: StatusOS.EM_TESTES,
        historico: [],
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      const promise = service.updateStatus(1, { status: StatusOS.FINALIZADO });
      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Transição de status inválida');
    });

    it('aceita transição válida (EM_TESTES → TESTES_REALIZADOS)', async () => {
      const os = {
        id: 1,
        numero: 1,
        status: StatusOS.EM_TESTES,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateStatus(1, {
        status: StatusOS.TESTES_REALIZADOS,
      });

      expect(result).toMatchObject({ status: StatusOS.TESTES_REALIZADOS });
    });

    it('aceita transição válida (EM_TESTES → AGENDADO)', async () => {
      const os = {
        id: 1,
        numero: 1,
        status: StatusOS.EM_TESTES,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.AGENDADO });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateStatus(1, {
        status: StatusOS.AGENDADO,
      });

      expect(result).toMatchObject({ status: StatusOS.AGENDADO });
    });

    it('aceita transição válida (EM_TESTES → CANCELADO)', async () => {
      const os = {
        id: 1,
        numero: 1,
        status: StatusOS.EM_TESTES,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.CANCELADO });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateStatus(1, {
        status: StatusOS.CANCELADO,
      });

      expect(result).toMatchObject({ status: StatusOS.CANCELADO });
    });

    it('define statusCadastro=AGUARDANDO quando OS transita para AGUARDANDO_CADASTRO', async () => {
      const os = {
        id: 1,
        numero: 1,
        status: StatusOS.TESTES_REALIZADOS,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({
          ...os,
          status: StatusOS.AGUARDANDO_CADASTRO,
          statusCadastro: StatusCadastro.AGUARDANDO,
        });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateStatus(1, { status: StatusOS.AGUARDANDO_CADASTRO });

      expect(prisma.ordemServico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StatusOS.AGUARDANDO_CADASTRO,
            statusCadastro: StatusCadastro.AGUARDANDO,
          }),
        }),
      );
    });

    it('não define statusCadastro quando OS transita para outros status', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.EM_TESTES });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateStatus(1, { status: StatusOS.EM_TESTES });

      const updateCall = prisma.ordemServico.update.mock.calls[0]?.[0];
      expect(updateCall?.data).not.toHaveProperty('statusCadastro');
    });

    it('em REVISAO grava localInstalacao e posChave nos campos *Entrada e preserva originais', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.REVISAO,
        status: StatusOS.EM_TESTES,
        localInstalacao: 'LOCAL_ORIGINAL',
        posChave: 'SIM',
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({
          ...os,
          status: StatusOS.TESTES_REALIZADOS,
          localInstalacaoEntrada: 'LOCAL_TESTES',
          posChaveEntrada: 'NAO',
        });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateStatus(1, {
        status: StatusOS.TESTES_REALIZADOS,
        localInstalacao: 'LOCAL_TESTES',
        posChave: 'NAO',
      });

      const updateCall = prisma.ordemServico.update.mock.calls[0]?.[0];
      expect(updateCall?.data).toMatchObject({
        localInstalacaoEntrada: 'LOCAL_TESTES',
        posChaveEntrada: 'NAO',
      });
      expect(updateCall?.data).not.toHaveProperty('localInstalacao');
      expect(updateCall?.data).not.toHaveProperty('posChave');
    });

    it('em INSTALACAO mantém comportamento antigo e sobrescreve localInstalacao/posChave', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
        status: StatusOS.EM_TESTES,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({
          ...os,
          status: StatusOS.TESTES_REALIZADOS,
          localInstalacao: 'LOCAL_X',
          posChave: 'SIM',
        });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateStatus(1, {
        status: StatusOS.TESTES_REALIZADOS,
        localInstalacao: 'LOCAL_X',
        posChave: 'SIM',
      });

      const updateCall = prisma.ordemServico.update.mock.calls[0]?.[0];
      expect(updateCall?.data).toMatchObject({
        localInstalacao: 'LOCAL_X',
        posChave: 'SIM',
      });
      expect(updateCall?.data).not.toHaveProperty('localInstalacaoEntrada');
      expect(updateCall?.data).not.toHaveProperty('posChaveEntrada');
    });

    it('em REVISAO ao concluir testes busca aparelho novo por idEntrada (não idAparelho)', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.REVISAO,
        status: StatusOS.EM_TESTES,
        idAparelho: 'IMEI_SUBSTITUIDO',
        idEntrada: 'IMEI_NOVO',
        veiculo: { placa: 'ABC1D23' },
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.aparelho.findFirst.mockResolvedValue({
        id: 10,
        status: StatusAparelho.COM_TECNICO,
        simVinculadoId: 20,
        simVinculado: { id: 20, status: StatusAparelho.COM_TECNICO },
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: 'IMEI_NOVO', tipo: 'RASTREADOR' },
        }),
      );
    });

    describe('desvinculação do aparelho de saída em EM_TESTES → TESTES_REALIZADOS', () => {
      const montarOsRevisao = (overrides: Record<string, unknown> = {}) => ({
        id: 1,
        numero: 42,
        tipo: TipoOS.REVISAO,
        status: StatusOS.EM_TESTES,
        idAparelho: 'IMEI_SAIDA',
        idEntrada: null,
        veiculoId: 7,
        veiculo: { id: 7, placa: 'ABC1D23' },
        historico: [],
        ...overrides,
      });

      it('em REVISAO desvincula o aparelho de saída quando vinculado ao veículo da OS', async () => {
        const os = montarOsRevisao();
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 7,
        });
        prisma.aparelhoHistorico.create.mockResolvedValue({});
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { identificador: 'IMEI_SAIDA' },
          }),
        );
        expect(prisma.aparelho.update).toHaveBeenCalledWith({
          where: { id: 55 },
          data: {
            status: StatusAparelho.COM_TECNICO,
            veiculoId: null,
            subclienteId: null,
            observacao: 'Retirado do veículo ABC1D23 via OS #42',
          },
        });
        expect(prisma.aparelhoHistorico.create).toHaveBeenCalledWith({
          data: {
            aparelhoId: 55,
            statusAnterior: StatusAparelho.INSTALADO,
            statusNovo: StatusAparelho.COM_TECNICO,
            observacao: 'Retirado do veículo ABC1D23 via OS #42',
          },
        });
      });

      it('em RETIRADA desvincula o aparelho de saída quando vinculado ao veículo da OS', async () => {
        const os = {
          id: 2,
          numero: 99,
          tipo: TipoOS.RETIRADA,
          status: StatusOS.EM_TESTES,
          idAparelho: 'IMEI_RETIRAR',
          veiculoId: 3,
          veiculo: { id: 3, placa: 'XYZ9K88' },
          historico: [],
        };
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 77,
          status: StatusAparelho.INSTALADO,
          veiculoId: 3,
        });
        prisma.aparelhoHistorico.create.mockResolvedValue({});
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(2, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.update).toHaveBeenCalledWith({
          where: { id: 77 },
          data: {
            status: StatusAparelho.COM_TECNICO,
            veiculoId: null,
            subclienteId: null,
            observacao: 'Retirado do veículo XYZ9K88 via OS #99',
          },
        });
      });

      it('não desvincula quando aparelho está vinculado a OUTRO veículo', async () => {
        const os = montarOsRevisao();
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 999,
        });

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.update).not.toHaveBeenCalled();
        expect(prisma.aparelhoHistorico.create).not.toHaveBeenCalled();
      });

      it('não desvincula quando IMEI de saída não está cadastrado no sistema', async () => {
        const os = montarOsRevisao();
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce(null);

        await expect(
          service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS }),
        ).resolves.not.toThrow();

        expect(prisma.aparelho.update).not.toHaveBeenCalled();
        expect(prisma.aparelhoHistorico.create).not.toHaveBeenCalled();
      });

      it('não consulta aparelho quando idAparelho é nulo', async () => {
        const os = montarOsRevisao({ idAparelho: null });
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
        expect(prisma.aparelho.update).not.toHaveBeenCalled();
      });

      it('não consulta aparelho quando idAparelho é só espaços em branco (trim vazio)', async () => {
        const os = montarOsRevisao({ idAparelho: '   \t  ' });
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
        expect(prisma.aparelho.update).not.toHaveBeenCalled();
      });

      it('usa placa "-" na observação quando veículo da OS não veio no include (fallback)', async () => {
        const os = montarOsRevisao({
          veiculo: null,
        });
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 7,
        });
        prisma.aparelhoHistorico.create.mockResolvedValue({});
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              observacao: 'Retirado do veículo - via OS #42',
            }),
          }),
        );
      });

      it('em REVISAO com idEntrada: desvincula aparelho de saída e só depois marca o novo como INSTALADO', async () => {
        const os = {
          ...montarOsRevisao(),
          idEntrada: 'IMEI_NOVO',
        };
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst
          .mockResolvedValueOnce({
            id: 55,
            status: StatusAparelho.INSTALADO,
            veiculoId: 7,
          })
          .mockResolvedValueOnce({
            id: 10,
            status: StatusAparelho.COM_TECNICO,
            simVinculadoId: null,
            simVinculado: null,
          });
        prisma.aparelhoHistorico.create.mockResolvedValue({});
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.findFirst).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            where: { identificador: 'IMEI_SAIDA' },
          }),
        );
        expect(prisma.aparelho.findFirst).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            where: { identificador: 'IMEI_NOVO', tipo: 'RASTREADOR' },
          }),
        );
        const updates = prisma.aparelho.update.mock.calls.map((c) => c[0]);
        expect(updates[0]).toMatchObject({
          where: { id: 55 },
          data: {
            status: StatusAparelho.COM_TECNICO,
            veiculoId: null,
            subclienteId: null,
          },
        });
        expect(updates[1]).toMatchObject({
          where: { id: 10 },
          data: { status: StatusAparelho.INSTALADO },
        });
      });

      it('em RETIRADA não busca idAparelho com filtro tipo RASTREADOR (não reinstala o aparelho retirado)', async () => {
        const os = {
          id: 2,
          numero: 99,
          tipo: TipoOS.RETIRADA,
          status: StatusOS.EM_TESTES,
          idAparelho: 'IMEI_RETIRAR',
          veiculoId: 3,
          veiculo: { id: 3, placa: 'XYZ9K88' },
          historico: [],
        };
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 77,
          status: StatusAparelho.INSTALADO,
          veiculoId: 3,
        });
        prisma.aparelhoHistorico.create.mockResolvedValue({});
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(2, { status: StatusOS.TESTES_REALIZADOS });

        const buscaInstalacaoComImeiSaida =
          prisma.aparelho.findFirst.mock.calls.filter((args) => {
            const arg = args[0] as
              | {
                  where?: { identificador?: string; tipo?: string };
                }
              | undefined;
            return (
              arg?.where?.identificador === 'IMEI_RETIRAR' &&
              arg?.where?.tipo === 'RASTREADOR'
            );
          });
        expect(buscaInstalacaoComImeiSaida).toHaveLength(0);
        expect(prisma.aparelho.update).toHaveBeenCalledTimes(1);
        expect(prisma.aparelho.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 77 },
            data: expect.objectContaining({
              status: StatusAparelho.COM_TECNICO,
            }),
          }),
        );
      });

      it('não desvincula quando RETIRADA aponta idAparelho cadastrado mas em OUTRO veículo', async () => {
        const os = {
          id: 2,
          numero: 12,
          tipo: TipoOS.RETIRADA,
          status: StatusOS.EM_TESTES,
          idAparelho: 'IMEI_X',
          veiculoId: 100,
          veiculo: { id: 100, placa: 'RET1R00' },
          historico: [],
        };
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 1,
          status: StatusAparelho.INSTALADO,
          veiculoId: 200,
        });

        await service.updateStatus(2, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.update).not.toHaveBeenCalled();
      });

      it('não consulta aparelho quando veiculoId da OS é nulo', async () => {
        const os = montarOsRevisao({ veiculoId: null, veiculo: null });
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
      });

      it('não desvincula em INSTALACAO_COM_BLOQUEIO mesmo na transição EM_TESTES → TESTES_REALIZADOS', async () => {
        const os = {
          id: 1,
          numero: 1,
          tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
          status: StatusOS.EM_TESTES,
          idAparelho: 'IMEI_INST',
          veiculoId: 7,
          veiculo: { id: 7, placa: 'ABC1D23' },
          historico: [],
        };
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce(null);
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        const chamadasParaDesvinculo =
          prisma.aparelho.findFirst.mock.calls.filter((args) => {
            const arg = args[0] as
              | { where?: { identificador?: string; tipo?: string } }
              | undefined;
            return (
              arg?.where?.identificador === 'IMEI_INST' && !arg?.where?.tipo
            );
          });
        expect(chamadasParaDesvinculo).toHaveLength(0);
      });

      it('não desvincula em INSTALACAO_SEM_BLOQUEIO', async () => {
        const os = {
          id: 1,
          numero: 1,
          tipo: TipoOS.INSTALACAO_SEM_BLOQUEIO,
          status: StatusOS.EM_TESTES,
          idAparelho: 'IMEI_INST',
          veiculoId: 7,
          veiculo: { id: 7, placa: 'ABC1D23' },
          historico: [],
        };
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce(null);
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.TESTES_REALIZADOS });

        const chamadasParaDesvinculo =
          prisma.aparelho.findFirst.mock.calls.filter((args) => {
            const arg = args[0] as
              | { where?: { identificador?: string; tipo?: string } }
              | undefined;
            return (
              arg?.where?.identificador === 'IMEI_INST' && !arg?.where?.tipo
            );
          });
        expect(chamadasParaDesvinculo).toHaveLength(0);
      });

      it('não desvincula em REVISAO em transição diferente (EM_TESTES → AGENDADO)', async () => {
        const os = montarOsRevisao();
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.AGENDADO });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});

        await service.updateStatus(1, { status: StatusOS.AGENDADO });

        expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
        expect(prisma.aparelho.update).not.toHaveBeenCalled();
      });

      it('desvincula na mesma transação que grava localInstalacaoEntrada/posChaveEntrada', async () => {
        const os = montarOsRevisao();
        prisma.ordemServico.findUnique
          .mockResolvedValueOnce(os)
          .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
        prisma.oSHistorico.create.mockResolvedValue({});
        prisma.ordemServico.update.mockResolvedValue({});
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 7,
        });
        prisma.aparelhoHistorico.create.mockResolvedValue({});
        prisma.aparelho.update.mockResolvedValue({});

        await service.updateStatus(1, {
          status: StatusOS.TESTES_REALIZADOS,
          localInstalacao: 'LOCAL_NOVO',
          posChave: 'SIM',
        });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(prisma.ordemServico.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: StatusOS.TESTES_REALIZADOS,
              localInstalacaoEntrada: 'LOCAL_NOVO',
              posChaveEntrada: 'SIM',
            }),
          }),
        );
        expect(prisma.aparelho.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 55 },
            data: expect.objectContaining({
              status: StatusAparelho.COM_TECNICO,
            }),
          }),
        );
      });
    });
  });

  describe('criação de débito ao concluir testes (TESTES_REALIZADOS)', () => {
    const osInstalacao = {
      id: 5,
      numero: 10,
      tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
      status: StatusOS.EM_TESTES,
      clienteId: 2,
      idAparelho: 'IMEI_TESTE',
      veiculo: null,
      veiculoId: null,
      historico: [],
    };

    function mockOsEAparelho(
      aparelho: Record<string, unknown>,
      os = osInstalacao,
    ) {
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, status: StatusOS.TESTES_REALIZADOS });
      prisma.oSHistorico.create.mockResolvedValue({});
      prisma.ordemServico.update.mockResolvedValue({});
      prisma.aparelho.findFirst.mockResolvedValueOnce(aparelho);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
    }

    it('cria débito CLIENTE→INFINITY quando aparelho instalado pertence à Infinity', async () => {
      const aparelho = {
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: 'INFINITY',
        clienteId: null,
        marca: 'Suntech',
        modelo: 'ST310U',
        simVinculadoId: null,
        simVinculado: null,
      };
      mockOsEAparelho(aparelho);
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 3 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({ id: 7 });
      debitosService.consolidarDebitoTx.mockResolvedValue(undefined);

      await service.updateStatus(5, { status: StatusOS.TESTES_REALIZADOS });

      expect(debitosService.consolidarDebitoTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          devedorTipo: 'CLIENTE',
          devedorClienteId: 2,
          credorTipo: 'INFINITY',
          credorClienteId: null,
          marcaId: 3,
          modeloId: 7,
          delta: 1,
          aparelhoId: 20,
          ordemServicoId: 5,
        }),
      );
    });

    it('cria débito CLIENTE_OS→CLIENTE_APARELHO quando aparelho pertence a outro cliente', async () => {
      const aparelho = {
        id: 30,
        status: StatusAparelho.COM_TECNICO,
        proprietario: 'CLIENTE',
        clienteId: 99,
        marca: 'Teltonika',
        modelo: 'FMB920',
        simVinculadoId: null,
        simVinculado: null,
      };
      mockOsEAparelho(aparelho);
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 5 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({ id: 12 });
      debitosService.consolidarDebitoTx.mockResolvedValue(undefined);

      await service.updateStatus(5, { status: StatusOS.TESTES_REALIZADOS });

      expect(debitosService.consolidarDebitoTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          devedorTipo: 'CLIENTE',
          devedorClienteId: 2,
          credorTipo: 'CLIENTE',
          credorClienteId: 99,
        }),
      );
    });

    it('não cria débito quando aparelho pertence ao próprio cliente da OS', async () => {
      const aparelho = {
        id: 40,
        status: StatusAparelho.COM_TECNICO,
        proprietario: 'CLIENTE',
        clienteId: 2,
        marca: 'Suntech',
        modelo: 'ST310U',
        simVinculadoId: null,
        simVinculado: null,
      };
      mockOsEAparelho(aparelho);

      await service.updateStatus(5, { status: StatusOS.TESTES_REALIZADOS });

      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
      expect(prisma.marcaEquipamento.findFirst).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando marca do aparelho não existe no catálogo', async () => {
      const aparelho = {
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: 'INFINITY',
        clienteId: null,
        marca: 'MarcaDesconhecida',
        modelo: 'ModeloX',
        simVinculadoId: null,
        simVinculado: null,
      };
      mockOsEAparelho(aparelho);
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateStatus(5, { status: StatusOS.TESTES_REALIZADOS }),
      ).rejects.toThrow(BadRequestException);
      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando modelo do aparelho não existe no catálogo', async () => {
      const aparelho = {
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: 'INFINITY',
        clienteId: null,
        marca: 'Suntech',
        modelo: 'ModeloInexistente',
        simVinculadoId: null,
        simVinculado: null,
      };
      mockOsEAparelho(aparelho);
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 3 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateStatus(5, { status: StatusOS.TESTES_REALIZADOS }),
      ).rejects.toThrow(BadRequestException);
      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza idEntrada quando informado', async () => {
      const os = {
        id: 1,
        numero: 100,
        idEntrada: null,
        aparelhoEncontrado: null,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idEntrada: '862345678901234' });
      prisma.ordemServico.update.mockResolvedValue({
        ...os,
        idEntrada: '862345678901234',
      });

      const result = await service.update(1, { idEntrada: '862345678901234' });

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idEntrada: '862345678901234' },
      });
      expect(result).toMatchObject({ id: 1, idEntrada: '862345678901234' });
    });

    it('atualiza aparelhoEncontrado quando informado', async () => {
      const os = {
        id: 1,
        numero: 100,
        idEntrada: null,
        aparelhoEncontrado: null,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, aparelhoEncontrado: true });
      prisma.ordemServico.update.mockResolvedValue({
        ...os,
        aparelhoEncontrado: true,
      });

      const result = await service.update(1, { aparelhoEncontrado: true });

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { aparelhoEncontrado: true },
      });
      expect(result).toMatchObject({ id: 1, aparelhoEncontrado: true });
    });

    it('atualiza idEntrada e aparelhoEncontrado juntos', async () => {
      const os = {
        id: 1,
        numero: 100,
        idEntrada: null,
        aparelhoEncontrado: null,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({
          ...os,
          idEntrada: 'IMEI123',
          aparelhoEncontrado: false,
        });
      prisma.ordemServico.update.mockResolvedValue({
        ...os,
        idEntrada: 'IMEI123',
        aparelhoEncontrado: false,
      });

      await service.update(1, {
        idEntrada: 'IMEI123',
        aparelhoEncontrado: false,
      });

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idEntrada: 'IMEI123', aparelhoEncontrado: false },
      });
    });

    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      const promise = service.update(999, { idEntrada: 'xxx' });
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Ordem de serviço não encontrada');
      expect(prisma.ordemServico.update).not.toHaveBeenCalled();
    });

    it('constrói data apenas com campos informados', async () => {
      const os = { id: 1, numero: 100, historico: [] };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idEntrada: 'ABC123' });
      prisma.ordemServico.update.mockResolvedValue({});

      await service.update(1, { idEntrada: 'ABC123' });

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idEntrada: 'ABC123' },
      });
    });
  });

  describe('updateIdAparelho', () => {
    it('atualiza idAparelho com valor válido', async () => {
      const os = {
        id: 1,
        numero: 1,
        idAparelho: '862345678901234',
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idAparelho: '862345678901234' });
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateIdAparelho(1, '862345678901234');

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idAparelho: '862345678901234' },
      });
      expect(result).toMatchObject({ id: 1, idAparelho: '862345678901234' });
    });

    it('salva null quando string vazia é passada', async () => {
      const os = { id: 1, numero: 1, idAparelho: 'xxx', historico: [] };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idAparelho: null });
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateIdAparelho(1, '');

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idAparelho: null },
      });
    });

    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      const promise = service.updateIdAparelho(999, '862345');
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Ordem de serviço não encontrada');
      expect(prisma.ordemServico.update).not.toHaveBeenCalled();
    });

    it('em REVISAO grava IMEI novo em idEntrada e preserva idAparelho original', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.REVISAO,
        idAparelho: 'IMEI_ORIGINAL',
        idEntrada: null,
        iccidAparelho: '8955011110000000001',
        iccidEntrada: null,
        historico: [],
      };
      const updated = {
        ...os,
        idEntrada: 'IMEI_NOVO',
        iccidEntrada: '8955022220000000002',
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce(updated);
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        simVinculado: { identificador: '8955022220000000002' },
      });
      prisma.ordemServico.update.mockResolvedValue({});

      const result = await service.updateIdAparelho(1, 'IMEI_NOVO');

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          idEntrada: 'IMEI_NOVO',
          iccidEntrada: '8955022220000000002',
        },
      });
      expect(prisma.ordemServico.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ idAparelho: expect.anything() }),
        }),
      );
      expect(result).toMatchObject(updated);
    });

    it('em REVISAO quando aparelho novo não tem SIM vinculado grava iccidEntrada null', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.REVISAO,
        idAparelho: 'IMEI_ORIGINAL',
        idEntrada: null,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idEntrada: 'IMEI_NOVO' });
      prisma.aparelho.findFirst.mockResolvedValueOnce({ simVinculado: null });
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateIdAparelho(1, 'IMEI_NOVO');

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idEntrada: 'IMEI_NOVO', iccidEntrada: null },
      });
    });

    it('em REVISAO ao limpar valor grava idEntrada=null e iccidEntrada=null sem mexer em idAparelho', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.REVISAO,
        idAparelho: 'IMEI_ORIGINAL',
        idEntrada: 'IMEI_QUE_SAI',
        iccidEntrada: '8955022220000000002',
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idEntrada: null, iccidEntrada: null });
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateIdAparelho(1, '');

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idEntrada: null, iccidEntrada: null },
      });
      expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
    });

    it('em RETIRADA grava IMEI em idAparelho (fluxo distinto de REVISAO)', async () => {
      const os = {
        id: 1,
        numero: 1,
        tipo: TipoOS.RETIRADA,
        idAparelho: 'RET_ANT',
        idEntrada: null,
        historico: [],
      };
      prisma.ordemServico.findUnique
        .mockResolvedValueOnce(os)
        .mockResolvedValueOnce({ ...os, idAparelho: 'RET_NOVO' });
      prisma.ordemServico.update.mockResolvedValue({});

      await service.updateIdAparelho(1, 'RET_NOVO');

      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { idAparelho: 'RET_NOVO' },
      });
      expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('gerarHtmlImpressao', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      const promise = service.gerarHtmlImpressao(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Ordem de serviço não encontrada');
      expect(htmlGenerator.gerar).not.toHaveBeenCalled();
    });

    it('chama findOne, repassa OS ao gerador e retorna o HTML', async () => {
      const os = {
        id: 1,
        numero: 42,
        tipo: 'INSTALACAO_COM_BLOQUEIO' as const,
        status: StatusOS.AGENDADO,
        cliente: { id: 1, nome: 'Cliente ABC' },
        subcliente: { id: 1, nome: 'Subcliente X' },
        veiculo: { id: 1, placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno' },
        tecnico: { id: 1, nome: 'João Silva' },
        historico: [],
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);
      const html = '<html>OS 42</html>';
      htmlGenerator.gerar.mockReturnValue(html);

      const result = await service.gerarHtmlImpressao(1);

      expect(prisma.ordemServico.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.objectContaining({
            cliente: true,
            subcliente: true,
            veiculo: true,
            tecnico: true,
          }),
        }),
      );
      expect(htmlGenerator.gerar).toHaveBeenCalledWith(os);
      expect(result).toBe(html);
      expect(typeof result).toBe('string');
    });
  });

  describe('gerarPdf', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      const promise = service.gerarPdf(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      expect(pdfGenerator.gerar).not.toHaveBeenCalled();
    });

    it('chama findOne, repassa OS ao gerador PDF e retorna buffer e numero', async () => {
      const os = {
        id: 1,
        numero: 42,
        tipo: 'INSTALACAO_COM_BLOQUEIO' as const,
        status: StatusOS.AGENDADO,
        cliente: { id: 1, nome: 'Cliente ABC' },
        subcliente: null,
        veiculo: null,
        tecnico: null,
        historico: [],
      };
      prisma.ordemServico.findUnique.mockResolvedValue(os);
      const buffer = Buffer.from('fake-pdf');
      pdfGenerator.gerar.mockResolvedValue(buffer);

      const result = await service.gerarPdf(1);

      expect(prisma.ordemServico.findUnique).toHaveBeenCalled();
      expect(pdfGenerator.gerar).toHaveBeenCalledWith(os);
      expect(result).toEqual({ buffer, numero: 42 });
    });
  });
});
