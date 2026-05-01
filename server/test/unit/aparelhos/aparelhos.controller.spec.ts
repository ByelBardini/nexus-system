import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AparelhosController } from 'src/aparelhos/aparelhos.controller';
import { AparelhosService } from 'src/aparelhos/aparelhos.service';
import { LotesService } from 'src/aparelhos/lotes.service';
import { KitsService } from 'src/aparelhos/kits.service';
import { PareamentoService } from 'src/aparelhos/pareamento.service';
import { UsersService } from 'src/users/users.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('AparelhosController', () => {
  let controller: AparelhosController;
  let aparelhosService: AparelhosService;
  let lotesService: LotesService;
  let kitsService: KitsService;
  let pareamentoService: PareamentoService;

  const aparelhosMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findParaTestes: jest.fn(),
    getResumo: jest.fn(),
    createIndividual: jest.fn(),
    updateStatus: jest.fn(),
    listarDescartados: jest.fn(),
  };

  const lotesMock = {
    createLote: jest.fn(),
    getLotesParaPareamento: jest.fn(),
  };

  const kitsMock = {
    getKitsComDetalhes: jest.fn(),
    getKitById: jest.fn(),
    updateAparelhoKit: jest.fn(),
    getAparelhosDisponiveisParaKit: jest.fn(),
    criarOuBuscarKitPorNome: jest.fn(),
  };

  const pareamentoMock = {
    pareamentoPreview: jest.fn(),
    pareamento: jest.fn(),
    pareamentoCsvPreview: jest.fn(),
    pareamentoCsv: jest.fn(),
  };

  const usersMock = {
    findByEmail: jest.fn(),
    getPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AparelhosController],
      providers: [
        { provide: AparelhosService, useValue: aparelhosMock },
        { provide: LotesService, useValue: lotesMock },
        { provide: KitsService, useValue: kitsMock },
        { provide: PareamentoService, useValue: pareamentoMock },
        { provide: UsersService, useValue: usersMock },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AparelhosController>(AparelhosController);
    aparelhosService = module.get<AparelhosService>(AparelhosService);
    lotesService = module.get<LotesService>(LotesService);
    kitsService = module.get<KitsService>(KitsService);
    pareamentoService = module.get<PareamentoService>(PareamentoService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delega para aparelhosService.findAll', async () => {
      (aparelhosService.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll();

      expect(aparelhosService.findAll).toHaveBeenCalled();
    });
  });

  describe('listarDescartados', () => {
    it('delega para aparelhosService.listarDescartados', async () => {
      (aparelhosService.listarDescartados as jest.Mock).mockResolvedValue([]);

      await controller.listarDescartados();

      expect(aparelhosService.listarDescartados).toHaveBeenCalled();
    });
  });

  describe('findParaTestes', () => {
    it('converte clienteId, tecnicoId e ordemServicoId para número e chama service', async () => {
      (aparelhosService.findParaTestes as jest.Mock).mockResolvedValue([]);

      await controller.findParaTestes('10', '5', '42');

      expect(aparelhosService.findParaTestes).toHaveBeenCalledWith(10, 5, 42);
    });
  });

  describe('findOne', () => {
    it('converte id para número e chama aparelhosService', async () => {
      const aparelho = { id: 5, identificador: '123' };
      (aparelhosService.findOne as jest.Mock).mockResolvedValue(aparelho);

      const result = await controller.findOne('5');

      expect(aparelhosService.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(aparelho);
    });
  });

  describe('getResumo', () => {
    it('delega para aparelhosService.getResumo', async () => {
      const resumo = { total: 10, porStatus: {}, porTipo: {} };
      (aparelhosService.getResumo as jest.Mock).mockResolvedValue(resumo);

      const result = await controller.getResumo();

      expect(aparelhosService.getResumo).toHaveBeenCalled();
      expect(result).toEqual(resumo);
    });
  });

  describe('createLote', () => {
    it('chama lotesService.createLote com o DTO', async () => {
      const dto = { referencia: 'LOT-001', quantidade: 10 } as any;
      (lotesService.createLote as jest.Mock).mockResolvedValue({ id: 1 });

      await controller.createLote(dto);

      expect(lotesService.createLote).toHaveBeenCalledWith(dto);
    });
  });

  describe('createIndividual', () => {
    it('chama aparelhosService.createIndividual sem verificar permissão quando destinoDefeito não é DESCARTADO', async () => {
      const dto = {
        identificador: 'IMEI123',
        tipo: 'RASTREADOR',
        destinoDefeito: 'EM_ESTOQUE_DEFEITO',
      } as any;
      (aparelhosService.createIndividual as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await controller.createIndividual(dto, 'user@test.com');

      expect(usersMock.findByEmail).not.toHaveBeenCalled();
      expect(aparelhosService.createIndividual).toHaveBeenCalledWith(dto);
    });

    it('com destinoDefeito=DESCARTADO e permissão EXCLUIR: delega ao service', async () => {
      const dto = {
        identificador: 'IMEI123',
        tipo: 'RASTREADOR',
        destinoDefeito: 'DESCARTADO',
      } as any;
      const fakeUser = { id: 1, email: 'user@test.com' };
      usersMock.findByEmail.mockResolvedValue(fakeUser);
      usersMock.getPermissions.mockReturnValue([
        'CONFIGURACAO.APARELHO.EXCLUIR',
      ]);
      (aparelhosService.createIndividual as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await controller.createIndividual(dto, 'user@test.com');

      expect(usersMock.findByEmail).toHaveBeenCalledWith('user@test.com');
      expect(aparelhosService.createIndividual).toHaveBeenCalledWith(dto);
    });

    it('com destinoDefeito=DESCARTADO sem permissão EXCLUIR: lança ForbiddenException', async () => {
      const dto = {
        identificador: 'IMEI123',
        tipo: 'RASTREADOR',
        destinoDefeito: 'DESCARTADO',
      } as any;
      const fakeUser = { id: 1, email: 'user@test.com' };
      usersMock.findByEmail.mockResolvedValue(fakeUser);
      usersMock.getPermissions.mockReturnValue(['CONFIGURACAO.APARELHO.CRIAR']);

      await expect(
        controller.createIndividual(dto, 'user@test.com'),
      ).rejects.toThrow(ForbiddenException);
      expect(aparelhosService.createIndividual).not.toHaveBeenCalled();
    });

    it('com destinoDefeito=DESCARTADO e usuário não encontrado: lança ForbiddenException', async () => {
      const dto = {
        identificador: 'IMEI123',
        tipo: 'RASTREADOR',
        destinoDefeito: 'DESCARTADO',
      } as any;
      usersMock.findByEmail.mockResolvedValue(null);

      await expect(
        controller.createIndividual(dto, 'user@test.com'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('converte id e chama aparelhosService.updateStatus com status e observacao', async () => {
      (aparelhosService.updateStatus as jest.Mock).mockResolvedValue({});

      await controller.updateStatus('3', {
        status: 'CONFIGURADO',
        observacao: 'ok',
      });

      expect(aparelhosService.updateStatus).toHaveBeenCalledWith(
        3,
        'CONFIGURADO',
        'ok',
      );
    });
  });

  describe('pareamentoPreview', () => {
    it('chama pareamentoService.pareamentoPreview com os pares', async () => {
      const pares = [{ imei: '123456789012345', iccid: '123456789012345678' }];
      (pareamentoService.pareamentoPreview as jest.Mock).mockResolvedValue({
        linhas: [],
        contadores: {},
      });

      await controller.pareamentoPreview({ pares });

      expect(pareamentoService.pareamentoPreview).toHaveBeenCalledWith(pares);
    });

    it('passa lista vazia quando pares não informados', async () => {
      (pareamentoService.pareamentoPreview as jest.Mock).mockResolvedValue({
        linhas: [],
        contadores: {},
      });

      await controller.pareamentoPreview({} as any);

      expect(pareamentoService.pareamentoPreview).toHaveBeenCalledWith([]);
    });
  });

  describe('pareamento', () => {
    it('chama pareamentoService.pareamento com o DTO', async () => {
      const dto = { pares: [{ imei: '123', iccid: '456' }] };
      (pareamentoService.pareamento as jest.Mock).mockResolvedValue({
        criados: 1,
      });

      await controller.pareamento(dto as any);

      expect(pareamentoService.pareamento).toHaveBeenCalledWith({
        pares: dto.pares,
        loteRastreadorId: undefined,
        loteSimId: undefined,
        rastreadorManual: undefined,
        simManual: undefined,
        kitId: undefined,
        kitNome: undefined,
        proprietario: 'INFINITY',
        clienteId: undefined,
        tecnicoId: undefined,
      });
    });
  });

  describe('pareamentoCsvPreview', () => {
    it('delega para pareamentoService.pareamentoCsvPreview com o DTO', async () => {
      const dto = {
        linhas: [{ imei: '123', iccid: '456', marcaRastreador: 'Suntech' }],
        proprietario: 'INFINITY',
      };
      (pareamentoService.pareamentoCsvPreview as jest.Mock).mockResolvedValue({
        linhas: [],
        contadores: { validos: 0, comAviso: 0, erros: 0 },
      });

      await controller.pareamentoCsvPreview(dto as any);

      expect(pareamentoService.pareamentoCsvPreview).toHaveBeenCalledWith(dto);
    });
  });

  describe('pareamentoCsv', () => {
    it('delega para pareamentoService.pareamentoCsv com o DTO', async () => {
      const dto = {
        linhas: [{ imei: '123', iccid: '456' }],
        proprietario: 'CLIENTE',
        clienteId: 10,
      };
      (pareamentoService.pareamentoCsv as jest.Mock).mockResolvedValue({
        criados: 1,
        equipamentos: [],
      });

      await controller.pareamentoCsv(dto as any);

      expect(pareamentoService.pareamentoCsv).toHaveBeenCalledWith(dto);
    });
  });

  describe('getKitsComDetalhes', () => {
    it('delega para kitsService.getKitsComDetalhes', async () => {
      (kitsService.getKitsComDetalhes as jest.Mock).mockResolvedValue([]);

      await controller.getKitsComDetalhes();

      expect(kitsService.getKitsComDetalhes).toHaveBeenCalled();
    });
  });

  describe('getKitById', () => {
    it('converte id para número e chama kitsService', async () => {
      (kitsService.getKitById as jest.Mock).mockResolvedValue({
        id: 2,
        nome: 'Kit-B',
      });

      await controller.getKitById('2');

      expect(kitsService.getKitById).toHaveBeenCalledWith(2);
    });
  });

  describe('updateAparelhoKit', () => {
    it('converte id e chama kitsService.updateAparelhoKit', async () => {
      (kitsService.updateAparelhoKit as jest.Mock).mockResolvedValue({});

      await controller.updateAparelhoKit('7', { kitId: 3 });

      expect(kitsService.updateAparelhoKit).toHaveBeenCalledWith(7, 3);
    });
  });

  describe('getAparelhosDisponiveisParaKit', () => {
    it('delega para kitsService.getAparelhosDisponiveisParaKit', async () => {
      (
        kitsService.getAparelhosDisponiveisParaKit as jest.Mock
      ).mockResolvedValue([]);

      await controller.getAparelhosDisponiveisParaKit();

      expect(kitsService.getAparelhosDisponiveisParaKit).toHaveBeenCalled();
    });
  });

  describe('createKit', () => {
    it('chama kitsService.criarOuBuscarKitPorNome com nome trimado', async () => {
      (kitsService.criarOuBuscarKitPorNome as jest.Mock).mockResolvedValue({
        id: 1,
        nome: 'Kit-X',
      });

      await controller.createKit({ nome: '  Kit-X  ' });

      expect(kitsService.criarOuBuscarKitPorNome).toHaveBeenCalledWith('Kit-X');
    });
  });

  describe('getLotesRastreadores', () => {
    it('chama lotesService.getLotesParaPareamento com tipo RASTREADOR', async () => {
      (lotesService.getLotesParaPareamento as jest.Mock).mockResolvedValue([]);

      await controller.getLotesRastreadores();

      expect(lotesService.getLotesParaPareamento).toHaveBeenCalledWith(
        'RASTREADOR',
      );
    });
  });

  describe('getLotesSims', () => {
    it('chama lotesService.getLotesParaPareamento com tipo SIM', async () => {
      (lotesService.getLotesParaPareamento as jest.Mock).mockResolvedValue([]);

      await controller.getLotesSims();

      expect(lotesService.getLotesParaPareamento).toHaveBeenCalledWith('SIM');
    });
  });
});
