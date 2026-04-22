import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EquipamentoListItem } from "@/pages/equipamentos/lista/equipamentos-page.shared";
import { useEquipamentosPageList } from "@/pages/equipamentos/lista/useEquipamentosPageList";
import { EQUIPAMENTOS_LIST_PAGE_SIZE } from "@/pages/equipamentos/lista/equipamentos-page.shared";

const apiMock = vi.hoisted(() => vi.fn());
const mockHasPermission = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) => mockHasPermission(p),
  }),
}));

function montado(
  overrides: Partial<EquipamentoListItem> &
    Pick<EquipamentoListItem, "id" | "status">,
): EquipamentoListItem {
  return {
    tipo: "RASTREADOR",
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "",
    simVinculado: { id: 1, identificador: "iccid" },
    ...overrides,
  } as EquipamentoListItem;
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useEquipamentosPageList", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(false);
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          montado({ id: 1, status: "CONFIGURADO", kitId: null }),
          montado({ id: 2, status: "INSTALADO", kitId: 1 }),
          montado({
            id: 3,
            tipo: "SIM",
            status: "CONFIGURADO",
            simVinculado: { id: 2, identificador: "s" },
          }),
        ]);
      }
      if (url === "/aparelhos/pareamento/kits") {
        return Promise.resolve([{ id: 1, nome: "Kit A" }]);
      }
      return Promise.resolve([]);
    });
  });

  it("exclui não-rastreadores e rastreadores sem SIM; monta kitsPorId", async () => {
    const { result } = renderHook(() => useEquipamentosPageList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filtered.length).toBe(2);
    expect(result.current.filtered.map((e) => e.id).sort()).toEqual([1, 2]);
    expect(result.current.kitsPorId.get(1)).toBe("Kit A");
  });

  it("handlePipelineClick sincroniza status e zera página", async () => {
    const { result } = renderHook(() => useEquipamentosPageList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.setPage(2);
      result.current.handlePipelineClick("INSTALADO");
    });
    await waitFor(() => {
      expect(result.current.pipelineFilter).toBe("INSTALADO");
      expect(result.current.statusFilter).toBe("INSTALADO");
      expect(result.current.page).toBe(0);
    });
  });

  it("handlePipelineClick TODOS redefine statusFilter para TODOS", async () => {
    const { result } = renderHook(() => useEquipamentosPageList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.handlePipelineClick("INSTALADO");
      result.current.handlePipelineClick("TODOS");
    });
    expect(result.current.statusFilter).toBe("TODOS");
  });

  it("paginação: totalPages e paginated respeitam EQUIPAMENTOS_LIST_PAGE_SIZE", async () => {
    const many = Array.from({ length: EQUIPAMENTOS_LIST_PAGE_SIZE + 3 }, (_, i) =>
      montado({ id: i + 1, status: "CONFIGURADO", kitId: null }),
    );
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") return Promise.resolve(many);
      if (url === "/aparelhos/pareamento/kits") return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const { result } = renderHook(() => useEquipamentosPageList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.paginated.length).toBe(EQUIPAMENTOS_LIST_PAGE_SIZE);
    expect(result.current.totalPages).toBe(2);
  });

  it("canCreate quando permissão CRIAR", async () => {
    mockHasPermission.mockImplementation(
      (p) => p === "CONFIGURACAO.APARELHO.CRIAR",
    );
    const { result } = renderHook(() => useEquipamentosPageList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(true);
  });
});
