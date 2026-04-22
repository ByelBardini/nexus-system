import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useCargoModal } from "@/pages/cargos/useCargoModal";
import type { Cargo, Permission, Setor } from "@/types/cargo";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

const apiMock = vi.mocked(api);

const setores: Setor[] = [
  { id: 10, code: "ADM", nome: "Admin" },
  { id: 20, code: "CFG", nome: "Config" },
];

const permissoes: Permission[] = [
  { id: 101, code: "ADMINISTRATIVO.CARGO.LISTAR" },
  { id: 102, code: "ADMINISTRATIVO.CARGO.CRIAR" },
];

const cargoBase: Cargo = {
  id: 99,
  code: "OP",
  nome: "Operador",
  descricao: "d",
  categoria: "GESTAO",
  ativo: false,
  setor: setores[0],
  usuariosVinculados: 3,
  cargoPermissoes: [{ permissaoId: 101 }],
};

function createWrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };
}

describe("useCargoModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    apiMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
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
      { wrapper: createWrapper(queryClient) },
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
        wrapper: createWrapper(queryClient),
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

  it("handleSave: nome vazio → toast e sem API", () => {
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
      { wrapper: createWrapper(queryClient) },
    );

    act(() => {
      result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith("Nome do cargo é obrigatório");
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("handleSave (novo): sem setor válido → toast", async () => {
    const onClose = vi.fn();
    const { result } = renderHook(
      () =>
        useCargoModal({
          cargo: null,
          isNew: true,
          setores: [],
          permissoes,
          onClose,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.nome).toBe(""));

    act(() => {
      result.current.setNome("Cargo X");
    });

    act(() => {
      result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith("Selecione um setor");
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("handleSave (novo): POST + PATCH quando há permissões", async () => {
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
      { wrapper: createWrapper(queryClient) },
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
    expect(toast.success).toHaveBeenCalledWith("Cargo criado com sucesso");
  });

  it("handleSave (novo): só POST quando não há permissões", async () => {
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
      { wrapper: createWrapper(queryClient) },
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
      { wrapper: createWrapper(queryClient) },
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
    expect(toast.success).toHaveBeenCalledWith("Cargo atualizado com sucesso");
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
      { wrapper: createWrapper(queryClient) },
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
      { wrapper: createWrapper(queryClient) },
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
