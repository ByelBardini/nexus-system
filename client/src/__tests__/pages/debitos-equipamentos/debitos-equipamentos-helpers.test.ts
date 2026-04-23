import { describe, expect, it } from "vitest";
import {
  buildOpcoesDevedorCredor,
  buildOpcoesModelo,
  computeDebitosEquipamentosStats,
  filterDebitosEquipamentos,
  hasFiltrosAtivos,
} from "@/pages/debitos-equipamentos/domain/debitos-equipamentos-helpers";
import { mapDebitoApiToView } from "@/pages/debitos-equipamentos/domain/mapDebitoApiToView";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

function view(
  overrides: Parameters<typeof buildDebitoRastreadorListaApi>[0] = {},
) {
  return mapDebitoApiToView(buildDebitoRastreadorListaApi(overrides));
}

describe("computeDebitosEquipamentosStats", () => {
  it("lista vazia → zeros e predominante -", () => {
    expect(computeDebitosEquipamentosStats([])).toEqual({
      totalAparelhosDevidos: 0,
      saldoMes: 0,
      devedoresCliente: 0,
      devedoresInfinity: 0,
      pctCliente: 0,
      modelosAtivos: 0,
      modeloPredominante: "-",
    });
  });

  it("ignora débitos quitados nos totais ativos", () => {
    const quitado = view({ id: 1, quantidade: 0 });
    const aberto = view({
      id: 2,
      quantidade: 3,
      marca: { id: 1, nome: "M" },
      modelo: { id: 1, nome: "A" },
      devedorCliente: { id: 1, nome: "C1" },
    });
    const s = computeDebitosEquipamentosStats([quitado, aberto]);
    expect(s.totalAparelhosDevidos).toBe(3);
    expect(s.devedoresCliente).toBe(1);
  });

  it("saldoMes soma entradas e subtrai saídas só nos ativos", () => {
    const d = view({
      quantidade: 10,
      historicos: [
        { id: 1, delta: 5, criadoEm: "2024-01-01" },
        { id: 2, delta: -2, criadoEm: "2024-01-02" },
      ],
    });
    expect(computeDebitosEquipamentosStats([d]).saldoMes).toBe(3);
  });

  it("modelo predominante escolhe maior quantidade agregada", () => {
    const a = view({
      id: 1,
      quantidade: 1,
      marca: { id: 1, nome: "M" },
      modelo: { id: 1, nome: "Z" },
    });
    const b = view({
      id: 2,
      quantidade: 5,
      marca: { id: 1, nome: "M" },
      modelo: { id: 2, nome: "Big" },
    });
    expect(
      computeDebitosEquipamentosStats([a, b]).modeloPredominante,
    ).toContain("Big");
  });

  it("pctCliente 50 com um devedor cliente e um infinity", () => {
    const cliente = view({
      id: 1,
      devedorTipo: "CLIENTE",
      devedorCliente: { id: 1, nome: "A" },
      quantidade: 1,
    });
    const inf = view({
      id: 2,
      devedorTipo: "INFINITY",
      devedorCliente: null,
      devedorClienteId: null,
      quantidade: 1,
    });
    expect(computeDebitosEquipamentosStats([cliente, inf]).pctCliente).toBe(50);
  });

  it("exclui modelos com quantidade 0 do mapa de ativos", () => {
    const d = view({ quantidade: 0 });
    expect(computeDebitosEquipamentosStats([d]).modelosAtivos).toBe(0);
  });
});

describe("buildOpcoesDevedorCredor / buildOpcoesModelo", () => {
  it("deduplica nomes e inclui opção Todos", () => {
    const a = view({ id: 1, devedorCliente: { id: 1, nome: "Dup" } });
    const b = view({
      id: 2,
      credorTipo: "CLIENTE",
      credorClienteId: 2,
      credorCliente: { id: 2, nome: "Dup" },
      devedorCliente: { id: 3, nome: "Outro" },
    });
    const opts = buildOpcoesDevedorCredor([a, b]);
    expect(opts[0]).toEqual({ value: "", label: "Todos" });
    const values = opts.map((o) => o.value).filter(Boolean);
    expect(new Set(values).size).toBe(values.length);
  });

  it("lista vazia → só Todos", () => {
    expect(buildOpcoesDevedorCredor([])).toEqual([
      { value: "", label: "Todos" },
    ]);
    expect(buildOpcoesModelo([])).toEqual([{ value: "", label: "Todos" }]);
  });
});

describe("filterDebitosEquipamentos", () => {
  const base = view({ id: 1, devedorCliente: { id: 1, nome: "Alpha" } });
  const other = view({
    id: 2,
    devedorCliente: { id: 2, nome: "Beta" },
    marca: { id: 9, nome: "OtherBrand" },
    modelo: { id: 9, nome: "OtherModel" },
    quantidade: 1,
  });

  it("busca case-insensitive em devedor", () => {
    const r = filterDebitosEquipamentos([base, other], {
      busca: "ALPHA",
      filtroStatus: "todos",
      filtroDevedor: "",
      filtroModelo: "",
    });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(1);
  });

  it("filtro por credor (nome) inclui linha onde credor coincide", () => {
    const row = view({
      id: 3,
      credorTipo: "CLIENTE",
      credorClienteId: 5,
      credorCliente: { id: 5, nome: "CredorZ" },
    });
    const r = filterDebitosEquipamentos([row], {
      busca: "",
      filtroStatus: "todos",
      filtroDevedor: "CredorZ",
      filtroModelo: "",
    });
    expect(r).toHaveLength(1);
  });

  it("filtro status parcial não encontra linhas se mapper só gera aberto/quitado", () => {
    const r = filterDebitosEquipamentos([base], {
      busca: "",
      filtroStatus: "parcial",
      filtroDevedor: "",
      filtroModelo: "",
    });
    expect(r).toHaveLength(0);
  });

  it("filtro modelo por nome exato de modelo composto", () => {
    const nomeModelo = "MarcaX Modelo Y";
    const r = filterDebitosEquipamentos([base], {
      busca: "",
      filtroStatus: "todos",
      filtroDevedor: "",
      filtroModelo: nomeModelo,
    });
    expect(r).toHaveLength(1);
  });

  it("trim na busca: espaços não quebram match vazio", () => {
    const r = filterDebitosEquipamentos([base, other], {
      busca: "   ",
      filtroStatus: "todos",
      filtroDevedor: "",
      filtroModelo: "",
    });
    expect(r).toHaveLength(2);
  });
});

describe("hasFiltrosAtivos", () => {
  it("false quando tudo default", () => {
    expect(
      hasFiltrosAtivos({
        busca: "",
        filtroDevedor: "",
        filtroModelo: "",
        filtroStatus: "todos",
      }),
    ).toBe(false);
  });

  it("true com qualquer campo", () => {
    expect(
      hasFiltrosAtivos({
        busca: "x",
        filtroDevedor: "",
        filtroModelo: "",
        filtroStatus: "todos",
      }),
    ).toBe(true);
    expect(
      hasFiltrosAtivos({
        busca: "",
        filtroDevedor: "",
        filtroModelo: "",
        filtroStatus: "aberto",
      }),
    ).toBe(true);
  });
});
