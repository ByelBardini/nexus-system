import { describe, it, expect } from "vitest";
import {
  rastreadorTextoBusca,
  rastreadorLinhaOperadoraPlano,
  formatRastreadorOperadoraMarcaIccidPlano,
  findRastreadorPorIdentificador,
  rastreadorMarcaModeloLabel,
} from "@/pages/testes/lib/rastreador-format";
import type { RastreadorParaTeste } from "@/pages/testes/lib/testes-types";

function baseRastreador(
  overrides: Partial<RastreadorParaTeste> = {},
): RastreadorParaTeste {
  return {
    id: 1,
    identificador: "123",
    proprietario: "CLIENTE",
    marca: "M",
    modelo: "X",
    status: "EM_TESTES",
    operadora: null,
    criadoEm: "",
    cliente: null,
    tecnico: null,
    marcaSimcard: null,
    planoSimcard: null,
    simVinculado: null,
    ...overrides,
  };
}

describe("rastreador-format", () => {
  describe("rastreadorTextoBusca", () => {
    it("concatena imei, iccid, marca/modelo, operadora, marca sim e planoMB", () => {
      const r = baseRastreador({
        identificador: "IMEI1",
        marca: "Tel",
        modelo: "T1",
        marcaSimcard: {
          id: 1,
          nome: "ChipCo",
          operadora: { id: 1, nome: "OpX" },
        },
        planoSimcard: { id: 1, planoMb: 100 },
        simVinculado: { id: 1, identificador: "ICCID9" },
      });
      const t = rastreadorTextoBusca(r);
      expect(t).toContain("imei1");
      expect(t).toContain("iccid9");
      expect(t).toContain("tel t1");
      expect(t).toContain("opx");
      expect(t).toContain("chipco");
      expect(t).toContain("100mb");
    });

    it("edge: campos nulos não quebram e resultado é minúsculo", () => {
      const r = baseRastreador({
        identificador: null,
        marca: null,
        modelo: null,
      });
      expect(rastreadorTextoBusca(r)).toBe("");
    });

    it("edge: plano só em simVinculado", () => {
      const r = baseRastreador({
        identificador: "A",
        simVinculado: {
          id: 1,
          identificador: null,
          planoSimcard: { planoMb: 50 },
        },
      });
      expect(rastreadorTextoBusca(r)).toContain("50mb");
    });
  });

  describe("rastreadorLinhaOperadoraPlano", () => {
    it("monta linha com operadora, marca e plano", () => {
      const r = baseRastreador({
        marcaSimcard: {
          id: 1,
          nome: "Vivo",
          operadora: { id: 1, nome: "Tele" },
        },
        planoSimcard: { id: 1, planoMb: 200 },
      });
      expect(rastreadorLinhaOperadoraPlano(r)).toBe("Tele / Vivo / 200 MB");
    });

    it("edge: vazio retorna null", () => {
      expect(rastreadorLinhaOperadoraPlano(baseRastreador())).toBeNull();
    });

    it("edge: operadora raiz tem precedência sobre simVinculado (igual ao select legado)", () => {
      const r = baseRastreador({
        marcaSimcard: null,
        operadora: "OpFallback",
        simVinculado: {
          id: 1,
          identificador: "I",
          marcaSimcard: { nome: "S", operadora: { nome: "O2" } },
          planoSimcard: { planoMb: 1 },
        },
      });
      expect(rastreadorLinhaOperadoraPlano(r)).toBe("OpFallback / S / 1 MB");
    });
  });

  describe("formatRastreadorOperadoraMarcaIccidPlano", () => {
    it("inclui ICCID no meio da linha", () => {
      const r = baseRastreador({
        marcaSimcard: {
          id: 1,
          nome: "M",
          operadora: { id: 1, nome: "O" },
        },
        simVinculado: { id: 1, identificador: "8955" },
        planoSimcard: { id: 1, planoMb: 10 },
      });
      expect(formatRastreadorOperadoraMarcaIccidPlano(r)).toBe(
        "O / M / 8955 / 10 MB",
      );
    });

    it("edge: sem dados retorna em dash", () => {
      expect(formatRastreadorOperadoraMarcaIccidPlano(baseRastreador())).toBe(
        "—",
      );
    });
  });

  describe("findRastreadorPorIdentificador", () => {
    const list = [
      baseRastreador({ id: 1, identificador: "ABC" }),
      baseRastreador({ id: 2, identificador: " def " }),
    ];

    it("encontra por case insensitive e trim", () => {
      expect(findRastreadorPorIdentificador(list, "abc")?.id).toBe(1);
      expect(findRastreadorPorIdentificador(list, "DEF")?.id).toBe(2);
    });

    it("edge: string vazia retorna null", () => {
      expect(findRastreadorPorIdentificador(list, "   ")).toBeNull();
    });

    it("edge: não encontrado retorna null", () => {
      expect(findRastreadorPorIdentificador(list, "zzz")).toBeNull();
    });

    it("edge: identificador null no item não faz match indevido", () => {
      const l = [baseRastreador({ id: 9, identificador: null })];
      expect(findRastreadorPorIdentificador(l, "")).toBeNull();
    });
  });

  describe("rastreadorMarcaModeloLabel", () => {
    it("edge: sem marca/modelo retorna traço", () => {
      expect(rastreadorMarcaModeloLabel(baseRastreador({ marca: null, modelo: null }))).toBe("—");
    });
  });
});
