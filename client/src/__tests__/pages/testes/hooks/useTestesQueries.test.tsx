import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useTestesListaQuery,
  useRastreadoresParaTestesQuery,
} from "@/pages/testes/hooks/useTestesQueries";
import { osTesteFixture, rastreadorTesteFixture } from "../fixtures";

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
});

describe("useTestesListaQuery", () => {
  it("chama endpoint testando com search codificado", async () => {
    api.mockResolvedValueOnce([osTesteFixture()]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useTestesListaQuery("ab c"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(api).toHaveBeenCalledWith(
      "/ordens-servico/testando?search=" + encodeURIComponent("ab c"),
    );
  });

  it("edge: search vazio omite query param", async () => {
    api.mockResolvedValueOnce([]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderHook(() => useTestesListaQuery(""), { wrapper: wrapper(qc) });
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/ordens-servico/testando?"),
    );
  });

  it("edge: falha de rede expõe isError", async () => {
    api.mockRejectedValueOnce(new Error("fail"));
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useTestesListaQuery(""), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRastreadoresParaTestesQuery", () => {
  it("monta query string com cliente, técnico e OS", async () => {
    const os = osTesteFixture({ id: 5, clienteId: 9, tecnicoId: 8 });
    api.mockResolvedValueOnce([rastreadorTesteFixture()]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useRastreadoresParaTestesQuery(os), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    const call = api.mock.calls.find((c) =>
      String(c[0]).includes("/aparelhos/para-testes"),
    );
    expect(call?.[0]).toContain("clienteId=9");
    expect(call?.[0]).toContain("tecnicoId=8");
    expect(call?.[0]).toContain("ordemServicoId=5");
  });

  it("edge: selectedOs null não chama API (enabled false)", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderHook(() => useRastreadoresParaTestesQuery(null), {
      wrapper: wrapper(qc),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(api).not.toHaveBeenCalled();
  });

  it("edge: RETIRADA desabilita query", async () => {
    const os = osTesteFixture({ tipo: "RETIRADA" });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderHook(() => useRastreadoresParaTestesQuery(os), {
      wrapper: wrapper(qc),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(api).not.toHaveBeenCalled();
  });
});
