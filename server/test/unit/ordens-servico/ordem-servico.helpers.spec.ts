import { Prisma } from '@prisma/client';
import {
  buildOrdemServicoSearchOrClauses,
  proximoNumeroOrdemServico,
} from 'src/ordens-servico/ordem-servico.helpers';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('ordem-servico.helpers', () => {
  describe('buildOrdemServicoSearchOrClauses', () => {
    it('listagem: termo textual retorna 4 cláusulas sem numero', () => {
      const or = buildOrdemServicoSearchOrClauses('Carlos', 'listagem');

      expect(or).toHaveLength(4);
      expect(or).toEqual([
        { cliente: { nome: { contains: 'Carlos' } } },
        { subcliente: { nome: { contains: 'Carlos' } } },
        { veiculo: { placa: { contains: 'Carlos' } } },
        { tecnico: { nome: { contains: 'Carlos' } } },
      ]);
    });

    it('listagem: termo numérico inclui filtro por numero como primeiro item', () => {
      const or = buildOrdemServicoSearchOrClauses('42', 'listagem');

      expect(or).toHaveLength(5);
      expect(or[0]).toEqual({ numero: 42 });
      expect(or).toEqual([
        { numero: 42 },
        { cliente: { nome: { contains: '42' } } },
        { subcliente: { nome: { contains: '42' } } },
        { veiculo: { placa: { contains: '42' } } },
        { tecnico: { nome: { contains: '42' } } },
      ]);
    });

    it('emTestes: termo textual adiciona snapshot e IMEIs após a base compartilhada', () => {
      const or = buildOrdemServicoSearchOrClauses('IMEI', 'emTestes');

      expect(or).toHaveLength(7);
      expect(or).toContainEqual({
        subclienteSnapshotNome: { contains: 'IMEI' },
      });
      expect(or).toContainEqual({ idAparelho: { contains: 'IMEI' } });
      expect(or).toContainEqual({ idEntrada: { contains: 'IMEI' } });
      expect(or.slice(0, 4)).toEqual([
        { cliente: { nome: { contains: 'IMEI' } } },
        { subcliente: { nome: { contains: 'IMEI' } } },
        { veiculo: { placa: { contains: 'IMEI' } } },
        { tecnico: { nome: { contains: 'IMEI' } } },
      ]);
    });

    it('emTestes: termo numérico inclui numero e 7 cláusulas textuais/relacionais', () => {
      const or = buildOrdemServicoSearchOrClauses('100', 'emTestes');

      expect(or).toHaveLength(8);
      expect(or[0]).toEqual({ numero: 100 });
      expect(or).toContainEqual({
        subclienteSnapshotNome: { contains: '100' },
      });
    });

    it('emTestes textual compartilha exatamente a base de listagem nos 4 primeiros itens', () => {
      const list = buildOrdemServicoSearchOrClauses('foo', 'listagem');
      const test = buildOrdemServicoSearchOrClauses('foo', 'emTestes');
      expect(test.slice(0, 4)).toEqual(list);
    });

    it('emTestes numérico compartilha numero + mesma base que listagem antes dos extras', () => {
      const list = buildOrdemServicoSearchOrClauses('7', 'listagem');
      const test = buildOrdemServicoSearchOrClauses('7', 'emTestes');
      expect(test.slice(0, 5)).toEqual(list);
    });

    it('listagem não inclui campos exclusivos de emTestes', () => {
      const or = buildOrdemServicoSearchOrClauses('x', 'listagem');

      expect(or.some((c) => 'subclienteSnapshotNome' in (c as object))).toBe(
        false,
      );
      expect(or.some((c) => 'idAparelho' in (c as object))).toBe(false);
      expect(or.some((c) => 'idEntrada' in (c as object))).toBe(false);
    });

    it('edge: zero numérico é tratado como número', () => {
      const list = buildOrdemServicoSearchOrClauses('0', 'listagem');
      expect(list[0]).toEqual({ numero: 0 });
    });

    it('edge: decimal válido em JS adiciona filtro numero', () => {
      const or = buildOrdemServicoSearchOrClauses('12.5', 'listagem');
      expect(or[0]).toEqual({ numero: 12.5 });
    });

    it('edge: notação científica numérica adiciona filtro numero', () => {
      const or = buildOrdemServicoSearchOrClauses('1e2', 'listagem');
      expect(or[0]).toEqual({ numero: 100 });
    });

    it('edge: string não numérica não adiciona cláusula numero', () => {
      const or = buildOrdemServicoSearchOrClauses('12abc', 'listagem');
      expect(or.some((c) => 'numero' in (c as object))).toBe(false);
    });

    it('edge: placa com hífen e caracteres especiais repete o termo em contains', () => {
      const termo = 'ABC-1D23';
      const or = buildOrdemServicoSearchOrClauses(termo, 'listagem');
      expect(or).toContainEqual({
        veiculo: { placa: { contains: termo } },
      });
    });

    it('edge: termo unicode é propagado às cláusulas contains', () => {
      const or = buildOrdemServicoSearchOrClauses('São José', 'emTestes');
      expect(or).toContainEqual({
        cliente: { nome: { contains: 'São José' } },
      });
    });

    it('edge: termo vazio lança (evita Number("") === 0)', () => {
      expect(() => buildOrdemServicoSearchOrClauses('', 'listagem')).toThrow(
        'termo não pode ser vazio',
      );
    });
  });

  describe('proximoNumeroOrdemServico', () => {
    it('retorna max + 1 quando há OS com numero', async () => {
      const prisma = createPrismaMock();
      prisma.ordemServico.aggregate.mockResolvedValue({
        _max: { numero: 41 },
      });

      const n = await proximoNumeroOrdemServico(
        prisma as unknown as Prisma.TransactionClient,
      );

      expect(n).toBe(42);
      expect(prisma.ordemServico.aggregate).toHaveBeenCalledWith({
        _max: { numero: true },
      });
    });

    it('retorna 1 quando não existe numero (null)', async () => {
      const prisma = createPrismaMock();
      prisma.ordemServico.aggregate.mockResolvedValue({
        _max: { numero: null },
      });

      const n = await proximoNumeroOrdemServico(
        prisma as unknown as Prisma.TransactionClient,
      );

      expect(n).toBe(1);
    });

    it('retorna 1 quando _max veio indefinido', async () => {
      const prisma = createPrismaMock();
      prisma.ordemServico.aggregate.mockResolvedValue({
        _max: {},
      });

      const n = await proximoNumeroOrdemServico(
        prisma as unknown as Prisma.TransactionClient,
      );

      expect(n).toBe(1);
    });

    it('edge: max zero retorna 1', async () => {
      const prisma = createPrismaMock();
      prisma.ordemServico.aggregate.mockResolvedValue({
        _max: { numero: 0 },
      });

      expect(
        await proximoNumeroOrdemServico(
          prisma as unknown as Prisma.TransactionClient,
        ),
      ).toBe(1);
    });

    it('edge: numeros grandes', async () => {
      const prisma = createPrismaMock();
      prisma.ordemServico.aggregate.mockResolvedValue({
        _max: { numero: 999_999 },
      });

      expect(
        await proximoNumeroOrdemServico(
          prisma as unknown as Prisma.TransactionClient,
        ),
      ).toBe(1_000_000);
    });
  });
});
