import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEquipamentosConfig } from "@/pages/equipamentos/config/hooks/useEquipamentosConfig";
const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };
}

const marcaApi = (id: number) => ({
  id,
  nome: `Marca${id}`,
  ativo: true,
  _count: { modelos: 0 },
});

describe("useEquipamentosConfig", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation((url: string) => {
      if (url === "/equipamentos/marcas")
        return Promise.resolve([marcaApi(1), marcaApi(2)]);
      if (url === "/equipamentos/modelos") return Promise.resolve([]);
      if (url === "/equipamentos/operadoras")
        return Promise.resolve([{ id: 1, nome: "Op", ativo: true }]);
      if (url === "/equipamentos/marcas-simcard")
        return Promise.resolve([
          {
            id: 10,
            nome: "MS",
            operadoraId: 1,
            temPlanos: false,
            ativo: true,
            operadora: { id: 1, nome: "Op" },
            planos: [],
          },
        ]);
      return Promise.resolve(null);
    });
  });

  it("carrega listagens e expõe filteredMarcas (busca) e query keys alinhadas", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filteredMarcas).toHaveLength(2);
    expect(result.current.operadorasAtivas).toEqual([
      { id: 1, nome: "Op", ativo: true },
    ]);
  });

  it("toggleMarca alterna conjunto de expansão", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.toggleMarca(1));
    expect(result.current.expandedMarcaIds.has(1)).toBe(true);
    act(() => result.current.toggleMarca(1));
    expect(result.current.expandedMarcaIds.has(1)).toBe(false);
  });

  it("filtragem: search reduz marcas exibidas", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearchMarcas("Marca1"));
    expect(result.current.filteredMarcas).toHaveLength(1);
  });
});
