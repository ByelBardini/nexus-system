import { describe, expect, it } from "vitest";
import { pedidosRastreadoresListQueryKey } from "@/pages/pedidos/lista/hooks/pedidos-rastreadores-list.query-keys";

describe("pedidosRastreadoresListQueryKey", () => {
  it("lista: busca vazia vira chave com string vazia (trim)", () => {
    expect(pedidosRastreadoresListQueryKey("lista", "")).toEqual([
      "pedidos-rastreadores",
      "",
    ]);
  });

  it("lista: remove espaços nas pontas", () => {
    expect(pedidosRastreadoresListQueryKey("lista", "  abc  ")).toEqual([
      "pedidos-rastreadores",
      "abc",
    ]);
  });

  it("config: inclui segmento 'config' e trim", () => {
    expect(pedidosRastreadoresListQueryKey("config", "x")).toEqual([
      "pedidos-rastreadores",
      "config",
      "x",
    ]);
  });
});
