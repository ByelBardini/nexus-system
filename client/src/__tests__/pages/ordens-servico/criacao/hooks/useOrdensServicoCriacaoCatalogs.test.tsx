import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useOrdensServicoCriacaoCatalogs } from "@/pages/ordens-servico/criacao/hooks/useOrdensServicoCriacaoCatalogs";

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
      return Promise.resolve([
        { id: 1, nome: "A", subclientes: [] },
        { id: 2, nome: "B", subclientes: [{ id: 9, nome: "S" }] },
      ]);
    if (path === "/ordens-servico/cliente-infinity")
      return Promise.resolve({ clienteId: 10 });
    if (path === "/clientes/10")
      return Promise.resolve({
        subclientes: [{ id: 1, nome: "X" }],
      });
    if (path === "/tecnicos") return Promise.resolve([{ id: 3, nome: "T" }]);
    if (path === "/aparelhos")
      return Promise.resolve([
        {
          id: 1,
          tipo: "RASTREADOR",
          status: "INSTALADO",
          identificador: "ID1",
        },
        { id: 2, tipo: "RASTREADOR", status: "PENDENTE", identificador: "X" },
        { id: 3, tipo: "OUTRO", status: "INSTALADO", identificador: "Y" },
      ]);
    return Promise.resolve(null);
  });
});

describe("useOrdensServicoCriacaoCatalogs", () => {
  it("agrega rastreadores INSTALADOS com identificador", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useOrdensServicoCriacaoCatalogs("INFINITY", undefined),
      { wrapper: wrapper(qc) },
    );
    await waitFor(() => {
      expect(result.current.rastreadoresInstalados).toHaveLength(1);
    });
    expect(result.current.rastreadoresInstalados[0].identificador).toBe("ID1");
  });

  it("em CLIENTE, usa subclientes do cliente selecionado", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useOrdensServicoCriacaoCatalogs("CLIENTE", 2),
      { wrapper: wrapper(qc) },
    );
    await waitFor(() => {
      expect(result.current.subclientes).toEqual([{ id: 9, nome: "S" }]);
    });
  });

  it("em INFINITY, usa subclientes do cliente detalhado", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useOrdensServicoCriacaoCatalogs("INFINITY", undefined),
      { wrapper: wrapper(qc) },
    );
    await waitFor(() => {
      expect(result.current.subclientes).toEqual([{ id: 1, nome: "X" }]);
    });
  });
});
