import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEquipamentosConfigCrudMutations } from "@/pages/equipamentos/config/hooks/useEquipamentosConfigCrudMutations";
import { equipamentosQueryKeys } from "@/lib/query-keys/equipamentos";

const apiMock = vi.hoisted(() => vi.fn());
const closers = vi.hoisted(() => ({
  closeModalMarca: vi.fn(),
  closeModalModelo: vi.fn(),
  closeModalOperadora: vi.fn(),
  closeModalMarcaSimcard: vi.fn(),
  closeModalPlanoSimcard: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return { client, W: ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  ) };
}

describe("useEquipamentosConfigCrudMutations", () => {
  beforeEach(() => {
    apiMock.mockReset();
    Object.values(closers).forEach((f) => f.mockReset());
    apiMock.mockImplementation(
      (_url: string, init?: { method?: string }) => {
        if (
          init?.method === "POST" ||
          init?.method === "PATCH" ||
          init?.method === "DELETE"
        )
          return Promise.resolve({});
        return Promise.resolve(null);
      },
    );
  });

  it("createMarca: POST, invalida marcas, fecha modal e exibe sucesso", async () => {
    const { W, client } = createWrapper();
    const inv = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () =>
        useEquipamentosConfigCrudMutations({
          closers: {
            closeModalMarca: closers.closeModalMarca,
            closeModalModelo: closers.closeModalModelo,
            closeModalOperadora: closers.closeModalOperadora,
            closeModalMarcaSimcard: closers.closeModalMarcaSimcard,
            closeModalPlanoSimcard: closers.closeModalPlanoSimcard,
          },
        }),
      { wrapper: W },
    );
    act(() => {
      result.current.createMarcaMutation.mutate({ nome: "N" });
    });
    await waitFor(() => expect(closers.closeModalMarca).toHaveBeenCalled());
    const marcasInvalidation = inv.mock.calls.find(
      (c) =>
        (c[0] as { queryKey: readonly string[] })?.queryKey?.[0] ===
        equipamentosQueryKeys.marcas[0],
    );
    expect(marcasInvalidation).toBeDefined();
  });

  it("deleteOperadora: DELETE e invalida operadoras", async () => {
    const { W, client } = createWrapper();
    const inv = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () =>
        useEquipamentosConfigCrudMutations({
          closers: {
            closeModalMarca: closers.closeModalMarca,
            closeModalModelo: closers.closeModalModelo,
            closeModalOperadora: closers.closeModalOperadora,
            closeModalMarcaSimcard: closers.closeModalMarcaSimcard,
            closeModalPlanoSimcard: closers.closeModalPlanoSimcard,
          },
        }),
      { wrapper: W },
    );
    act(() => result.current.deleteOperadoraMutation.mutate(3));
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(
      inv.mock.calls.some(
        (c) => (c[0] as { queryKey: readonly string[] })?.queryKey[0] === "operadoras",
      ),
    ).toBe(true);
  });

  it("edge: mutação rejeitada chama onError (api rejeita)", async () => {
    apiMock.mockImplementation(() => Promise.reject(new Error("Falha rede")));
    const { W } = createWrapper();
    const { result } = renderHook(
      () =>
        useEquipamentosConfigCrudMutations({
          closers: {
            closeModalMarca: closers.closeModalMarca,
            closeModalModelo: closers.closeModalModelo,
            closeModalOperadora: closers.closeModalOperadora,
            closeModalMarcaSimcard: closers.closeModalMarcaSimcard,
            closeModalPlanoSimcard: closers.closeModalPlanoSimcard,
          },
        }),
      { wrapper: W },
    );
    act(() => result.current.deleteModeloMutation.mutate(1));
    await waitFor(() => expect(closers.closeModalModelo).not.toHaveBeenCalled());
  });
});
