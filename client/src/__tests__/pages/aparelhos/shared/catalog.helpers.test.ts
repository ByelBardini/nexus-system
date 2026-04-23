import { describe, expect, it } from "vitest";
import {
  filtrarMarcasSimcardPorOperadoraId,
  getModelosDisponiveisPorMarcaId,
  getModelosDisponiveisPorMarcaNome,
  idOperadoraParaFiltroSim,
  resolveMarcaModeloFiltroLote,
  resolveMarcaModeloIdsPorNome,
  selectAparelhosIdentificadoresList,
} from "@/pages/aparelhos/shared/catalog.helpers";
import type { MarcaSimcardRow } from "@/pages/aparelhos/shared/catalog.types";

const marcasAtivas = [
  { id: 1, nome: "A", ativo: true },
  { id: 2, nome: "B", ativo: true },
];
const modelos = [
  {
    id: 10,
    nome: "M1",
    ativo: true,
    marca: { id: 1, nome: "A" },
  },
  {
    id: 11,
    nome: "M2",
    ativo: false,
    marca: { id: 1, nome: "A" },
  },
  {
    id: 12,
    nome: "Outro",
    ativo: true,
    marca: { id: 2, nome: "B" },
  },
];

describe("idOperadoraParaFiltroSim", () => {
  const ops = [
    { id: 5, nome: "OpA" },
    { id: 6, nome: "OpB" },
  ];
  it("retorna null se valor vazio", () => {
    expect(idOperadoraParaFiltroSim(ops, "", "id")).toBeNull();
    expect(idOperadoraParaFiltroSim(ops, "", "nome")).toBeNull();
  });
  it("modo id: converte string numérica", () => {
    expect(idOperadoraParaFiltroSim(ops, "5", "id")).toBe(5);
  });
  it("modo id: null se não numérico", () => {
    expect(idOperadoraParaFiltroSim(ops, "x", "id")).toBeNull();
  });
  it("modo nome: resolve id pelo nome", () => {
    expect(idOperadoraParaFiltroSim(ops, "OpB", "nome")).toBe(6);
  });
  it("modo nome: null se não achar", () => {
    expect(idOperadoraParaFiltroSim(ops, "Nada", "nome")).toBeNull();
  });
});

describe("getModelosDisponiveisPorMarcaNome", () => {
  it("retorna vazio se marca vazia", () => {
    expect(
      getModelosDisponiveisPorMarcaNome(modelos, marcasAtivas, ""),
    ).toEqual([]);
  });
  it("retorna vazio se marca inexistente no catálogo ativo", () => {
    expect(
      getModelosDisponiveisPorMarcaNome(modelos, marcasAtivas, "Z"),
    ).toEqual([]);
  });
  it("filtra ativos da marca A", () => {
    const r = getModelosDisponiveisPorMarcaNome(modelos, marcasAtivas, "A");
    expect(r.map((m) => m.nome)).toEqual(["M1"]);
  });
});

describe("getModelosDisponiveisPorMarcaId", () => {
  it("retorna vazio com watchMarca vazio", () => {
    expect(getModelosDisponiveisPorMarcaId(modelos, "")).toEqual([]);
  });
  it("retorna vazio com id NaN", () => {
    expect(getModelosDisponiveisPorMarcaId(modelos, "x")).toEqual([]);
  });
  it("filtra por id de marca e ativo", () => {
    const r = getModelosDisponiveisPorMarcaId(modelos, "1");
    expect(r.map((m) => m.id)).toEqual([10]);
  });
});

describe("resolveMarcaModeloIdsPorNome", () => {
  it("retorna null se faltar marca ou modelo", () => {
    expect(
      resolveMarcaModeloIdsPorNome(marcasAtivas, modelos, "A", ""),
    ).toBeNull();
  });
  it("retorna null se nomes não batem com listas", () => {
    expect(
      resolveMarcaModeloIdsPorNome(marcasAtivas, modelos, "A", "Nope"),
    ).toBeNull();
  });
  it("resolve ids", () => {
    expect(
      resolveMarcaModeloIdsPorNome(marcasAtivas, modelos, "A", "M1"),
    ).toEqual({ marcaId: 1, modeloId: 10 });
  });
});

describe("resolveMarcaModeloFiltroLote", () => {
  it("retorna null se vazio", () => {
    expect(resolveMarcaModeloFiltroLote("", "2")).toBeNull();
  });
  it("sempre retorna o par Number (comportamento lote, inclusive NaN)", () => {
    expect(resolveMarcaModeloFiltroLote("1", "2")).toEqual({
      marcaId: 1,
      modeloId: 2,
    });
  });
});

describe("filtrarMarcasSimcardPorOperadoraId", () => {
  const m: MarcaSimcardRow[] = [
    {
      id: 1,
      nome: "M",
      operadoraId: 3,
      temPlanos: false,
      operadora: { id: 3, nome: "O" },
    },
    {
      id: 2,
      nome: "N",
      operadoraId: 4,
      temPlanos: false,
      operadora: { id: 4, nome: "P" },
    },
  ];
  it("com operadoraId null retorna tudo (sem corte por operadora)", () => {
    expect(filtrarMarcasSimcardPorOperadoraId(m, null)).toEqual(m);
  });
  it("filtra por operadora", () => {
    expect(filtrarMarcasSimcardPorOperadoraId(m, 3).map((x) => x.id)).toEqual([
      1,
    ]);
  });
});

describe("selectAparelhosIdentificadoresList", () => {
  it("ignora itens sem identificador e mapeia o resto", () => {
    const raw = [
      {},
      { identificador: "1", lote: { referencia: "L" } },
      { identificador: "" },
    ];
    expect(selectAparelhosIdentificadoresList(raw)).toEqual([
      { identificador: "1", lote: { referencia: "L" } },
    ]);
  });
});
