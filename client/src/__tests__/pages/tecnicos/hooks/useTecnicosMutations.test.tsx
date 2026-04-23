import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTecnicosMutations } from "@/pages/tecnicos/hooks/useTecnicosMutations";
import { emptyTecnicoFormValues } from "@/pages/tecnicos/lib/tecnico-form";

const api = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  api.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  api.mockResolvedValue({});
});

describe("useTecnicosMutations", () => {
  it("PATCH status invalida queries e toasta sucesso", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await qc.prefetchQuery({
      queryKey: ["tecnicos"],
      queryFn: () => [{ id: 1 }],
    });
    const { result } = renderHook(() => useTecnicosMutations(), {
      wrapper: wrapper(qc),
    });
    act(() => {
      result.current.updateStatusMutation.mutate({ id: 1, ativo: false });
    });
    await waitFor(() => expect(api).toHaveBeenCalledWith(
      "/tecnicos/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ ativo: false }),
      }),
    ));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Status atualizado"));
  });

  it("POST cria técnico e chama onCreateSuccess", async () => {
    const onCreateSuccess = vi.fn();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useTecnicosMutations({ onCreateSuccess }),
      { wrapper: wrapper(qc) },
    );
    const payload = { ...emptyTecnicoFormValues(), nome: "Novo" };
    act(() => {
      result.current.createMutation.mutate(payload);
    });
    await waitFor(() => expect(onCreateSuccess).toHaveBeenCalled());
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Técnico criado com sucesso"),
    );
  });

  it("PATCH atualiza técnico e chama onUpdateSuccess", async () => {
    const onUpdateSuccess = vi.fn();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () => useTecnicosMutations({ onUpdateSuccess }),
      { wrapper: wrapper(qc) },
    );
    const payload = { ...emptyTecnicoFormValues(), nome: "Edit" };
    act(() => {
      result.current.updateMutation.mutate({ id: 7, data: payload });
    });
    await waitFor(() => expect(onUpdateSuccess).toHaveBeenCalled());
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Técnico atualizado com sucesso"),
    );
  });

  it("edge: erro em status chama toast.error", async () => {
    api.mockRejectedValueOnce(new Error("falha"));
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useTecnicosMutations(), {
      wrapper: wrapper(qc),
    });
    act(() => {
      result.current.updateStatusMutation.mutate({ id: 1, ativo: true });
    });
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("falha"),
    );
  });
});
