import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrdensServicoPage } from "@/pages/ordens-servico/hooks/useOrdensServicoPage";

const apiMock = vi.hoisted(() => vi.fn());
const apiDownloadBlobMock = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockHasPermission = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
  apiDownloadBlob: (...a: unknown[]) => apiDownloadBlobMock(...a),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: (p: string) => mockHasPermission(p) }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useOrdensServicoPage", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    apiMock.mockReset();
    apiDownloadBlobMock.mockReset();
  });

  it("busca resumo e lista na montagem", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 1,
          emTestes: 0,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (String(url).startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 1,
        });
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });

    const { result } = renderHook(() => useOrdensServicoPage(), { wrapper });

    await waitFor(() => expect(result.current.loadingResumo).toBe(false));
    expect(result.current.resumo?.agendado).toBe(1);
    expect(result.current.lista?.total).toBe(0);
  });

  it("handleStatusClick reseta página para 1", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 0,
          emTestes: 0,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (String(url).startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 3,
        });
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });

    const { result } = renderHook(() => useOrdensServicoPage(), { wrapper });
    await waitFor(() => expect(result.current.loadingResumo).toBe(false));

    result.current.setPage(3);
    await waitFor(() => expect(result.current.page).toBe(3));

    result.current.handleStatusClick("EM_TESTES");
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(result.current.statusFilter).toBe("EM_TESTES");
  });

  it("mutation PATCH invalida queries em sucesso", async () => {
    apiMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 0,
          emTestes: 0,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (String(url).startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 1,
        });
      }
      if (
        String(url).includes("/ordens-servico/") &&
        String(url).endsWith("/status") &&
        init?.method === "PATCH"
      ) {
        return Promise.resolve({});
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });

    const { result } = renderHook(() => useOrdensServicoPage(), { wrapper });
    await waitFor(() => expect(result.current.loadingResumo).toBe(false));

    result.current.handleIniciarTestes(5);
    await waitFor(() =>
      expect(result.current.updateStatusMutation.isSuccess).toBe(true),
    );
  });

  it("edge: handleAbrirImpressao chama apiDownloadBlob", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 0,
          emTestes: 0,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (String(url).startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 1,
        });
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    apiDownloadBlobMock.mockResolvedValue(
      new Blob(["%PDF"], { type: "application/pdf" }),
    );

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const { result } = renderHook(() => useOrdensServicoPage(), { wrapper });
    await waitFor(() => expect(result.current.loadingResumo).toBe(false));

    await result.current.handleAbrirImpressao(7);
    expect(apiDownloadBlobMock).toHaveBeenCalledWith(
      "/ordens-servico/7/pdf",
      30_000,
    );
    clickSpy.mockRestore();
  });

  it("canCreate reflete permissão", async () => {
    mockHasPermission.mockImplementation((p) => p === "AGENDAMENTO.OS.CRIAR");
    apiMock.mockImplementation((url: string) => {
      if (url === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 0,
          emTestes: 0,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (String(url).startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 1,
        });
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    const { result } = renderHook(() => useOrdensServicoPage(), { wrapper });
    await waitFor(() => expect(result.current.loadingResumo).toBe(false));
    expect(result.current.canCreate).toBe(true);
  });
});
