import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  Prisma,
  ProprietarioTipo,
  StatusAparelho,
  StatusOS,
  TipoOS,
} from '@prisma/client';
import {
  OrdemServicoStatusSideEffectsService,
  type OrdemServicoContextoTestesRealizados,
} from 'src/ordens-servico/ordem-servico-status-side-effects.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('OrdemServicoStatusSideEffectsService', () => {
  let service: OrdemServicoStatusSideEffectsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let debitosService: jest.Mocked<
    Pick<DebitosRastreadoresService, 'consolidarDebitoTx'>
  >;

  const tx = () => prisma as unknown as Prisma.TransactionClient;

  function baseCtx(
    over: Partial<OrdemServicoContextoTestesRealizados> = {},
  ): OrdemServicoContextoTestesRealizados {
    return {
      tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
      numero: 10,
      clienteId: 2,
      idAparelho: 'IMEI_INST',
      idEntrada: null,
      veiculoId: 7,
      veiculo: { placa: 'ABC1D23' },
      ...over,
    };
  }

  beforeEach(async () => {
    prisma = createPrismaMock();
    debitosService = { consolidarDebitoTx: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdemServicoStatusSideEffectsService,
        { provide: DebitosRastreadoresService, useValue: debitosService },
      ],
    }).compile();

    service = module.get(OrdemServicoStatusSideEffectsService);
    jest.clearAllMocks();
  });

  describe('aplicarSeTestesRealizados', () => {
    it('não faz nada quando novo status não é TESTES_REALIZADOS', async () => {
      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.EM_TESTES,
        baseCtx(),
      );

      expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
    });

    it('em INSTALACAO não desvincula mas pode instalar rastreador novo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: null,
        modelo: null,
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ tipo: TipoOS.INSTALACAO_COM_BLOQUEIO, idAparelho: 'IMEI_X' }),
      );

      expect(prisma.aparelho.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: 'IMEI_X', tipo: 'RASTREADOR' },
        }),
      );
    });

    it('INSTALACAO_SEM_BLOQUEIO segue o mesmo fluxo de instalação que COM_BLOQUEIO', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 21,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: null,
        modelo: null,
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        3,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ tipo: TipoOS.INSTALACAO_SEM_BLOQUEIO, idAparelho: 'IMEI_Y' }),
      );

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: 'IMEI_Y', tipo: 'RASTREADOR' },
        }),
      );
    });
  });

  describe('desvincular aparelho de saída (REVISÃO / RETIRADA)', () => {
    it('não consulta aparelho quando tipo não é REVISÃO nem RETIRADA', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ tipo: TipoOS.INSTALACAO_SEM_BLOQUEIO, idAparelho: 'X' }),
      );

      expect(prisma.aparelho.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identificador: 'X', tipo: 'RASTREADOR' },
        }),
      );
      const chamadasSoDesvinculo = prisma.aparelho.findFirst.mock.calls.filter(
        (c) => {
          const w = (c[0] as { where?: { tipo?: string } })?.where;
          return w && !('tipo' in w && w.tipo === 'RASTREADOR');
        },
      );
      expect(chamadasSoDesvinculo).toHaveLength(0);
    });

    it('não desvincula quando idAparelho é nulo', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ tipo: TipoOS.REVISAO, idAparelho: null }),
      );

      const semTipoRastreador = prisma.aparelho.findFirst.mock.calls.filter(
        (c) => !(c[0] as { where?: { tipo?: string } }).where?.tipo,
      );
      expect(semTipoRastreador).toHaveLength(0);
    });

    it('não desvincula quando veiculoId é nulo', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          idAparelho: 'IMEI',
          veiculoId: null,
          veiculo: null,
        }),
      );

      const semTipoRastreador = prisma.aparelho.findFirst.mock.calls.filter(
        (c) => !(c[0] as { where?: { tipo?: string } }).where?.tipo,
      );
      expect(semTipoRastreador).toHaveLength(0);
    });

    it('não desvincula quando idAparelho é só espaços', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ tipo: TipoOS.REVISAO, idAparelho: '  \t  ' }),
      );

      const semTipoRastreador = prisma.aparelho.findFirst.mock.calls.filter(
        (c) => !(c[0] as { where?: { tipo?: string } }).where?.tipo,
      );
      expect(semTipoRastreador).toHaveLength(0);
    });

    it('não atualiza aparelho quando IMEI de saída não existe', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          numero: 42,
          idAparelho: 'IMEI_SAIDA',
          idEntrada: 'IMEI_NOVO',
        }),
      );

      expect(prisma.aparelho.update).not.toHaveBeenCalled();
    });

    it('não desvincula quando aparelho está em outro veículo', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 999,
        })
        .mockResolvedValueOnce(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          veiculoId: 7,
          idAparelho: 'IMEI_SAIDA',
          idEntrada: 'NOVO',
        }),
      );

      expect(prisma.aparelhoHistorico.create).not.toHaveBeenCalled();
      expect(prisma.aparelho.update).not.toHaveBeenCalled();
    });

    it('desvincula em REVISÃO com observação e placa do veículo', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 7,
        })
        .mockResolvedValueOnce(null);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          numero: 42,
          idAparelho: 'IMEI_SAIDA',
          idEntrada: 'X',
        }),
      );

      expect(prisma.aparelhoHistorico.create).toHaveBeenCalledWith({
        data: {
          aparelhoId: 55,
          statusAnterior: StatusAparelho.INSTALADO,
          statusNovo: StatusAparelho.COM_TECNICO,
          observacao: 'Retirado do veículo ABC1D23 via OS #42',
        },
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: {
          status: StatusAparelho.COM_TECNICO,
          veiculoId: null,
          subclienteId: null,
          observacao: 'Retirado do veículo ABC1D23 via OS #42',
        },
      });
    });

    it('usa placa "-" quando veículo da OS é nulo', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 7,
        })
        .mockResolvedValueOnce(null);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          numero: 1,
          idAparelho: 'IMEI',
          veiculo: null,
        }),
      );

      expect(prisma.aparelho.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            observacao: 'Retirado do veículo - via OS #1',
          }),
        }),
      );
    });

    it('desvincula em RETIRADA', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 77,
        status: StatusAparelho.INSTALADO,
        veiculoId: 3,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        2,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.RETIRADA,
          numero: 99,
          idAparelho: 'IMEI_R',
          veiculoId: 3,
          veiculo: { placa: 'XYZ9K88' },
        }),
      );

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
  });

  describe('instalar rastreador novo e débito', () => {
    it('RETIRADA não busca rastreador para instalação', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 77,
        status: StatusAparelho.INSTALADO,
        veiculoId: 3,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        2,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.RETIRADA,
          idAparelho: 'IMEI_R',
          veiculoId: 3,
          veiculo: { placa: 'X' },
        }),
      );

      const buscasRastreador = prisma.aparelho.findFirst.mock.calls.filter(
        (c) =>
          (c[0] as { where?: { tipo?: string } }).where?.tipo === 'RASTREADOR',
      );
      expect(buscasRastreador).toHaveLength(0);
    });

    it('não instala quando identificador novo fica vazio após trim (INSTALACAO)', async () => {
      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
          idAparelho: '   ',
        }),
      );

      expect(prisma.aparelho.findFirst).not.toHaveBeenCalled();
    });

    it('em REVISÃO usa idEntrada para buscar rastreador novo', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 10,
          status: StatusAparelho.COM_TECNICO,
          proprietario: ProprietarioTipo.CLIENTE,
          clienteId: 2,
          marca: null,
          modelo: null,
          simVinculadoId: null,
          simVinculado: null,
        });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          idAparelho: 'SAIDA',
          idEntrada: '  IMEI_NOVO  ',
          veiculoId: 7,
        }),
      );

      expect(prisma.aparelho.findFirst).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { identificador: 'IMEI_NOVO', tipo: 'RASTREADOR' },
        }),
      );
    });

    it('não grava histórico de instalação quando rastreador não existe', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.INSTALACAO_COM_BLOQUEIO,
          idAparelho: 'DESCONHECIDO',
        }),
      );

      expect(prisma.aparelhoHistorico.create).not.toHaveBeenCalled();
    });

    it('marca INSTALADO no rastreador e observação com placa quando há veículo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: 'Suntech',
        modelo: 'ST310U',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ numero: 10, idAparelho: 'IMEI' }),
      );

      expect(prisma.aparelhoHistorico.create).toHaveBeenCalledWith({
        data: {
          aparelhoId: 20,
          statusAnterior: StatusAparelho.COM_TECNICO,
          statusNovo: StatusAparelho.INSTALADO,
          observacao: 'Instalado via OS #10 | Placa: ABC1D23',
        },
      });
      expect(prisma.aparelho.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { status: StatusAparelho.INSTALADO },
      });
    });

    it('observação de instalação sem placa quando veículo é nulo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: null,
        modelo: null,
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ veiculo: null, idAparelho: 'IMEI' }),
      );

      expect(prisma.aparelhoHistorico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            observacao: 'Instalado via OS #10',
          }),
        }),
      );
    });

    it('atualiza SIM vinculado quando existir', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: null,
        modelo: null,
        simVinculadoId: 30,
        simVinculado: { id: 30, status: StatusAparelho.COM_TECNICO },
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ idAparelho: 'IMEI' }),
      );

      expect(prisma.aparelhoHistorico.create).toHaveBeenCalledTimes(2);
      expect(prisma.aparelho.update).toHaveBeenCalledTimes(2);
      expect(prisma.aparelho.update).toHaveBeenLastCalledWith({
        where: { id: 30 },
        data: { status: StatusAparelho.INSTALADO },
      });
    });

    it('não atualiza SIM quando simVinculadoId existe mas simVinculado veio nulo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: null,
        modelo: null,
        simVinculadoId: 30,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ idAparelho: 'IMEI' }),
      );

      expect(prisma.aparelho.update).toHaveBeenCalledTimes(1);
    });

    it('chama consolidarDebitoTx quando aparelho é da Infinity e há marca/modelo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.INFINITY,
        clienteId: null,
        marca: 'Suntech',
        modelo: 'ST310U',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 3 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({ id: 7 });
      debitosService.consolidarDebitoTx.mockResolvedValue(undefined);

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ clienteId: 2, idAparelho: 'IMEI' }),
      );

      expect(debitosService.consolidarDebitoTx).toHaveBeenCalledWith(
        tx(),
        expect.objectContaining({
          devedorTipo: ProprietarioTipo.CLIENTE,
          devedorClienteId: 2,
          credorTipo: ProprietarioTipo.INFINITY,
          credorClienteId: null,
          marcaId: 3,
          modeloId: 7,
          delta: 1,
          aparelhoId: 20,
          ordemServicoId: 5,
        }),
      );
    });

    it('chama consolidarDebitoTx quando aparelho pertence a outro cliente', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 30,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 99,
        marca: 'Teltonika',
        modelo: 'FMB920',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 5 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({ id: 12 });
      debitosService.consolidarDebitoTx.mockResolvedValue(undefined);

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ clienteId: 2, idAparelho: 'IMEI' }),
      );

      expect(debitosService.consolidarDebitoTx).toHaveBeenCalledWith(
        tx(),
        expect.objectContaining({
          credorTipo: ProprietarioTipo.CLIENTE,
          credorClienteId: 99,
        }),
      );
    });

    it('não chama débito quando aparelho CLIENTE é do mesmo cliente da OS', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 40,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.CLIENTE,
        clienteId: 2,
        marca: 'Suntech',
        modelo: 'ST310U',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ clienteId: 2, idAparelho: 'IMEI' }),
      );

      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
      expect(prisma.marcaEquipamento.findFirst).not.toHaveBeenCalled();
    });

    it('não chama débito quando precisa débito mas falta marca no aparelho', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.INFINITY,
        clienteId: null,
        marca: null,
        modelo: 'X',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ idAparelho: 'IMEI' }),
      );

      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
    });

    it('não chama débito quando precisa débito mas falta modelo no aparelho', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.INFINITY,
        clienteId: null,
        marca: 'Suntech',
        modelo: null,
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        5,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({ idAparelho: 'IMEI' }),
      );

      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando marca não existe no catálogo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.INFINITY,
        clienteId: null,
        marca: 'Z',
        modelo: 'M',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.aplicarSeTestesRealizados(
          tx(),
          5,
          StatusOS.TESTES_REALIZADOS,
          baseCtx({ idAparelho: 'IMEI' }),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(debitosService.consolidarDebitoTx).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando modelo não existe no catálogo', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce({
        id: 20,
        status: StatusAparelho.COM_TECNICO,
        proprietario: ProprietarioTipo.INFINITY,
        clienteId: null,
        marca: 'Suntech',
        modelo: 'Nope',
        simVinculadoId: null,
        simVinculado: null,
      });
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});
      prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({ id: 3 });
      prisma.modeloEquipamento.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.aplicarSeTestesRealizados(
          tx(),
          5,
          StatusOS.TESTES_REALIZADOS,
          baseCtx({ idAparelho: 'IMEI' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('em REVISÃO idEntrada vazio não tenta instalar após desvincular', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce({
          id: 55,
          status: StatusAparelho.INSTALADO,
          veiculoId: 7,
        })
        .mockResolvedValueOnce(null);
      prisma.aparelhoHistorico.create.mockResolvedValue({});
      prisma.aparelho.update.mockResolvedValue({});

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          idAparelho: 'SAIDA',
          idEntrada: null,
        }),
      );

      const buscasRastreador = prisma.aparelho.findFirst.mock.calls.filter(
        (c) =>
          (c[0] as { where?: { tipo?: string } }).where?.tipo === 'RASTREADOR',
      );
      expect(buscasRastreador).toHaveLength(0);
    });

    it('em REVISÃO idEntrada só com espaços não tenta instalar', async () => {
      prisma.aparelho.findFirst.mockResolvedValueOnce(null);

      await service.aplicarSeTestesRealizados(
        tx(),
        1,
        StatusOS.TESTES_REALIZADOS,
        baseCtx({
          tipo: TipoOS.REVISAO,
          idAparelho: 'SAIDA',
          idEntrada: '  \t  ',
        }),
      );

      const buscasRastreador = prisma.aparelho.findFirst.mock.calls.filter(
        (c) =>
          (c[0] as { where?: { tipo?: string } }).where?.tipo === 'RASTREADOR',
      );
      expect(buscasRastreador).toHaveLength(0);
    });
  });
});
