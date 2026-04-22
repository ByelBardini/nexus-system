import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAparelhosList } from "@/pages/aparelhos/lista/useAparelhosList";
import type { Aparelho } from "@/pages/aparelhos/lista/aparelhos-page.shared";
import { PAGE_SIZE } from "@/pages/aparelhos/lista/aparelhos-page.shared";
import { aparelhoFixture } from "./fixtures";

const apiMock = vi.hoisted(() => vi.fn());
const hasPermissionMock = vi.hoisted(() =>
  vi.fn<(perm: string) => boolean>(() => true),
);

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}));

function wrapper(queryClient: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useAparelhosList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          aparelhoFixture({
            id: 1,
            tipo: "RASTREADOR",
            status: "EM_ESTOQUE",
            proprietario: "INFINITY",
            identificador: "A",
          }),
          aparelhoFixture({
            id: 2,
            tipo: "SIM",
            status: "CONFIGURADO",
            proprietario: "CLIENTE",
            cliente: { id: 1, nome: "X" },
            identificador: "B",
          }),
        ] satisfies Aparelho[]);
      }
      if (url === "/aparelhos/pareamento/kits") {
        return Promise.resolve([{ id: 9, nome: "Kit Nine" }]);
      }
      return Promise.resolve([]);
    });
    hasPermissionMock.mockImplementation(() => true);
  });

  it("carrega aparelhos e kits, expõe contagens e canCreate conforme permissão", async () => {
    const { result } = renderHook(() => useAparelhosList(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalCount).toBe(2);
    expect(result.current.statusCounts.EM_ESTOQUE).toBe(1);
    expect(result.current.statusCounts.CONFIGURADO).toBe(1);
    expect(result.current.kitsPorId.get(9)).toBe("Kit Nine");
    expect(result.current.canCreate).toBe(true);

    hasPermissionMock.mockImplementation(() => false);
    const { result: r2 } = renderHook(() => useAparelhosList(), {
      wrapper: wrapper(
        new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      ),
    });
    await waitFor(() => expect(r2.current.isLoading).toBe(false));
    expect(r2.current.canCreate).toBe(false);
  });

  it("handleStatusClick define filtro e zera página", async () => {
    const many = Array.from({ length: PAGE_SIZE + 2 }, (_, i) =>
      aparelhoFixture({
        id: i + 1,
        tipo: "RASTREADOR",
        status: i % 2 === 0 ? "EM_ESTOQUE" : "INSTALADO",
        proprietario: "INFINITY",
        identificador: `id-${i}`,
      }),
    );
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") return Promise.resolve(many);
      if (url === "/aparelhos/pareamento/kits") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useAparelhosList(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => {
      result.current.setPage(1);
    });
    expect(result.current.page).toBe(1);

    await act(() => {
      result.current.handleStatusClick("EM_ESTOQUE");
    });
    expect(result.current.statusFilter).toBe("EM_ESTOQUE");
    expect(result.current.page).toBe(0);
  });

  it("edge: lista vazia mantém totalCount 0 e paginação mínima", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") return Promise.resolve([]);
      if (url === "/aparelhos/pareamento/kits") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useAparelhosList(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginated).toEqual([]);
  });
});
