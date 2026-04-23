import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useSidePanelMutations } from "@/pages/pedidos/side-panel/hooks/useSidePanelMutations";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrap(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useSidePanelMutations", () => {
  beforeEach(() => {
    apiMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("statusMutation chama PATCH de status e dispara onStatusUpdated e toast de sucesso", async () => {
    apiMock.mockResolvedValueOnce({});
    const onStatus = vi.fn();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => useSidePanelMutations(onStatus),
      { wrapper: wrap(qc) },
    );
    await act(async () => {
      result.current.statusMutation.mutate({
        id: 1,
        status: "EM_CONFIGURACAO",
      });
    });
    expect(apiMock).toHaveBeenCalledWith("/pedidos-rastreadores/1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "EM_CONFIGURACAO" }),
    });
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Status atualizado");
  });

  it("statusMutation: erro chama toast.error", async () => {
    apiMock.mockRejectedValueOnce(new Error("Falha rede"));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => useSidePanelMutations(vi.fn()),
      { wrapper: wrap(qc) },
    );
    await act(async () => {
      result.current.statusMutation.mutate({
        id: 1,
        status: "CONFIGURADO",
      });
    });
    expect(toast.error).toHaveBeenCalledWith("Falha rede");
  });

  it("kitIdsMutation chama PATCH de kits e invalida listagem de pedidos", async () => {
    apiMock.mockResolvedValueOnce({});
    const invalidateSpy = vi.fn();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.invalidateQueries = invalidateSpy;
    const { result } = renderHook(
      () => useSidePanelMutations(vi.fn()),
      { wrapper: wrap(qc) },
    );
    await act(async () => {
      result.current.kitIdsMutation.mutate({ id: 2, kitIds: [1, 2] });
    });
    expect(apiMock).toHaveBeenCalledWith("/pedidos-rastreadores/2/kits", {
      method: "PATCH",
      body: JSON.stringify({ kitIds: [1, 2] }),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["pedidos-rastreadores"],
    });
  });
});
