import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdensServicoService } from 'src/ordens-servico/ordens-servico.service';
import { HtmlOrdemServicoGenerator } from 'src/ordens-servico/html-ordem-servico.generator';
import { PdfOrdemServicoGenerator } from 'src/ordens-servico/pdf-ordem-servico.generator';
import { StatusOS } from '@prisma/client';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('OrdensServicoService', () => {
  let service: OrdensServicoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let htmlGenerator: jest.Mocked<HtmlOrdemServicoGenerator>;
  let pdfGenerator: jest.Mocked<PdfOrdemServicoGenerator>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    htmlGenerator = { gerar: jest.fn() } as unknown as jest.Mocked<HtmlOrdemServicoGenerator>;
    pdfGenerator = { gerar: jest.fn() } as unknown as jest.Mocked<PdfOrdemServicoGenerator>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdensServicoService,
        { provide: PrismaService, useValue: prisma },
        { provide: HtmlOrdemServicoGenerator, useValue: htmlGenerator },
        { provide: PdfOrdemServicoGenerator, useValue: pdfGenerator },
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

  describe('findAll', () => {
    it('retorna resultado paginado com defaults de page=1 e limit=15', async () => {
      const items = [{ id: 1, numero: 1, status: StatusOS.AGENDADO }];
      prisma.ordemServico.findMany.mockResolvedValue(items);
      prisma.ordemServico.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({ data: items, total: 1, page: 1, limit: 15, totalPages: 1 });
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

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Ordem de serviço não encontrada');
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
      prisma.ordemServico.aggregate.mockResolvedValue({ _max: { numero: null } });
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

      const result = await service.create(
        {
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
        } as any,
      );

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

      const result = await service.create({ tipo: 'RETIRADA', clienteId: 1 } as any);

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

      await expect(service.updateStatus(999, { status: StatusOS.EM_TESTES })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna OS sem alterar quando status já é o mesmo', async () => {
      const os = { id: 1, numero: 1, status: StatusOS.AGENDADO, historico: [] };
      prisma.ordemServico.findUnique.mockResolvedValue(os);

      const result = await service.updateStatus(1, { status: StatusOS.AGENDADO });

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

      const result = await service.updateStatus(1, { status: StatusOS.EM_TESTES });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toMatchObject({ status: StatusOS.EM_TESTES });
    });
  });

  describe('gerarHtmlImpressao', () => {
    it('lança NotFoundException quando OS não existe', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue(null);

      await expect(service.gerarHtmlImpressao(999)).rejects.toThrow(NotFoundException);
      await expect(service.gerarHtmlImpressao(999)).rejects.toThrow('Ordem de serviço não encontrada');
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

      await expect(service.gerarPdf(999)).rejects.toThrow(NotFoundException);
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
