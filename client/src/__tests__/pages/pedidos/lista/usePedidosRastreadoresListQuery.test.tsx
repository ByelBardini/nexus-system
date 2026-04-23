import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePedidosRastreadoresListQuery } from "@/pages/pedidos/lista/hooks/usePedidosRastreadoresListQuery";
import { pedidosRastreadoresListQueryKey } from "@/pages/pedidos/lista/hooks/pedidos-rastreadores-list.query-keys";
import type { PedidoRastreadorApi } from "@/pages/pedidos/shared/pedidos-rastreador.types";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("usePedidosRastreadoresListQuery", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("chama /pedidos-rastreadores?limit=500 e sem search quando busca vazia", async () => {
    const payload = { data: [] as PedidoRastreadorApi[] };
    apiMock.mockResolvedValueOnce(payload);
    const { result } = renderHook(
      () => usePedidosRastreadoresListQuery({ busca: "  ", scope: "lista" }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const path = String(apiMock.mock.calls[0][0]);
    expect(path).toMatch(/\/pedidos-rastreadores\?/);
    expect(path).toContain("limit=500");
    expect(path).not.toContain("search=");
  });

  it("acrescenta search quando busca preenchida (trim) — escopo config", async () => {
    apiMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(
      () =>
        usePedidosRastreadoresListQuery({
          busca: "  PED-1  ",
          scope: "config",
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const call = String(apiMock.mock.calls[0][0]);
    expect(call).toContain("search=PED-1");
    expect(pedidosRastreadoresListQueryKey("config", "  PED-1  ")).toEqual([
      "pedidos-rastreadores",
      "config",
      "PED-1",
    ]);
  });

  it("enabled: false não dispara api", () => {
    const { result } = renderHook(
      () =>
        usePedidosRastreadoresListQuery({
          busca: "x",
          scope: "lista",
          enabled: false,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.isFetching).toBe(false);
    expect(apiMock).not.toHaveBeenCalled();
  });
});
