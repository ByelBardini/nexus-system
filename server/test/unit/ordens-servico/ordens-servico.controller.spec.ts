import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdensServicoController } from 'src/ordens-servico/ordens-servico.controller';
import { OrdensServicoService } from 'src/ordens-servico/ordens-servico.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { StatusOS } from '@prisma/client';

describe('OrdensServicoController', () => {
  let controller: OrdensServicoController;
  let service: OrdensServicoService;

  const serviceMock = {
    getClienteInfinityOuCriar: jest.fn(),
    getResumo: jest.fn(),
    findTestando: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateIdAparelho: jest.fn(),
    gerarHtmlImpressao: jest.fn(),
    gerarPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdensServicoController],
      providers: [{ provide: OrdensServicoService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdensServicoController>(OrdensServicoController);
    service = module.get<OrdensServicoService>(OrdensServicoService);
    jest.clearAllMocks();
  });

  describe('getClienteInfinity', () => {
    it('delega para service.getClienteInfinityOuCriar e retorna clienteId', async () => {
      (service.getClienteInfinityOuCriar as jest.Mock).mockResolvedValue(5);

      const result = await controller.getClienteInfinity();

      expect(service.getClienteInfinityOuCriar).toHaveBeenCalled();
      expect(result).toEqual({ clienteId: 5 });
    });
  });

  describe('getResumo', () => {
    it('delega para service.getResumo', async () => {
      const resumo = { agendado: 5, emTestes: 3, testesRealizados: 2, aguardandoCadastro: 1, finalizado: 10 };
      (service.getResumo as jest.Mock).mockResolvedValue(resumo);

      const result = await controller.getResumo();

      expect(service.getResumo).toHaveBeenCalled();
      expect(result).toEqual(resumo);
    });
  });

  describe('findTestando', () => {
    it('chama service.findTestando sem search quando query vazia', async () => {
      (service.findTestando as jest.Mock).mockResolvedValue([]);

      await controller.findTestando();

      expect(service.findTestando).toHaveBeenCalledWith(undefined);
    });

    it('passa search para service.findTestando', async () => {
      (service.findTestando as jest.Mock).mockResolvedValue([]);

      await controller.findTestando('29480');

      expect(service.findTestando).toHaveBeenCalledWith('29480');
    });
  });

  describe('findAll', () => {
    it('converte page e limit para número e repassa parâmetros', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await controller.findAll('2', '20', StatusOS.AGENDADO, 'Carlos');

      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        status: StatusOS.AGENDADO,
        search: 'Carlos',
      });
    });

    it('passa undefined quando page e limit não informados', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({});

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: undefined,
        search: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('converte id para número e chama service', async () => {
      const os = { id: 7, numero: 7 };
      (service.findOne as jest.Mock).mockResolvedValue(os);

      const result = await controller.findOne('7');

      expect(service.findOne).toHaveBeenCalledWith(7);
      expect(result).toEqual(os);
    });
  });

  describe('create', () => {
    it('chama service.create com o DTO e criadoPorId (undefined quando sem auth)', async () => {
      const dto = { tipo: 'INSTALACAO', clienteId: 1 };
      (service.create as jest.Mock).mockResolvedValue({ id: 1, numero: 1 });

      await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto, undefined);
    });
  });

  describe('update', () => {
    it('converte id e chama service.update com dto', async () => {
      const dto = { idEntrada: 'IMEI123', aparelhoEncontrado: true };
      (service.update as jest.Mock).mockResolvedValue({ id: 1, idEntrada: 'IMEI123', aparelhoEncontrado: true });

      await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('updateStatus', () => {
    it('converte id e chama service.updateStatus', async () => {
      const dto = { status: StatusOS.EM_TESTES };
      (service.updateStatus as jest.Mock).mockResolvedValue({ id: 3, status: StatusOS.EM_TESTES });

      await controller.updateStatus('3', dto);

      expect(service.updateStatus).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('updateIdAparelho', () => {
    it('converte id para número e chama service.updateIdAparelho com idAparelho', async () => {
      const dto = { idAparelho: '862345678901234' };
      (service.updateIdAparelho as jest.Mock).mockResolvedValue({ id: 1, idAparelho: '862345678901234' });

      await controller.updateIdAparelho('1', dto);

      expect(service.updateIdAparelho).toHaveBeenCalledWith(1, '862345678901234');
    });
  });

  describe('getHtmlImpressao', () => {
    it('converte id para número e chama service.gerarHtmlImpressao', async () => {
      const html = '<html>OS</html>';
      (service.gerarHtmlImpressao as jest.Mock).mockResolvedValue(html);

      const result = await controller.getHtmlImpressao('5');

      expect(service.gerarHtmlImpressao).toHaveBeenCalledWith(5);
      expect(result).toBe(html);
    });
  });

  describe('getPdf', () => {
    it('converte id para número, chama service.gerarPdf e retorna StreamableFile', async () => {
      const buffer = Buffer.from('fake-pdf');
      (service.gerarPdf as jest.Mock).mockResolvedValue({ buffer, numero: 42 });

      const result = await controller.getPdf('5');

      expect(service.gerarPdf).toHaveBeenCalledWith(5);
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
