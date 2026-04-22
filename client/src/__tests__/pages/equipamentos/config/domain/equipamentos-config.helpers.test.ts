import { describe, expect, it } from "vitest";
import {
  buildModelosByMarca,
  filterMarcasByMarcaOrModeloName,
  filterMarcasSimcardByNomeOuOperadora,
  filterOperadorasByName,
  toggleIdInSet,
} from "@/pages/equipamentos/config/domain/equipamentos-config.helpers";
import type {
  MarcaRastreador,
  MarcaSimcard,
  ModeloRastreador,
} from "@/pages/equipamentos/config/domain/equipamentos-config.types";

const marca = (n: Partial<MarcaRastreador> & { id: number; nome: string }): MarcaRastreador => ({
  id: n.id,
  nome: n.nome,
  ativo: n.ativo ?? true,
  _count: n._count ?? { modelos: 0 },
});

const modelo = (n: {
  id: number;
  nome: string;
  marcaId: number;
}): ModeloRastreador => ({
  id: n.id,
  nome: n.nome,
  ativo: true,
  marca: { id: n.marcaId, nome: "M", ativo: true },
});

describe("toggleIdInSet", () => {
  it("adiciona id ausente e remove id presente", () => {
    expect(toggleIdInSet(new Set(), 1)).toEqual(new Set([1]));
    expect(toggleIdInSet(new Set([1, 2]), 1)).toEqual(new Set([2]));
  });
});

describe("filterMarcasByMarcaOrModeloName", () => {
  const marcas = [marca({ id: 1, nome: "Teltonika" }), marca({ id: 2, nome: "Outra" })];
  const modelos = [modelo({ id: 10, nome: "FMB920", marcaId: 1 })];

  it("com busca vazia (ou só espaços) retorna todas as marcas", () => {
    expect(filterMarcasByMarcaOrModeloName(marcas, modelos, "")).toHaveLength(2);
    expect(filterMarcasByMarcaOrModeloName(marcas, modelos, "   ")).toHaveLength(2);
  });

  it("filtra por nome de marca (case insensitive)", () => {
    const r = filterMarcasByMarcaOrModeloName(marcas, modelos, "telto");
    expect(r.map((m) => m.id)).toEqual([1]);
  });

  it("filtra por nome de modelo mesmo quando nome da marca não bate", () => {
    const r = filterMarcasByMarcaOrModeloName(marcas, modelos, "fmb");
    expect(r.map((m) => m.id)).toEqual([1]);
  });

  it("não retorna marcas sem modelo que case quando só modelo de outra marca casaria", () => {
    const r = filterMarcasByMarcaOrModeloName(marcas, modelos, "inexistente");
    expect(r).toHaveLength(0);
  });
});

describe("filterOperadorasByName", () => {
  const ops = [{ id: 1, nome: "Vivo", ativo: true }];

  it("vazio retorna lista inteira", () => {
    expect(filterOperadorasByName(ops, "")).toEqual(ops);
  });

  it("match parcial e trim", () => {
    expect(filterOperadorasByName(ops, "  viv ")).toEqual(ops);
  });
});

describe("filterMarcasSimcardByNomeOuOperadora", () => {
  const ms: MarcaSimcard[] = [
    {
      id: 1,
      nome: "Getrak",
      operadoraId: 1,
      temPlanos: true,
      ativo: true,
      operadora: { id: 1, nome: "Vivo" },
    },
  ];

  it("vazio retorna tudo", () => {
    expect(filterMarcasSimcardByNomeOuOperadora(ms, "")).toEqual(ms);
  });

  it("filtra por operadora ainda que nome da marca não bata", () => {
    const r = filterMarcasSimcardByNomeOuOperadora(ms, "vivo");
    expect(r).toEqual(ms);
  });
});

describe("buildModelosByMarca", () => {
  it("agrupa múltiplos modelos por marca", () => {
    const map = buildModelosByMarca([
      modelo({ id: 1, nome: "A", marcaId: 1 }),
      modelo({ id: 2, nome: "B", marcaId: 1 }),
      modelo({ id: 3, nome: "C", marcaId: 2 }),
    ]);
    expect(map.get(1)?.map((m) => m.nome).sort()).toEqual(["A", "B"]);
    expect(map.get(2)).toHaveLength(1);
  });
});
