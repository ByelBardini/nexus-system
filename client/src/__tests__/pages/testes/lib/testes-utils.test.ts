import { describe, it, expect } from "vitest";
import {
  filtrarOsTesteNaFila,
  imeiVinculadoNaBancadaTestes,
  subclienteLabel,
} from "@/pages/testes/lib/testes-utils";
import type { OsTeste } from "@/pages/testes/lib/testes-types";

function os(partial: Partial<OsTeste>): OsTeste {
  return {
    id: 1,
    numero: 1,
    tipo: "INSTALACAO",
    status: "EM_TESTES",
    clienteId: 1,
    subclienteId: null,
    veiculoId: null,
    tecnicoId: null,
    idAparelho: null,
    idEntrada: null,
    cliente: { id: 1, nome: "C" },
    subcliente: null,
    veiculo: null,
    tecnico: null,
    tempoEmTestesMin: 0,
    ...partial,
  };
}

describe("testes-utils", () => {
  describe("imeiVinculadoNaBancadaTestes", () => {
    it("REVISAO usa idEntrada", () => {
      expect(
        imeiVinculadoNaBancadaTestes(
          os({ tipo: "REVISAO", idEntrada: " E1 ", idAparelho: "Sai" }),
        ),
      ).toBe("E1");
    });

    it("não REVISAO usa idAparelho", () => {
      expect(
        imeiVinculadoNaBancadaTestes(
          os({ tipo: "INSTALACAO", idAparelho: " A1 ", idEntrada: "ignorado" }),
        ),
      ).toBe("A1");
    });

    it("RETIRADA usa idAparelho (equipamento a retirar)", () => {
      expect(
        imeiVinculadoNaBancadaTestes(
          os({ tipo: "RETIRADA", idAparelho: " R1 ", idEntrada: null }),
        ),
      ).toBe("R1");
    });

    it("edge: os null retorna string vazia", () => {
      expect(imeiVinculadoNaBancadaTestes(null)).toBe("");
    });

    it("edge: campos null viram string vazia", () => {
      expect(
        imeiVinculadoNaBancadaTestes(
          os({ tipo: "INSTALACAO", idAparelho: null }),
        ),
      ).toBe("");
    });
  });

  describe("subclienteLabel", () => {
    it("prefere subcliente.nome", () => {
      expect(
        subclienteLabel({
          subcliente: { id: 1, nome: "Base" },
          subclienteSnapshotNome: "Snap",
        }),
      ).toBe("Base");
    });

    it("edge: usa snapshot quando subcliente ausente", () => {
      expect(
        subclienteLabel({
          subcliente: null,
          subclienteSnapshotNome: "Snap",
        }),
      ).toBe("Snap");
    });

    it("edge: fallback traço", () => {
      expect(subclienteLabel({ subcliente: null })).toBe("—");
    });
  });

  describe("filtrarOsTesteNaFila", () => {
    it("busca vazia retorna lista inteira", () => {
      const list = [os({ id: 1, numero: 10 }), os({ id: 2, numero: 20 })];
      expect(filtrarOsTesteNaFila(list, "   ")).toEqual(list);
    });

    it("filtra por número, placa e idAparelho", () => {
      const list = [
        os({
          id: 1,
          numero: 555,
          veiculo: { id: 1, placa: "XYZ9A99", marca: "F", modelo: "X" },
          idAparelho: "IMEI-1",
        }),
        os({ id: 2, numero: 999, idAparelho: "OTHER" }),
      ];
      expect(filtrarOsTesteNaFila(list, "555")).toHaveLength(1);
      expect(filtrarOsTesteNaFila(list, "xyz9")).toHaveLength(1);
      expect(filtrarOsTesteNaFila(list, "imei-1")).toHaveLength(1);
    });

    it("edge: sem match retorna vazio", () => {
      expect(filtrarOsTesteNaFila([os({ numero: 1 })], "zzz")).toEqual([]);
    });
  });
});
