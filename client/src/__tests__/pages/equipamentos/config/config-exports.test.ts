import { describe, expect, it } from "vitest";
import {
  buildModelosByMarca,
  filterMarcasByMarcaOrModeloName,
  filterMarcasSimcardByNomeOuOperadora,
  filterOperadorasByName,
  toggleIdInSet,
} from "@/pages/equipamentos/config";
import {
  buildModelosByMarca as buildModelosByMarcaDirect,
  filterMarcasByMarcaOrModeloName as filterMarcasDirect,
  filterMarcasSimcardByNomeOuOperadora as filterSimDirect,
  filterOperadorasByName as filterOperadorasDirect,
  toggleIdInSet as toggleIdInSetDirect,
} from "@/pages/equipamentos/config/domain/equipamentos-config.helpers";
import type {
  MarcaRastreador,
  ModeloRastreador,
  MarcaSimcard,
} from "@/pages/equipamentos/config";

const modelo = (
  id: number,
  nomeModelo: string,
  marca: { id: number; nome: string; ativo: boolean },
): ModeloRastreador => ({
  id,
  nome: nomeModelo,
  ativo: true,
  marca,
});

describe("pages/equipamentos/config (barrel) — helpers de domínio", () => {
  it("barrel expõe as mesmas funções que equipamentos-config.helpers", () => {
    expect(toggleIdInSet).toBe(toggleIdInSetDirect);
    expect(filterMarcasByMarcaOrModeloName).toBe(filterMarcasDirect);
    expect(filterOperadorasByName).toBe(filterOperadorasDirect);
    expect(filterMarcasSimcardByNomeOuOperadora).toBe(filterSimDirect);
    expect(buildModelosByMarca).toBe(buildModelosByMarcaDirect);
  });

  describe("toggleIdInSet", () => {
    it("inclui id se ausente, remove se presente, não muta o Set original", () => {
      const original = new Set([1, 2]);
      const a = toggleIdInSet(new Set([1, 2]), 3);
      expect(a.has(3)).toBe(true);
      expect(a.has(1)).toBe(true);
      expect([...original]).toEqual([1, 2]);

      const b = toggleIdInSet(a, 1);
      expect(b.has(1)).toBe(false);
      expect(b.has(2)).toBe(true);
    });

    it("Set vazio: primeiro toggle adiciona; segundo remove de volta", () => {
      let s = new Set<number>();
      s = toggleIdInSet(s, 42);
      expect([...s]).toEqual([42]);
      s = toggleIdInSet(s, 42);
      expect([...s]).toEqual([]);
    });
  });

  describe("filterMarcasByMarcaOrModeloName", () => {
    const marcas: MarcaRastreador[] = [
      { id: 1, nome: "Alfa", ativo: true, _count: { modelos: 0 } },
      { id: 2, nome: "Beta", ativo: true, _count: { modelos: 0 } },
    ];
    const modelos: ModeloRastreador[] = [
      modelo(10, "FMB-900", { id: 1, nome: "Alfa", ativo: true }),
    ];

    it("com busca vazia ou só espaços retorna a lista completa (trim)", () => {
      expect(filterMarcasByMarcaOrModeloName(marcas, modelos, "")).toEqual(
        marcas,
      );
      expect(
        filterMarcasByMarcaOrModeloName(marcas, modelos, "  \t  "),
      ).toEqual(marcas);
    });

    it("filtra por nome da marca, insensível a maiúsculas", () => {
      const r = filterMarcasByMarcaOrModeloName(marcas, modelos, "ALF");
      expect(r.map((x) => x.id)).toEqual([1]);
    });

    it("encontra marca indiretamente pelo nome do modelo", () => {
      const r = filterMarcasByMarcaOrModeloName(marcas, modelos, "fmb");
      expect(r.map((x) => x.id)).toEqual([1]);
    });

    it("não retorna nada se nada casa", () => {
      expect(
        filterMarcasByMarcaOrModeloName(marcas, modelos, "zzz").length,
      ).toBe(0);
    });

    it("lista de marcas vazia permanece vazia", () => {
      expect(filterMarcasByMarcaOrModeloName([], modelos, "alfa")).toEqual([]);
    });

    it("modelo que pertence a outra marca não faz a marca errada aparecer", () => {
      const r = filterMarcasByMarcaOrModeloName(marcas, modelos, "beta");
      expect(r.map((m) => m.id)).toEqual([2]);
      const sóPeloModeloAlfa = filterMarcasByMarcaOrModeloName(
        marcas,
        modelos,
        "fmb-900",
      );
      expect(sóPeloModeloAlfa.map((m) => m.id)).toEqual([1]);
    });
  });

  describe("filterOperadorasByName", () => {
    const o = [
      { id: 1, nome: "Vivo" },
      { id: 2, nome: "Claro" },
    ];

    it("vazio retorna tudo; sem match retorna vazio", () => {
      expect(filterOperadorasByName(o, "")).toEqual(o);
      expect(filterOperadorasByName(o, "nada")).toEqual([]);
    });

    it("busca com espaços nas pontas é normalizada (trim)", () => {
      expect(filterOperadorasByName(o, "  vivo \t")).toEqual([o[0]]);
    });

    it("substring case-insensitive", () => {
      expect(filterOperadorasByName(o, "ARO")).toEqual([o[1]]);
    });
  });

  describe("filterMarcasSimcardByNomeOuOperadora", () => {
    const lista: MarcaSimcard[] = [
      {
        id: 1,
        nome: "ChipX",
        operadoraId: 1,
        temPlanos: true,
        ativo: true,
        operadora: { id: 1, nome: "Vivo" },
        planos: [],
      },
      {
        id: 2,
        nome: "Outra",
        operadoraId: 2,
        temPlanos: false,
        ativo: true,
        operadora: { id: 2, nome: "Tim" },
        planos: [],
      },
    ];

    it("casa por nome da marca ou nome da operadora", () => {
      const porMarca = filterMarcasSimcardByNomeOuOperadora(lista, "chip");
      const porOperadora = filterMarcasSimcardByNomeOuOperadora(lista, "tim");
      expect(porMarca).toEqual([lista[0]]);
      expect(porOperadora).toEqual([lista[1]]);
    });

    it("busca vazia ou só espaços devolve lista integral", () => {
      expect(filterMarcasSimcardByNomeOuOperadora(lista, "")).toEqual(lista);
      expect(filterMarcasSimcardByNomeOuOperadora(lista, " \n ")).toEqual(
        lista,
      );
    });

    it("sem match retorna array vazio", () => {
      expect(filterMarcasSimcardByNomeOuOperadora(lista, "zzz")).toEqual([]);
    });
  });

  describe("buildModelosByMarca", () => {
    it("agrupa modelos da mesma marca; multiplas chaves se necessário", () => {
      const modelos: ModeloRastreador[] = [
        modelo(1, "M1", { id: 1, nome: "A", ativo: true }),
        modelo(2, "M2", { id: 1, nome: "A", ativo: true }),
        modelo(3, "M3", { id: 2, nome: "B", ativo: true }),
      ];
      const map = buildModelosByMarca(modelos);
      expect(map.get(1)?.map((x) => x.nome)).toEqual(["M1", "M2"]);
      expect(map.get(2)?.[0].nome).toBe("M3");
    });

    it("lista vazia produz Map vazio", () => {
      expect([...buildModelosByMarca([]).keys()]).toEqual([]);
    });
  });
});
