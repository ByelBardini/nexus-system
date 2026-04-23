import { describe, it, expect } from "vitest";
import { buildNovoPedidoRastreadorPostJson } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.payload";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";

const base: FormNovoPedido = {
  tipoDestino: "TECNICO",
  dataSolicitacao: "2026-01-10",
  quantidade: 2,
  urgencia: "MEDIA",
  observacao: "obs",
  deCliente: false,
  itensMisto: [{ proprietario: "INFINITY", quantidade: 1 }],
};

describe("buildNovoPedidoRastreadorPostJson", () => {
  it("MISTO: envia itens e técnico", () => {
    const d: FormNovoPedido = {
      ...base,
      tipoDestino: "MISTO",
      tecnicoId: 3,
      itensMisto: [
        { proprietario: "INFINITY", quantidade: 1 },
        {
          proprietario: "CLIENTE",
          clienteId: 9,
          quantidade: 2,
        },
      ],
    };
    const j = buildNovoPedidoRastreadorPostJson(d) as Record<string, unknown>;
    expect(j.tipoDestino).toBe("MISTO");
    expect(j.tecnicoId).toBe(3);
    expect(Array.isArray(j.itens)).toBe(true);
    expect(
      (j.itens as { clienteId?: number; proprietario: string }[])[1]
        .clienteId,
    ).toBe(9);
  });

  it("MISTO: aplica marca global quando marcaModeloEspecifico do pedido", () => {
    const d: FormNovoPedido = {
      ...base,
      tipoDestino: "MISTO",
      tecnicoId: 1,
      marcaModeloEspecifico: true,
      marcaEquipamentoId: 5,
      modeloEquipamentoId: 6,
      itensMisto: [{ proprietario: "INFINITY", quantidade: 1 }],
    };
    const j = buildNovoPedidoRastreadorPostJson(d) as { itens: { marcaEquipamentoId?: number }[] };
    expect(j.itens[0].marcaEquipamentoId).toBe(5);
  });

  it("TECNICO: inclui deClienteId quando deCliente", () => {
    const d: FormNovoPedido = {
      ...base,
      tipoDestino: "TECNICO",
      tecnicoId: 1,
      deCliente: true,
      deClienteId: 88,
    };
    const j = buildNovoPedidoRastreadorPostJson(d) as Record<string, unknown>;
    expect(j.deClienteId).toBe(88);
    expect(j.clienteId).toBeUndefined();
  });

  it("CLIENTE: parseia subcliente no body", () => {
    const d: FormNovoPedido = {
      ...base,
      tipoDestino: "CLIENTE",
      destinoCliente: "subcliente-42",
    };
    const j = buildNovoPedidoRastreadorPostJson(d) as Record<string, unknown>;
    expect(j.subclienteId).toBe(42);
    expect(j.clienteId).toBeUndefined();
  });

  it("CLIENTE: parseia cliente no body", () => {
    const d: FormNovoPedido = {
      ...base,
      tipoDestino: "CLIENTE",
      destinoCliente: "cliente-5",
    };
    const j = buildNovoPedidoRastreadorPostJson(d) as Record<string, unknown>;
    expect(j.clienteId).toBe(5);
  });

  it("edge: destino malformado não define clienteId/subclienteId", () => {
    const d: FormNovoPedido = {
      ...base,
      tipoDestino: "CLIENTE",
      destinoCliente: "cliente-xxx",
    };
    const j = buildNovoPedidoRastreadorPostJson(d) as Record<string, unknown>;
    expect(j.clienteId).toBeUndefined();
    expect(j.subclienteId).toBeUndefined();
  });
});
