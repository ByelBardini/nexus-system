import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTecnicosResumoQuery } from "@/hooks/useTecnicosResumoQuery";

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
    if (path === "/tecnicos")
      return Promise.resolve([{ id: 1, nome: "Tec" }]);
    return Promise.resolve(null);
  });
});

describe("useTecnicosResumoQuery", () => {
  it("carrega técnicos", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useTecnicosResumoQuery(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.[0].nome).toBe("Tec"));
  });

  it("edge: enabled false deixa data indefinida", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useTecnicosResumoQuery({ enabled: false }),
      { wrapper: wrapper(qc) },
    );
    expect(result.current.data).toBeUndefined();
  });
});
