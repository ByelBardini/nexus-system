import { describe, it, expect } from "vitest";
import {
  getDefaultNovoPedidoRastreadorFormValues,
  schemaNovoPedido,
} from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";

function base() {
  return {
    ...getDefaultNovoPedidoRastreadorFormValues("2026-01-15"),
  };
}

describe("schemaNovoPedido", () => {
  it("aceita TÉCNICO com técnico e data", () => {
    const d = { ...base(), tipoDestino: "TECNICO" as const, tecnicoId: 5 };
    expect(schemaNovoPedido.safeParse(d).success).toBe(true);
  });

  it("rejeita TÉCNICO sem técnico", () => {
    const d = {
      ...base(),
      tipoDestino: "TECNICO" as const,
      tecnicoId: undefined,
    };
    const r = schemaNovoPedido.safeParse(d);
    expect(r.success).toBe(false);
  });

  it("rejeita técnico com id 0 (refine)", () => {
    const d = { ...base(), tipoDestino: "TECNICO" as const, tecnicoId: 0 };
    const r = schemaNovoPedido.safeParse(d);
    expect(r.success).toBe(false);
  });

  it("rejeita MISTO sem técnico", () => {
    const d = {
      ...base(),
      tipoDestino: "MISTO" as const,
      tecnicoId: undefined,
    };
    const r = schemaNovoPedido.safeParse(d);
    expect(r.success).toBe(false);
  });

  it("aceita MISTO com técnico e itens", () => {
    const d = {
      ...base(),
      tipoDestino: "MISTO" as const,
      tecnicoId: 2,
    };
    expect(schemaNovoPedido.safeParse(d).success).toBe(true);
  });

  it("rejeita CLIENTE sem destinoCliente", () => {
    const d = {
      ...base(),
      tipoDestino: "CLIENTE" as const,
      destinoCliente: "",
    };
    const r = schemaNovoPedido.safeParse(d);
    expect(r.success).toBe(false);
  });

  it("aceita CLIENTE com destino", () => {
    const d = {
      ...base(),
      tipoDestino: "CLIENTE" as const,
      destinoCliente: "cliente-1",
    };
    expect(schemaNovoPedido.safeParse(d).success).toBe(true);
  });

  it("rejeita dataSolicitacao vazia", () => {
    const d = { ...base(), dataSolicitacao: "" };
    const r = schemaNovoPedido.safeParse(d);
    expect(r.success).toBe(false);
  });

  it("rejeita quantidade < 1 quando presente (schema base)", () => {
    const d = { ...base(), quantidade: 0 };
    const r = schemaNovoPedido.safeParse(d);
    expect(r.success).toBe(false);
  });
});

describe("getDefaultNovoPedidoRastreadorFormValues", () => {
  it("respeita a data passada e mantém 1 iten MISTO default", () => {
    const v = getDefaultNovoPedidoRastreadorFormValues("2026-04-01");
    expect(v.dataSolicitacao).toBe("2026-04-01");
    expect(v.tipoDestino).toBe("TECNICO");
    expect(v.itensMisto).toEqual([{ proprietario: "INFINITY", quantidade: 1 }]);
  });
});
