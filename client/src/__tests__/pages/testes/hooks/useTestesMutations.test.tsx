import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useTestesMutations } from "@/pages/testes/hooks/useTestesMutations";

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
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("useTestesMutations", () => {
  it("updateStatusOs: PATCH status e invalida ordens-servico", async () => {
    api.mockResolvedValue({});
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const onOk = vi.fn();
    const { result } = renderHook(() => useTestesMutations(onOk), {
      wrapper: wrapper(qc),
    });
    result.current.updateStatusOsMutation.mutate({
      id: 1,
      status: "AGENDADO",
    });
    await waitFor(() => expect(onOk).toHaveBeenCalled());
    expect(api).toHaveBeenCalledWith("/ordens-servico/1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "AGENDADO" }),
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      "OS reagendada com sucesso",
    );
  });

  it("edge: updateStatusOs erro chama toast.error", async () => {
    api.mockRejectedValueOnce(new Error("x"));
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesMutations(vi.fn()), {
      wrapper: wrapper(qc),
    });
    result.current.updateStatusOsMutation.mutate({
      id: 2,
      status: "CANCELADO",
    });
    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("x"),
    );
  });

  it("vincularAparelho: PATCH aparelho", async () => {
    api.mockResolvedValue({});
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesMutations(vi.fn()), {
      wrapper: wrapper(qc),
    });
    result.current.vincularAparelhoMutation.mutate({
      ordemServicoId: 3,
      idAparelho: "Z",
    });
    await waitFor(() => expect(api).toHaveBeenCalled());
    expect(api).toHaveBeenCalledWith("/ordens-servico/3/aparelho", {
      method: "PATCH",
      body: JSON.stringify({ idAparelho: "Z" }),
    });
  });

  it("edge: vincular erro mostra toast fixo", async () => {
    api.mockRejectedValueOnce(new Error("nope"));
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesMutations(vi.fn()), {
      wrapper: wrapper(qc),
    });
    result.current.vincularAparelhoMutation.mutate({
      ordemServicoId: 1,
      idAparelho: "A",
    });
    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Erro ao vincular rastreador. Tente novamente.",
      ),
    );
  });

  it("updateStatusAparelho: PATCH /aparelhos/:id/status", async () => {
    api.mockResolvedValue({});
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesMutations(vi.fn()), {
      wrapper: wrapper(qc),
    });
    result.current.updateStatusAparelhoMutation.mutate({
      id: 7,
      status: "EM_TESTES",
      observacao: "obs",
    });
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/aparelhos/7/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "EM_TESTES", observacao: "obs" }),
      }),
    );
  });
});
