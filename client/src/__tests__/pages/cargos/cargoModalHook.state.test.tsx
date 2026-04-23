import { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useCargoModal } from "@/pages/cargos/cargo-modal/useCargoModal";
import type { Cargo } from "@/types/cargo";
import {
  cargoBase,
  createCargoModalWrapper,
  permissoes,
  setores,
} from "./cargoModalHookTestHelpers";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

const apiMock = vi.mocked(api);

describe("useCargoModal — estado e sincronização", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    apiMock.mockReset();
  });

  it("modo novo: estado inicial do formulário", () => {
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

    expect(result.current.nome).toBe("");
    expect(result.current.categoria).toBe("OPERACIONAL");
    expect(result.current.selectedPermIds).toEqual([]);
  });

  it("ao receber cargo existente, preenche campos e permissões", async () => {
    const onClose = vi.fn();
    const { result, rerender } = renderHook(
      ({ cargo }: { cargo: Cargo | null }) =>
        useCargoModal({
          cargo,
          isNew: false,
          setores,
          permissoes,
          onClose,
        }),
      {
        wrapper: createCargoModalWrapper(queryClient),
        initialProps: { cargo: null as Cargo | null },
      },
    );

    await act(async () => {
      rerender({ cargo: cargoBase });
    });

    await waitFor(() => expect(result.current.nome).toBe("Operador"));
    expect(result.current.categoria).toBe("GESTAO");
    expect(result.current.ativo).toBe(false);
    expect(result.current.selectedPermIds).toEqual([101]);
  });
});
