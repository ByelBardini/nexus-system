import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useNovoPedidoRastreadorCatalogs,
  useModelosFiltradosParaMarca,
} from "@/pages/pedidos/novo-pedido/hooks/useNovoPedidoRastreadorCatalogs";

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
  api.mockImplementation((url: string) => {
    if (url === "/tecnicos") return Promise.resolve([{ id: 1, nome: "T" }]);
    if (url === "/clientes?subclientes=1")
      return Promise.resolve([{ id: 2, nome: "C" }]);
    if (url === "/equipamentos/marcas")
      return Promise.resolve([{ id: 9, nome: "M" }]);
    if (url === "/equipamentos/modelos")
      return Promise.resolve([
        { id: 1, nome: "Mod", marcaId: 9 },
        { id: 2, nome: "Out", marcaId: 1 },
      ]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([{ id: 3, nome: "Op" }]);
    return Promise.resolve(null);
  });
});

describe("useNovoPedidoRastreadorCatalogs", () => {
  it("agrega técnicos, clientes, marcas, modelos e operadoras quando aberto", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useNovoPedidoRastreadorCatalogs(true), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.tecnicos).toHaveLength(1));
    expect(result.current.marcas).toHaveLength(1);
    expect(result.current.modelosRaw.some((m) => m.marcaId === 9)).toBe(true);
  });

  it("edge: com open false não requisita (flags / dados vazios de catálogos de lista)", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useNovoPedidoRastreadorCatalogs(false),
      {
        wrapper: wrapper(qc),
      },
    );
    expect(result.current.tecnicos).toEqual([]);
  });
});

describe("useModelosFiltradosParaMarca", () => {
  it("filtra modelos por marca", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () =>
        useModelosFiltradosParaMarca(
          [
            { id: 1, nome: "A", marcaId: 1 },
            { id: 2, nome: "B", marcaId: 2 },
          ],
          1,
        ),
      { wrapper: wrapper(qc) },
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe(1);
  });
});
