import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PareamentoService } from 'src/aparelhos/pareamento.service';
import { DebitosRastreadoresService } from 'src/debitos-rastreadores/debitos-rastreadores.service';
import { createPrismaMock } from '../helpers/prisma-mock';

const debitosMock = { consolidarDebitoTx: jest.fn() };

describe('PareamentoService', () => {
  let service: PareamentoService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PareamentoService,
        { provide: PrismaService, useValue: prisma },
        { provide: DebitosRastreadoresService, useValue: debitosMock },
      ],
    }).compile();

    service = module.get<PareamentoService>(PareamentoService);
    jest.clearAllMocks();
  });

  describe('pareamentoPreview', () => {
    it('retorna linhas e contadores quando pares informados', async () => {
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.pareamentoPreview([
        { imei: '123456789012345', iccid: '123456789012345678901' },
      ]);

      expect(result).toHaveProperty('linhas');
      expect(result).toHaveProperty('contadores');
      expect(result.linhas).toHaveLength(1);
      expect(result.linhas[0]).toMatchObject({
        imei: '123456789012345',
        iccid: '123456789012345678901',
      });
    });

    it('identifica FOUND_AVAILABLE quando rastreador e SIM existem e estão livres', async () => {
      const rastreador = {
        id: 1,
        simVinculadoId: null,
        marca: 'Suntech',
        modelo: 'ST-901',
      };
      const sim = { id: 2, aparelhosVinculados: [] };
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(rastreador)
        .mockResolvedValueOnce(sim);

      const result = await service.pareamentoPreview([
        { imei: '123456789012345', iccid: '123456789012345678901' },
      ]);

      expect(result.linhas[0].tracker_status).toBe('FOUND_AVAILABLE');
      expect(result.linhas[0].sim_status).toBe('FOUND_AVAILABLE');
      expect(result.linhas[0].action_needed).toBe('OK');
    });
  });

  describe('pareamento', () => {
    it('lança BadRequestException quando nenhum par informado', async () => {
      await expect(service.pareamento({ pares: [] })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.pareamento({ pares: [] })).rejects.toThrow(
        'Nenhum par informado',
      );
    });

    it('lança BadRequestException quando rastreador precisa de lote e não informado', async () => {
      prisma.aparelho.findFirst.mockResolvedValue(null);

      await expect(
        service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
        }),
      ).rejects.toThrow(/rastreador/);
    });

    it('executa pareamento em transação quando pares OK e lotes informados', async () => {
      const rastreador = { id: 1, simVinculadoId: null };
      const sim = { id: 2, aparelhosVinculados: [] };
      prisma.aparelho.findFirst
        .mockResolvedValueOnce(rastreador)
        .mockResolvedValueOnce(sim);

      prisma.aparelho.update.mockResolvedValue({});
      prisma.aparelhoHistorico.create.mockResolvedValue({});

      const result = await service.pareamento({
        pares: [{ imei: '123456789012345', iccid: '123456789012345678901' }],
        loteRastreadorId: 10,
        loteSimId: 20,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('criados');
      expect(result).toHaveProperty('equipamentos');
    });

    describe('geração de débito — rastreador FOUND_AVAILABLE', () => {
      const simId = 20;
      const trackerId = 10;
      const marcaId = 5;
      const modeloId = 15;

      beforeEach(() => {
        jest.spyOn(service, 'pareamentoPreview').mockResolvedValue({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              tracker_status: 'FOUND_AVAILABLE',
              sim_status: 'FOUND_AVAILABLE',
              action_needed: 'OK',
              trackerId,
              simId,
            },
          ],
          contadores: { validos: 1, exigemLote: 0, erros: 0 },
        });

        prisma.aparelho.update.mockResolvedValue({});
        prisma.aparelhoHistorico.create.mockResolvedValue({});
      });

      it('gera débito quando proprietário muda de CLIENTE para outro CLIENTE', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'CLIENTE',
          clienteId: 1,
          marca: 'Suntech',
          modelo: 'ST310U',
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
          nome: 'Suntech',
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({
          id: modeloId,
          nome: 'ST310U',
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 2,
        });

        expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
          prisma,
          expect.objectContaining({
            devedorTipo: 'CLIENTE',
            devedorClienteId: 2,
            credorTipo: 'CLIENTE',
            credorClienteId: 1,
            marcaId,
            modeloId,
            delta: 1,
            aparelhoId: trackerId,
          }),
        );
      });

      it('gera débito quando proprietário muda de INFINITY para CLIENTE', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'INFINITY',
          clienteId: null,
          marca: 'Suntech',
          modelo: 'ST310U',
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({
          id: modeloId,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 7,
        });

        expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
          prisma,
          expect.objectContaining({
            devedorTipo: 'CLIENTE',
            devedorClienteId: 7,
            credorTipo: 'INFINITY',
            credorClienteId: null,
            delta: 1,
          }),
        );
      });

      it('gera débito quando proprietário muda de CLIENTE para INFINITY', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'CLIENTE',
          clienteId: 3,
          marca: 'Suntech',
          modelo: 'ST310U',
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({
          id: modeloId,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'INFINITY',
        });

        expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
          prisma,
          expect.objectContaining({
            devedorTipo: 'INFINITY',
            devedorClienteId: null,
            credorTipo: 'CLIENTE',
            credorClienteId: 3,
            delta: 1,
          }),
        );
      });

      it('não gera débito quando proprietário permanece o mesmo', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'CLIENTE',
          clienteId: 5,
          marca: 'Suntech',
          modelo: 'ST310U',
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 5,
        });

        expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
      });

      it('não gera débito quando rastreador não tem marca', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'CLIENTE',
          clienteId: 1,
          marca: null,
          modelo: null,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 2,
        });

        expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
        expect(prisma.marcaEquipamento.findFirst).not.toHaveBeenCalled();
      });

      it('não gera débito quando marca não está no catálogo', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'CLIENTE',
          clienteId: 1,
          marca: 'MarcaDesconhecida',
          modelo: 'ST310U',
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce(null);

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 2,
        });

        expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
      });

      it('não gera débito quando modelo não está no catálogo', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'CLIENTE',
          clienteId: 1,
          marca: 'Suntech',
          modelo: 'ModeloDesconhecido',
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce(null);

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 2,
        });

        expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
      });

      it('atualiza SIM para proprietario=INFINITY e clienteId=null ao vincular', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 9,
        });

        expect(prisma.aparelho.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: simId },
            data: expect.objectContaining({
              status: 'CONFIGURADO',
              proprietario: 'INFINITY',
              clienteId: null,
            }),
          }),
        );
      });

      it('atualiza proprietario no update do rastreador ao vincular', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          proprietario: 'CLIENTE',
          clienteId: 9,
        });

        expect(prisma.aparelho.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: trackerId },
            data: expect.objectContaining({
              proprietario: 'CLIENTE',
              clienteId: 9,
            }),
          }),
        );
      });
    });

    describe('geração de débito — rastreador NEEDS_CREATE via lote', () => {
      const simId = 20;
      const trackerId = 30;
      const marcaId = 5;
      const modeloId = 15;

      beforeEach(() => {
        jest.spyOn(service, 'pareamentoPreview').mockResolvedValue({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              tracker_status: 'NEEDS_CREATE',
              sim_status: 'FOUND_AVAILABLE',
              action_needed: 'SELECT_TRACKER_LOT',
              trackerId: undefined,
              simId,
            },
          ],
          contadores: { validos: 0, exigemLote: 1, erros: 0 },
        });

        prisma.aparelho.update.mockResolvedValue({});
        prisma.aparelhoHistorico.create.mockResolvedValue({});
      });

      it('gera débito quando lote é da Infinity e destino é cliente', async () => {
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: trackerId,
          proprietario: 'INFINITY',
          clienteId: null,
          marca: 'Suntech',
          modelo: 'ST310U',
          lote: null,
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({
          id: modeloId,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          loteRastreadorId: 100,
          proprietario: 'CLIENTE',
          clienteId: 4,
        });

        expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
          prisma,
          expect.objectContaining({
            devedorTipo: 'CLIENTE',
            devedorClienteId: 4,
            credorTipo: 'INFINITY',
            credorClienteId: null,
            marcaId,
            modeloId,
            delta: 1,
            aparelhoId: trackerId,
          }),
        );
      });

      it('gera débito quando lote é de CLIENTE A e destino é CLIENTE B', async () => {
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: trackerId,
          proprietario: 'CLIENTE',
          clienteId: 1,
          marca: 'Suntech',
          modelo: 'ST310U',
          lote: null,
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({
          id: modeloId,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          loteRastreadorId: 100,
          proprietario: 'CLIENTE',
          clienteId: 8,
        });

        expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
          prisma,
          expect.objectContaining({
            devedorTipo: 'CLIENTE',
            devedorClienteId: 8,
            credorTipo: 'CLIENTE',
            credorClienteId: 1,
            delta: 1,
          }),
        );
      });

      it('usa marca e modelo do lote quando aparelho ainda não os tem', async () => {
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: trackerId,
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
          lote: { marca: 'Suntech', modelo: 'ST310U' },
        });
        prisma.marcaEquipamento.findFirst.mockResolvedValueOnce({
          id: marcaId,
          nome: 'Suntech',
        });
        prisma.modeloEquipamento.findFirst.mockResolvedValueOnce({
          id: modeloId,
          nome: 'ST310U',
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          loteRastreadorId: 100,
          proprietario: 'CLIENTE',
          clienteId: 6,
        });

        expect(prisma.marcaEquipamento.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({ where: { nome: 'Suntech' } }),
        );
        expect(prisma.modeloEquipamento.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({ where: { marcaId, nome: 'ST310U' } }),
        );
        expect(debitosMock.consolidarDebitoTx).toHaveBeenCalledWith(
          prisma,
          expect.objectContaining({ marcaId, modeloId, delta: 1 }),
        );
      });

      it('não gera débito quando lote e destino têm o mesmo proprietário', async () => {
        prisma.aparelho.findFirst.mockResolvedValueOnce({
          id: trackerId,
          proprietario: 'INFINITY',
          clienteId: null,
          marca: 'Suntech',
          modelo: 'ST310U',
          lote: null,
        });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          loteRastreadorId: 100,
          proprietario: 'INFINITY',
        });

        expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
      });
    });

    describe('SIM NEEDS_CREATE via lote', () => {
      const trackerId = 10;
      const simLoteItemId = 50;

      beforeEach(() => {
        jest.spyOn(service, 'pareamentoPreview').mockResolvedValue({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              tracker_status: 'FOUND_AVAILABLE',
              sim_status: 'NEEDS_CREATE',
              action_needed: 'SELECT_SIM_LOT',
              trackerId,
              simId: undefined,
            },
          ],
          contadores: { validos: 0, exigemLote: 1, erros: 0 },
        });

        prisma.aparelho.update.mockResolvedValue({});
        prisma.aparelhoHistorico.create.mockResolvedValue({});
      });

      it('atribui ICCID ao SIM do lote com proprietario=INFINITY e clienteId=null', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        });
        prisma.aparelho.findFirst.mockResolvedValueOnce({ id: simLoteItemId });

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          loteSimId: 20,
          proprietario: 'INFINITY',
        });

        expect(prisma.aparelho.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: simLoteItemId },
            data: expect.objectContaining({
              identificador: '89550012340000000001',
              proprietario: 'INFINITY',
              clienteId: null,
            }),
          }),
        );
      });

      it('lança BadRequestException quando lote de SIMs sem saldo', async () => {
        prisma.aparelho.findUnique.mockResolvedValueOnce({
          proprietario: 'INFINITY',
          clienteId: null,
          marca: null,
          modelo: null,
        });
        prisma.aparelho.findFirst.mockResolvedValueOnce(null);

        await expect(
          service.pareamento({
            pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
            loteSimId: 20,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('geração de débito — rastreador NEEDS_CREATE manual', () => {
      it('não gera débito em criação manual de rastreador', async () => {
        jest.spyOn(service, 'pareamentoPreview').mockResolvedValue({
          linhas: [
            {
              imei: '123456789012345',
              iccid: '89550012340000000001',
              tracker_status: 'NEEDS_CREATE',
              sim_status: 'FOUND_AVAILABLE',
              action_needed: 'SELECT_TRACKER_LOT',
              trackerId: undefined,
              simId: 20,
            },
          ],
          contadores: { validos: 0, exigemLote: 1, erros: 0 },
        });

        prisma.aparelho.create.mockResolvedValueOnce({ id: 99 });
        prisma.aparelho.update.mockResolvedValue({});
        prisma.aparelhoHistorico.create.mockResolvedValue({});

        await service.pareamento({
          pares: [{ imei: '123456789012345', iccid: '89550012340000000001' }],
          rastreadorManual: { marca: 'Suntech', modelo: 'ST310U' },
          proprietario: 'CLIENTE',
          clienteId: 3,
        });

        expect(debitosMock.consolidarDebitoTx).not.toHaveBeenCalled();
      });
    });
  });
});
