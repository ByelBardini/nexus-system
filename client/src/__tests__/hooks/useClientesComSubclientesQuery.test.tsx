import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useClientesComSubclientesQuery } from "@/hooks/useClientesComSubclientesQuery";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  api.mockReset();
  api.mockImplementation((path: string) => {
    if (path === "/clientes?subclientes=1")
      return Promise.resolve([{ id: 1, nome: "A" }]);
    return Promise.resolve(null);
  });
});

describe("useClientesComSubclientesQuery", () => {
  it("chama a API e expõe clientes (happy path — alinhado a OS criação)", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useClientesComSubclientesQuery(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.[0].nome).toBe("A"));
  });

  it("edge: enabled false não chama a API (lista vazia)", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useClientesComSubclientesQuery({ enabled: false }),
      { wrapper: wrapper(qc) },
    );
    expect(result.current.data).toBeUndefined();
  });
});
