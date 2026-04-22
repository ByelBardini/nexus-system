import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useCargoModal } from "@/pages/cargos/cargo-modal/useCargoModal";
import type { Setor } from "@/types/cargo";
import {
  createCargoModalWrapper,
  permissoes,
  setores,
} from "./cargoModalHookTestHelpers";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

const apiMock = vi.mocked(api);

const emptySetores: Setor[] = [];

describe("useCargoModal — validação (toast)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    apiMock.mockReset();
  });

  it("handleSave: nome vazio → toast e sem API", () => {
    const toastError = vi.mocked(toast.error);
    toastError.mockClear();

    const onClose = vi.fn();
    const { result } = renderHook(
      () =>
        useCargoModal({
          cargo: null,
          isNew: true,
          setores,
          permissoes,
          onClose,
        }),
      { wrapper: createCargoModalWrapper(queryClient) },
    );

    act(() => {
      result.current.handleSave();
    });

    expect(toastError).toHaveBeenCalledWith("Nome do cargo é obrigatório");
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("handleSave (novo): sem setor válido → toast", () => {
    const toastError = vi.mocked(toast.error);
    toastError.mockClear();

    const onClose = vi.fn();
    const { result } = renderHook(
      () =>
        useCargoModal({
          cargo: null,
          isNew: true,
          setores: emptySetores,
          permissoes,
          onClose,
        }),
      { wrapper: createCargoModalWrapper(queryClient) },
    );

    act(() => {
      result.current.setNome("Cargo X");
    });

    act(() => {
      result.current.handleSave();
    });

    expect(toastError).toHaveBeenCalledWith("Selecione um setor");
    expect(apiMock).not.toHaveBeenCalled();
  });
});
