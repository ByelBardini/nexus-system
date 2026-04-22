import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  CADASTRO_RAST_QUERY_KEY,
  useCadastroRastreamento,
} from "@/pages/cadastro-rastreamento/hooks/useCadastroRastreamento";
import { osRespostaBase } from "./cadastro-rastreamento.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };
}

describe("useCadastroRastreamento", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    apiMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.startsWith("/cadastro-rastreamento?")) {
        return Promise.resolve({ data: [osRespostaBase], total: 1 });
      }
      if (url.includes("/iniciar")) {
        return Promise.resolve({});
      }
      if (url.includes("/concluir")) {
        return Promise.resolve({});
      }
      return Promise.resolve({ data: [], total: 0 });
    });
  });

  it("carrega ordens e expõe lista filtrada", async () => {
    const { result } = renderHook(() => useCadastroRastreamento(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ordens).toHaveLength(1);
    expect(result.current.ordensFiltradas).toHaveLength(1);
    expect(result.current.tecnicos).toContain("Técnico Z");
  });

  it("filtro por status reduz ordensFiltradas", async () => {
    const { result } = renderHook(() => useCadastroRastreamento(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => {
      result.current.setFiltroStatus("CONCLUIDO");
    });
    expect(result.current.ordensFiltradas).toHaveLength(0);
  });

  it("handleAvancarStatus no-op se nada selecionado", async () => {
    const { result } = renderHook(() => useCadastroRastreamento(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => {
      result.current.handleAvancarStatus();
    });
    expect(apiMock).toHaveBeenCalled();
    const patchCalls = apiMock.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("iniciar"),
    );
    expect(patchCalls.length).toBe(0);
  });

  it("iniciar chama PATCH e mostra toast", async () => {
    const { result } = renderHook(() => useCadastroRastreamento(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => {
      result.current.setSelectedId(osRespostaBase.id);
    });
    await act(() => {
      result.current.handleAvancarStatus();
    });
    await waitFor(() =>
      expect(
        apiMock.mock.calls.some(
          (c) => typeof c[0] === "string" && c[0].endsWith("/iniciar"),
        ),
      ).toBe(true),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it("invalida query após sucesso (mesma chave base)", async () => {
    const inv = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCadastroRastreamento(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => {
      result.current.setSelectedId(osRespostaBase.id);
    });
    await act(() => {
      result.current.handleAvancarStatus();
    });
    await waitFor(() => expect(inv).toHaveBeenCalled());
    expect(inv).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining([...CADASTRO_RAST_QUERY_KEY]),
      }),
    );
  });
});
