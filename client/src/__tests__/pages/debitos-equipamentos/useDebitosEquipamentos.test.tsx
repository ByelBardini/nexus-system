import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEBITOS_EQUIPAMENTOS_LISTA_URL } from "@/pages/debitos-equipamentos/domain/debito-equipamento.constants";
import { useDebitosEquipamentos } from "@/pages/debitos-equipamentos/hooks/useDebitosEquipamentos";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useDebitosEquipamentos", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    apiMock.mockImplementation(() =>
      Promise.resolve({
        data: [
          buildDebitoRastreadorListaApi({
            id: 10,
            devedorCliente: { id: 1, nome: "Cliente A" },
          }),
          buildDebitoRastreadorListaApi({
            id: 11,
            quantidade: 0,
            devedorCliente: { id: 2, nome: "Cliente B" },
          }),
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      }),
    );
  });

  it("chama API com URL de listagem com histórico", async () => {
    const { result } = renderHook(() => useDebitosEquipamentos(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiMock).toHaveBeenCalledWith(DEBITOS_EQUIPAMENTOS_LISTA_URL);
  });

  it("mapeia débitos e filtra por busca", async () => {
    const { result } = renderHook(() => useDebitosEquipamentos(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.debitos).toHaveLength(2));
    await act(() => {
      result.current.setBusca("Cliente B");
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe(11);
  });

  it("stats ignoram quitados no total de aparelhos devidos", async () => {
    const { result } = renderHook(() => useDebitosEquipamentos(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.debitos).toHaveLength(2));
    expect(result.current.stats.totalAparelhosDevidos).toBe(5);
  });

  it("clearFilters restaura estado inicial", async () => {
    const { result } = renderHook(() => useDebitosEquipamentos(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.debitos).toHaveLength(2));
    await act(() => {
      result.current.setBusca("x");
      result.current.setFiltroStatus("quitado");
      result.current.setFiltroDevedor("Cliente A");
    });
    await act(() => {
      result.current.clearFilters();
    });
    expect(result.current.busca).toBe("");
    expect(result.current.filtroStatus).toBe("todos");
    expect(result.current.filtroDevedor).toBe("");
  });

  it("resposta vazia não quebra", async () => {
    apiMock.mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
    const { result } = renderHook(() => useDebitosEquipamentos(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.debitos).toEqual([]);
    expect(result.current.filtered).toEqual([]);
    expect(result.current.stats.totalAparelhosDevidos).toBe(0);
  });
});
