import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLIENTES_PAGE_SIZE,
  type Cliente,
} from "@/pages/clientes/shared/clientes-page.shared";
import {
  CLIENTES_QUERY_KEY,
  useClientesPageList,
} from "@/pages/clientes/hooks/useClientesPageList";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: apiMock,
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeCliente(over: Partial<Cliente> & { id: number }): Cliente {
  return {
    nome: "Cliente",
    nomeFantasia: null,
    cnpj: null,
    tipoContrato: "COMODATO",
    status: "ATIVO",
    contatos: [],
    ...over,
  };
}

describe("useClientesPageList", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("busca clientes com queryKey CLIENTES_QUERY_KEY", async () => {
    apiMock.mockResolvedValue([]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useClientesPageList(), {
      wrapper: wrapper(qc),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiMock).toHaveBeenCalledWith("/clientes");
    expect(
      qc.getQueryCache().find({ queryKey: CLIENTES_QUERY_KEY }),
    ).toBeTruthy();
  });

  it("filtra por busca (nome, fantasia, CNPJ bruto)", async () => {
    const list = [
      makeCliente({ id: 1, nome: "Alpha Ltda" }),
      makeCliente({ id: 2, nome: "Beta", nomeFantasia: "Beta Fantasia" }),
      makeCliente({ id: 3, nome: "Gamma", cnpj: "12345678000199" }),
    ];
    apiMock.mockResolvedValue(list);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useClientesPageList(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.clientes.length).toBe(3));

    act(() => {
      result.current.setBusca("alpha");
    });
    await waitFor(() =>
      expect(result.current.filtered.map((c) => c.id)).toEqual([1]),
    );

    act(() => {
      result.current.setBusca("fantasia");
    });
    await waitFor(() =>
      expect(result.current.filtered.map((c) => c.id)).toEqual([2]),
    );

    act(() => {
      result.current.setBusca("12345678000199");
    });
    await waitFor(() =>
      expect(result.current.filtered.map((c) => c.id)).toEqual([3]),
    );
  });

  it("paginação: reseta página ao filtrar e fatia corretamente", async () => {
    const list = Array.from({ length: CLIENTES_PAGE_SIZE + 3 }, (_, i) =>
      makeCliente({
        id: i + 1,
        nome: i === 0 ? "UniqueAcmeAlfa" : `Outro ${i}`,
      }),
    );
    apiMock.mockResolvedValue(list);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useClientesPageList(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() =>
      expect(result.current.clientes.length).toBe(list.length),
    );

    act(() => {
      result.current.setPage(1);
    });
    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(result.current.paginated[0]?.id).toBe(CLIENTES_PAGE_SIZE + 1);
    });

    act(() => {
      result.current.setBusca("UniqueAcmeAlfa");
    });
    await waitFor(() => {
      expect(result.current.page).toBe(0);
      expect(result.current.filtered).toHaveLength(1);
    });
  });

  it("não expõe filtroEstoque nem setFiltroEstoque", async () => {
    apiMock.mockResolvedValue([]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useClientesPageList(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).not.toHaveProperty("filtroEstoque");
    expect(result.current).not.toHaveProperty("setFiltroEstoque");
  });

  it("totalPages mínimo 1 com lista vazia", async () => {
    apiMock.mockResolvedValue([]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useClientesPageList(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalPages).toBe(1);
  });
});
