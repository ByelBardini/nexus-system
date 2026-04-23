import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTecnicosListQuery } from "@/pages/tecnicos/hooks/useTecnicosListQuery";

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
      return Promise.resolve([
        {
          id: 1,
          nome: "Full",
          cpfCnpj: null,
          telefone: null,
          cidade: null,
          estado: null,
          cep: null,
          logradouro: null,
          numero: null,
          complemento: null,
          bairro: null,
          cidadeEndereco: null,
          estadoEndereco: null,
          latitude: null,
          longitude: null,
          geocodingPrecision: null,
          ativo: true,
          precos: {
            instalacaoComBloqueio: 0,
            instalacaoSemBloqueio: 0,
            revisao: 0,
            retirada: 0,
            deslocamento: 0,
          },
        },
      ]);
    return Promise.resolve(null);
  });
});

describe("useTecnicosListQuery", () => {
  it("usa a mesma queryKey que o resumo (compartilha cache)", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useTecnicosListQuery(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.data?.[0].nome).toBe("Full"));
    const cached = qc.getQueryData(["tecnicos"]);
    expect(Array.isArray(cached)).toBe(true);
  });

  it("edge: erro na API expõe isError", async () => {
    api.mockRejectedValueOnce(new Error("boom"));
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useTecnicosListQuery(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
