import { describe, it, expect } from "vitest";
import {
  buildOpcoesClienteFromList,
  filterModelosPorMarca,
  formatCidadeEstadoDoDestinatario,
  formatFilialClienteDoSubcliente,
  getDestinatarioDisplayNome,
  parseDestinoClienteString,
  resolveDestinatarioSelecionado,
} from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.utils";
import type { TecnicoResumo } from "@/pages/pedidos/shared/pedidos-rastreador.types";

const t1: TecnicoResumo = { id: 1, nome: "T1", cidade: "X", estado: "SP" };
const clientes = [
  {
    id: 10,
    nome: "C10",
    subclientes: [{ id: 20, nome: "S20", cliente: { id: 10, nome: "C10" } }],
  },
];

describe("parseDestinoClienteString", () => {
  it("retorna vazio para undefined e strings inválidas", () => {
    expect(parseDestinoClienteString(undefined)).toEqual({});
    expect(parseDestinoClienteString("")).toEqual({});
    expect(parseDestinoClienteString("foo-1")).toEqual({});
  });

  it("parseia cliente e subcliente", () => {
    expect(parseDestinoClienteString("cliente-7")).toEqual({ clienteId: 7 });
    expect(parseDestinoClienteString("subcliente-8")).toEqual({ subclienteId: 8 });
  });

  it("rejeita id NaN (edge)", () => {
    expect(parseDestinoClienteString("cliente-abc")).toEqual({});
  });
});

describe("buildOpcoesClienteFromList", () => {
  it("inclui cliente e cada subcliente com label composto", () => {
    const opts = buildOpcoesClienteFromList(clientes);
    expect(opts.some((o) => o.tipo === "cliente" && o.id === 10)).toBe(true);
    expect(
      opts.find((o) => o.tipo === "subcliente" && o.id === 20)?.label,
    ).toContain("—");
  });
});

describe("resolveDestinatarioSelecionado", () => {
  const op = buildOpcoesClienteFromList(clientes);
  it("MISTO e TÉCNICO retornam o técnico", () => {
    expect(
      resolveDestinatarioSelecionado({
        tipoDestino: "MISTO",
        tecnicoId: 1,
        tecnicos: [t1],
        clientes,
        opcoesCliente: op,
      })?.id,
    ).toBe(1);
    expect(
      resolveDestinatarioSelecionado({
        tipoDestino: "TECNICO",
        tecnicoId: 1,
        tecnicos: [t1],
        clientes,
        opcoesCliente: op,
      })?.id,
    ).toBe(1);
  });

  it("CLIENTE com clienteId resolve cliente", () => {
    const r = resolveDestinatarioSelecionado({
      tipoDestino: "CLIENTE",
      clienteId: 10,
      tecnicos: [],
      clientes: clientes as never,
      opcoesCliente: op,
    });
    expect((r as { id: number }).id).toBe(10);
  });

  it("CLIENTE com subclienteId resolve opção de subcliente", () => {
    const r = resolveDestinatarioSelecionado({
      tipoDestino: "CLIENTE",
      subclienteId: 20,
      tecnicos: [],
      clientes: clientes as never,
      opcoesCliente: op,
    });
    expect((r as { id: number }).id).toBe(20);
  });
});

describe("formatCidadeEstadoDoDestinatario", () => {
  it("formata cidade e UF quando ambos presentes", () => {
    expect(formatCidadeEstadoDoDestinatario({ cidade: "A", estado: "B" })).toBe(
      "A, B",
    );
  });

  it("só estado ausente: usa cidade ou traço (edge sem estado)", () => {
    expect(formatCidadeEstadoDoDestinatario({ cidade: "A", estado: null })).toBe(
      "A",
    );
  });

  it("retorna null sem chaves de endereço", () => {
    expect(formatCidadeEstadoDoDestinatario({ nome: "X" })).toBe(null);
  });
});

describe("formatFilialClienteDoSubcliente", () => {
  it("lê nome do cliente aninhado", () => {
    expect(
      formatFilialClienteDoSubcliente({
        cliente: { id: 1, nome: "Mãe" },
      }),
    ).toBe("Mãe");
  });

  it("retorna - sem cliente", () => {
    expect(
      formatFilialClienteDoSubcliente({ cliente: undefined }),
    ).toBe("-");
  });
});

describe("filterModelosPorMarca", () => {
  const m = [
    { id: 1, nome: "a", marcaId: 10 },
    { id: 2, nome: "b", marcaId: 20 },
  ];
  it("sem marcaId devolve tudo; com marcaId filtra", () => {
    expect(filterModelosPorMarca(m, undefined)).toEqual(m);
    expect(filterModelosPorMarca(m, 10)).toEqual([m[0]]);
  });
});

describe("getDestinatarioDisplayNome", () => {
  it("lê string nome ou null", () => {
    expect(getDestinatarioDisplayNome({ nome: "N" })).toBe("N");
    expect(getDestinatarioDisplayNome(null)).toBeNull();
    expect(getDestinatarioDisplayNome({ nome: 1 })).toBeNull();
  });
});
