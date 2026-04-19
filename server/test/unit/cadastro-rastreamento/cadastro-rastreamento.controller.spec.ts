import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Plataforma, StatusCadastro } from '@prisma/client';
import { CadastroRastreamentoController } from 'src/cadastro-rastreamento/cadastro-rastreamento.controller';
import { CadastroRastreamentoService } from 'src/cadastro-rastreamento/cadastro-rastreamento.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('CadastroRastreamentoController', () => {
  let controller: CadastroRastreamentoController;
  let service: CadastroRastreamentoService;

  const serviceMock = {
    findPendentes: jest.fn(),
    iniciarCadastro: jest.fn(),
    concluirCadastro: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CadastroRastreamentoController],
      providers: [
        { provide: CadastroRastreamentoService, useValue: serviceMock },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CadastroRastreamentoController>(
      CadastroRastreamentoController,
    );
    service = module.get<CadastroRastreamentoService>(
      CadastroRastreamentoService,
    );
    jest.clearAllMocks();
  });

  // ─── findPendentes ──────────────────────────────────────────────────────────

  describe('findPendentes', () => {
    it('delega para service.findPendentes e retorna o resultado', async () => {
      const resultado = { data: [], total: 0 };
      (service.findPendentes as jest.Mock).mockResolvedValue(resultado);

      const result = await controller.findPendentes({});

      expect(service.findPendentes).toHaveBeenCalled();
      expect(result).toEqual(resultado);
    });

    it('converte page e limit de string para número', async () => {
      (service.findPendentes as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findPendentes({ page: '2' as any, limit: '10' as any });

      expect(service.findPendentes).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      );
    });

    it('repassa statusCadastro sem transformação', async () => {
      (service.findPendentes as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findPendentes({
        statusCadastro: StatusCadastro.EM_CADASTRO,
      });

      expect(service.findPendentes).toHaveBeenCalledWith(
        expect.objectContaining({ statusCadastro: StatusCadastro.EM_CADASTRO }),
      );
    });

    it('repassa plataforma sem transformação', async () => {
      (service.findPendentes as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findPendentes({ plataforma: Plataforma.GETRAK });

      expect(service.findPendentes).toHaveBeenCalledWith(
        expect.objectContaining({ plataforma: Plataforma.GETRAK }),
      );
    });

    it('repassa dataInicio e dataFim para o service quando informadas', async () => {
      (service.findPendentes as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      const dataInicio = new Date('2025-01-01');
      const dataFim = new Date('2025-01-31');

      await controller.findPendentes({ dataInicio, dataFim });

      const call = (service.findPendentes as jest.Mock).mock.calls[0][0];
      expect(call.dataInicio).toBe(dataInicio);
      expect(call.dataFim).toBe(dataFim);
    });

    it('não inclui dataInicio/dataFim na chamada quando não informados', async () => {
      (service.findPendentes as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findPendentes({});

      const call = (service.findPendentes as jest.Mock).mock.calls[0][0];
      expect(call.dataInicio).toBeUndefined();
      expect(call.dataFim).toBeUndefined();
    });
  });

  // ─── iniciarCadastro ────────────────────────────────────────────────────────

  describe('iniciarCadastro', () => {
    it('converte id de string para número e chama service.iniciarCadastro', async () => {
      const os = { id: 1, statusCadastro: 'EM_CADASTRO' };
      (service.iniciarCadastro as jest.Mock).mockResolvedValue(os);

      const result = await controller.iniciarCadastro('1');

      expect(service.iniciarCadastro).toHaveBeenCalledWith(1);
      expect(result).toEqual(os);
    });

    it('propaga NotFoundException do service', async () => {
      (service.iniciarCadastro as jest.Mock).mockRejectedValue(
        new NotFoundException('Ordem de serviço não encontrada'),
      );

      await expect(controller.iniciarCadastro('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propaga BadRequestException do service', async () => {
      (service.iniciarCadastro as jest.Mock).mockRejectedValue(
        new BadRequestException('Cadastro já iniciado'),
      );

      await expect(controller.iniciarCadastro('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── concluirCadastro ───────────────────────────────────────────────────────

  describe('concluirCadastro', () => {
    // Nota: @CurrentUser('id') extrai req.user.id via decorator HTTP.
    // Em testes unitários diretos, passamos o valor extraído (userId: number) diretamente.

    it('converte id de string para número e passa dto e userId ao service', async () => {
      const os = { id: 1, statusCadastro: 'CONCLUIDO' };
      (service.concluirCadastro as jest.Mock).mockResolvedValue(os);
      const dto = { plataforma: Plataforma.GETRAK };

      const result = await controller.concluirCadastro('1', dto, 10);

      expect(service.concluirCadastro).toHaveBeenCalledWith(1, dto, 10);
      expect(result).toEqual(os);
    });

    it('propaga NotFoundException do service', async () => {
      (service.concluirCadastro as jest.Mock).mockRejectedValue(
        new NotFoundException('Ordem de serviço não encontrada'),
      );

      await expect(
        controller.concluirCadastro(
          '999',
          { plataforma: Plataforma.GETRAK },
          10,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('propaga BadRequestException do service', async () => {
      (service.concluirCadastro as jest.Mock).mockRejectedValue(
        new BadRequestException('Status inválido para conclusão'),
      );

      await expect(
        controller.concluirCadastro('1', { plataforma: Plataforma.SELSYN }, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('passa userId do token ao service', async () => {
      (service.concluirCadastro as jest.Mock).mockResolvedValue({});

      await controller.concluirCadastro(
        '5',
        { plataforma: Plataforma.GEOMAPS },
        42,
      );

      expect(service.concluirCadastro).toHaveBeenCalledWith(
        5,
        expect.anything(),
        42,
      );
    });
  });
});
