import { describe, expect, it } from "vitest";
import {
  TECNICOS_PAGE_SIZE,
  filterTecnicos,
  paginateTecnicos,
  totalPagesForCount,
} from "@/pages/tecnicos/lib/tecnicos-table.utils";
import type { Tecnico } from "@/pages/tecnicos/lib/tecnicos.types";

function t(id: number, overrides: Partial<Tecnico> = {}): Tecnico {
  return {
    id,
    nome: `T${id}`,
    cpfCnpj: null,
    telefone: null,
    cidade: "Campinas",
    estado: "SP",
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidadeEndereco: null,
    estadoEndereco: null,
    latitude: null,
    longitude: null,
    geocodingPrecision: null,
    ativo: true,
    ...overrides,
  };
}

describe("filterTecnicos", () => {
  const list = [
    t(1, { nome: "Alpha Silva", estado: "SP", ativo: true }),
    t(2, { nome: "Beta", estado: "RJ", ativo: false }),
    t(3, { nome: "Gama", estado: "SP", ativo: false }),
  ];

  it("retorna todos quando filtros em todos", () => {
    expect(
      filterTecnicos(list, {
        busca: "",
        filtroEstado: "todos",
        filtroStatus: "todos",
      }),
    ).toHaveLength(3);
  });

  it("filtra por nome case-insensitive com trim na busca", () => {
    const r = filterTecnicos(list, {
      busca: "  alpha ",
      filtroEstado: "todos",
      filtroStatus: "todos",
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.nome).toBe("Alpha Silva");
  });

  it("edge: busca vazia com espaços não remove todos", () => {
    const r = filterTecnicos(list, {
      busca: "   ",
      filtroEstado: "todos",
      filtroStatus: "todos",
    });
    expect(r).toHaveLength(3);
  });

  it("filtra por estado", () => {
    const r = filterTecnicos(list, {
      busca: "",
      filtroEstado: "RJ",
      filtroStatus: "todos",
    });
    expect(r.map((x) => x.id)).toEqual([2]);
  });

  it("edge: técnico sem estado só casa com todos ou string vazia", () => {
    const r = filterTecnicos([t(9, { estado: null })], {
      busca: "",
      filtroEstado: "SP",
      filtroStatus: "todos",
    });
    expect(r).toHaveLength(0);
  });

  it("filtra ativos", () => {
    const r = filterTecnicos(list, {
      busca: "",
      filtroEstado: "todos",
      filtroStatus: "ativo",
    });
    expect(r.map((x) => x.id)).toEqual([1]);
  });

  it("filtra inativos", () => {
    const r = filterTecnicos(list, {
      busca: "",
      filtroEstado: "todos",
      filtroStatus: "inativo",
    });
    expect(r.map((x) => x.id)).toEqual([2, 3]);
  });
});

describe("paginateTecnicos", () => {
  it("fatia pela página e tamanho padrão", () => {
    const arr = Array.from({ length: 25 }, (_, i) => i);
    expect(paginateTecnicos(arr, 0)).toEqual(arr.slice(0, TECNICOS_PAGE_SIZE));
    expect(paginateTecnicos(arr, 1)).toEqual(arr.slice(10, 20));
    expect(paginateTecnicos(arr, 2)).toEqual(arr.slice(20, 30));
  });

  it("edge: página além do fim retorna array vazio", () => {
    expect(paginateTecnicos([1, 2], 5, 10)).toEqual([]);
  });
});

describe("totalPagesForCount", () => {
  it("mínimo 1 página", () => {
    expect(totalPagesForCount(0, 10)).toBe(1);
  });

  it("arredonda para cima", () => {
    expect(totalPagesForCount(11, 10)).toBe(2);
    expect(totalPagesForCount(20, 10)).toBe(2);
    expect(totalPagesForCount(21, 10)).toBe(3);
  });
});
