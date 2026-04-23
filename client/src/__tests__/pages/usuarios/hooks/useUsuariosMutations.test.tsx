import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUsuariosMutations } from "@/pages/usuarios/hooks/useUsuariosMutations";

const apiMock = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function w({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  apiMock.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe("useUsuariosMutations", () => {
  it("criar: POST /users e PATCH roles quando cargoIds não vazios; chama onCreateSettled", async () => {
    const onCreate = vi.fn();
    apiMock
      .mockResolvedValueOnce({ id: 7 })
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(
      () => useUsuariosMutations({ onCreateSettled: onCreate }),
      { wrapper: createWrapper() },
    );
    result.current.createMutation.mutate({
      nome: "A",
      email: "a@a.com",
      ativo: true,
      setor: "AGENDAMENTO",
      cargoIds: [1, 2],
    });
    await waitFor(() => expect(result.current.createMutation.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({ method: "POST" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/roles/users/7/roles",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(toastSuccess).toHaveBeenCalled();
    expect(onCreate).toHaveBeenCalled();
  });

  it("criar: sem roles não chama PATCH", async () => {
    const onCreate = vi.fn();
    apiMock.mockResolvedValueOnce({ id: 8 });
    const { result } = renderHook(
      () => useUsuariosMutations({ onCreateSettled: onCreate }),
      { wrapper: createWrapper() },
    );
    result.current.createMutation.mutate({
      nome: "B",
      email: "b@a.com",
      ativo: true,
      setor: null,
      cargoIds: [],
    });
    await waitFor(() => expect(result.current.createMutation.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  it("atualizar: PATCH /users e /roles", async () => {
    const onUpdate = vi.fn();
    apiMock.mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useUsuariosMutations({ onUpdateSettled: onUpdate }),
      { wrapper: createWrapper() },
    );
    result.current.updateMutation.mutate({
      id: 3,
      data: {
        nome: "X",
        email: "x@a.com",
        ativo: false,
        setor: null,
      },
      roleIds: [9],
    });
    await waitFor(() => expect(result.current.updateMutation.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith(
      "/users/3",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/roles/users/3/roles",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(onUpdate).toHaveBeenCalled();
  });

  it("reset senha: POST reset-password", async () => {
    apiMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUsuariosMutations(), {
      wrapper: createWrapper(),
    });
    result.current.resetPasswordMutation.mutate(4);
    await waitFor(() =>
      expect(result.current.resetPasswordMutation.isSuccess).toBe(true),
    );
    expect(apiMock).toHaveBeenCalledWith("/users/4/reset-password", {
      method: "POST",
    });
  });
});
