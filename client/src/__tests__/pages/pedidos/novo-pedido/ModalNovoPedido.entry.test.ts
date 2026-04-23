import { describe, expect, it } from "vitest";
import { ModalNovoPedido } from "@/pages/pedidos/novo-pedido/ModalNovoPedido";

describe("ModalNovoPedido (entrada do feature)", () => {
  it("exporta o componente", () => {
    expect(typeof ModalNovoPedido).toBe("function");
  });
});
