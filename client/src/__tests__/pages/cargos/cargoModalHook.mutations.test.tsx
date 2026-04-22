import { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useCargoModal } from "@/pages/cargos/cargo-modal/useCargoModal";
import {
  cargoBase,
  createCargoModalWrapper,
  mockToastFns,
  permissoes,
  setores,
} from "./cargoModalHookTestHelpers";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

const apiMock = vi.mocked(api);

describe("useCargoModal — mutations e matriz", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    apiMock.mockReset();
  });

  it("handleSave (novo): POST + PATCH quando há permissões", async () => {
    const { success: toastSuccess } = await mockToastFns();
    toastSuccess.mockClear();

    apiMock
      .mockResolvedValueOnce({ id: 55 })
      .mockResolvedValueOnce(undefined);

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
      result.current.setNome("Novo Nome");
      result.current.togglePermission(101);
      result.current.togglePermission(102);
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledTimes(2);
    expect(apiMock.mock.calls[0][0]).toBe("/roles");
    expect(apiMock.mock.calls[1][0]).toBe("/roles/55/permissions");
    expect(toastSuccess).toHaveBeenCalledWith("Cargo criado com sucesso");
  });

  it("handleSave (novo): só POST quando não há permissões", async () => {
    const { success: toastSuccess } = await mockToastFns();
    toastSuccess.mockClear();

    apiMock.mockResolvedValueOnce({ id: 77 });

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
      result.current.setNome("Só Post");
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock.mock.calls[0][0]).toBe("/roles");
  });

  it("handleSave (editar): duas chamadas à API", async () => {
    const { success: toastSuccess } = await mockToastFns();
    toastSuccess.mockClear();

    apiMock.mockResolvedValue(undefined);

    const onClose = vi.fn();
    const { result } = renderHook(
      () =>
        useCargoModal({
          cargo: cargoBase,
          isNew: false,
          setores,
          permissoes,
          onClose,
        }),
      { wrapper: createCargoModalWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.nome).toBe("Operador"));

    act(() => {
      result.current.setNome("Atualizado");
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledTimes(2);
    const urls = apiMock.mock.calls.map((c) => c[0]).sort() as string[];
    expect(urls).toEqual(["/roles/99", "/roles/99/permissions"]);
    expect(toastSuccess).toHaveBeenCalledWith("Cargo atualizado com sucesso");
  });

  it("toggleAllSectorPermissions marca e desmarca o setor inteiro", () => {
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
      result.current.toggleAllSectorPermissions("ADMINISTRATIVO", true);
    });
    expect(result.current.selectedPermIds.sort()).toEqual([101, 102]);

    act(() => {
      result.current.toggleAllSectorPermissions("ADMINISTRATIVO", false);
    });
    expect(result.current.selectedPermIds).toEqual([]);
  });

  it("isSectorFullySelected: parcial vs total", () => {
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

    expect(result.current.isSectorFullySelected("ADMINISTRATIVO")).toBe(false);

    act(() => {
      result.current.togglePermission(101);
    });
    expect(result.current.isSectorFullySelected("ADMINISTRATIVO")).toBe(false);

    act(() => {
      result.current.togglePermission(102);
    });
    expect(result.current.isSectorFullySelected("ADMINISTRATIVO")).toBe(true);
  });
});
