import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
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
const toastApiErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("@/lib/toast-api-error", () => ({
  toastApiError: (...a: unknown[]) => toastApiErrorMock(...a),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    W: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

function renderMutationsHook() {
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
  return { result, inv, client };
}

function expectInvalidateWithKey(
  inv: ReturnType<typeof vi.spyOn>,
  key: readonly string[],
) {
  expect(inv).toHaveBeenCalledWith(expect.objectContaining({ queryKey: key }));
}

function expectLastApiMutationBody(url: string, method: string, body: object) {
  const matches = apiMock.mock.calls.filter(
    (c) =>
      c[0] === url &&
      (c[1] as { method?: string } | undefined)?.method === method,
  );
  expect(matches.length).toBeGreaterThanOrEqual(1);
  const last = matches[matches.length - 1][1] as { body: string };
  expect(JSON.parse(last.body)).toEqual(body);
}

describe("useEquipamentosConfigCrudMutations", () => {
  beforeEach(() => {
    apiMock.mockReset();
    toastApiErrorMock.mockReset();
    vi.mocked(toast.success).mockClear();
    Object.values(closers).forEach((f) => f.mockReset());
    apiMock.mockImplementation((_url: string, init?: { method?: string }) => {
      if (
        init?.method === "POST" ||
        init?.method === "PATCH" ||
        init?.method === "DELETE"
      )
        return Promise.resolve({});
      return Promise.resolve(null);
    });
  });

  it("createMarca: POST com corpo JSON, invalida cache exato, fecha modal uma vez e toast único", async () => {
    const { result, inv } = renderMutationsHook();
    act(() => {
      result.current.createMarcaMutation.mutate({ nome: "N" });
    });
    await waitFor(() =>
      expect(closers.closeModalMarca).toHaveBeenCalledTimes(1),
    );
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcas);
    expectLastApiMutationBody("/equipamentos/marcas", "POST", { nome: "N" });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Marca criada com sucesso");
  });

  it("updateMarca: PATCH parcial; deleteMarca não fecha modal", async () => {
    const { result, inv } = renderMutationsHook();
    act(() =>
      result.current.updateMarcaMutation.mutate({
        id: 1,
        nome: "X",
        ativo: false,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalMarca).toHaveBeenCalledTimes(1),
    );
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcas);
    expectLastApiMutationBody("/equipamentos/marcas/1", "PATCH", {
      nome: "X",
      ativo: false,
    });
    expect(toast.success).toHaveBeenCalledWith("Marca atualizada com sucesso");

    inv.mockClear();
    Object.values(closers).forEach((f) => f.mockClear());
    vi.mocked(toast.success).mockClear();

    act(() => result.current.deleteMarcaMutation.mutate(9));
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(closers.closeModalMarca).not.toHaveBeenCalled();
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcas);
    const del = apiMock.mock.calls.find(
      (c) => c[0] === "/equipamentos/marcas/9",
    );
    expect((del?.[1] as { method: string }).method).toBe("DELETE");
    expect((del?.[1] as { body?: string }).body).toBeUndefined();
  });

  it("createModelo: invalida modelos e marcas (duas invalidações distintas)", async () => {
    const { result, inv } = renderMutationsHook();
    act(() =>
      result.current.createModeloMutation.mutate({
        nome: "M",
        marcaId: 1,
        minCaracteresImei: 14,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalModelo).toHaveBeenCalledTimes(1),
    );
    expectInvalidateWithKey(inv, equipamentosQueryKeys.modelos);
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcas);
    const modelosCalls = inv.mock.calls.filter(
      (c) =>
        (c[0] as { queryKey: readonly string[] }).queryKey[0] ===
        equipamentosQueryKeys.modelos[0],
    );
    const marcasCalls = inv.mock.calls.filter(
      (c) =>
        (c[0] as { queryKey: readonly string[] }).queryKey[0] ===
        equipamentosQueryKeys.marcas[0],
    );
    expect(modelosCalls.length).toBeGreaterThanOrEqual(1);
    expect(marcasCalls.length).toBeGreaterThanOrEqual(1);
    expectLastApiMutationBody("/equipamentos/modelos", "POST", {
      nome: "M",
      marcaId: 1,
      minCaracteresImei: 14,
    });
  });

  it("updateModelo e deleteModelo: contrato HTTP e fechamento só no update", async () => {
    const { result, inv } = renderMutationsHook();
    act(() =>
      result.current.updateModeloMutation.mutate({
        id: 2,
        nome: "Y",
        ativo: true,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalModelo).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/modelos/2", "PATCH", {
      nome: "Y",
      ativo: true,
    });

    inv.mockClear();
    closers.closeModalModelo.mockClear();
    act(() => result.current.deleteModeloMutation.mutate(5));
    await waitFor(() =>
      expect(
        apiMock.mock.calls.some((c) => c[0] === "/equipamentos/modelos/5"),
      ).toBe(true),
    );
    expect(closers.closeModalModelo).not.toHaveBeenCalled();
    expectInvalidateWithKey(inv, equipamentosQueryKeys.modelos);
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcas);
  });

  it("operadoras: create/update fecham modal; delete não", async () => {
    const { result, inv } = renderMutationsHook();
    act(() => result.current.createOperadoraMutation.mutate({ nome: "Op" }));
    await waitFor(() =>
      expect(closers.closeModalOperadora).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/operadoras", "POST", {
      nome: "Op",
    });

    closers.closeModalOperadora.mockClear();
    act(() =>
      result.current.updateOperadoraMutation.mutate({
        id: 3,
        nome: "N",
        ativo: false,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalOperadora).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/operadoras/3", "PATCH", {
      nome: "N",
      ativo: false,
    });

    inv.mockClear();
    closers.closeModalOperadora.mockClear();
    act(() => result.current.deleteOperadoraMutation.mutate(3));
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(closers.closeModalOperadora).not.toHaveBeenCalled();
    expectInvalidateWithKey(inv, equipamentosQueryKeys.operadoras);
  });

  it("marca simcard: create/update fecham modal; delete não", async () => {
    const { result, inv } = renderMutationsHook();
    act(() =>
      result.current.createMarcaSimcardMutation.mutate({
        nome: "S",
        operadoraId: 1,
        temPlanos: true,
        minCaracteresIccid: 18,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalMarcaSimcard).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/marcas-simcard", "POST", {
      nome: "S",
      operadoraId: 1,
      temPlanos: true,
      minCaracteresIccid: 18,
    });

    closers.closeModalMarcaSimcard.mockClear();
    act(() =>
      result.current.updateMarcaSimcardMutation.mutate({
        id: 4,
        nome: "Z",
        ativo: false,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalMarcaSimcard).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/marcas-simcard/4", "PATCH", {
      nome: "Z",
      ativo: false,
    });

    inv.mockClear();
    closers.closeModalMarcaSimcard.mockClear();
    act(() => result.current.deleteMarcaSimcardMutation.mutate(8));
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(closers.closeModalMarcaSimcard).not.toHaveBeenCalled();
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcasSimcard);
  });

  it("plano simcard: create/update fecham modal; delete não", async () => {
    const { result, inv } = renderMutationsHook();
    act(() =>
      result.current.createPlanoSimcardMutation.mutate({
        marcaSimcardId: 10,
        planoMb: 100,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalPlanoSimcard).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/planos-simcard", "POST", {
      marcaSimcardId: 10,
      planoMb: 100,
    });

    closers.closeModalPlanoSimcard.mockClear();
    act(() =>
      result.current.updatePlanoSimcardMutation.mutate({
        id: 7,
        planoMb: 50,
      }),
    );
    await waitFor(() =>
      expect(closers.closeModalPlanoSimcard).toHaveBeenCalledTimes(1),
    );
    expectLastApiMutationBody("/equipamentos/planos-simcard/7", "PATCH", {
      planoMb: 50,
    });

    inv.mockClear();
    closers.closeModalPlanoSimcard.mockClear();
    act(() => result.current.deletePlanoSimcardMutation.mutate(12));
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(closers.closeModalPlanoSimcard).not.toHaveBeenCalled();
    expectInvalidateWithKey(inv, equipamentosQueryKeys.marcasSimcard);
  });

  it("onError: cada mutação usa toastApiError com mensagem de domínio estável", async () => {
    apiMock.mockImplementation(() => Promise.reject(new Error("rede")));

    type M = ReturnType<typeof useEquipamentosConfigCrudMutations>;

    const cases: ReadonlyArray<{
      label: string;
      run: (r: M) => void;
      fallback: string;
      closerShouldStayIdle: keyof typeof closers;
    }> = [
      {
        label: "createMarca",
        run: (r) => r.createMarcaMutation.mutate({ nome: "a" }),
        fallback: "Erro ao criar marca",
        closerShouldStayIdle: "closeModalMarca",
      },
      {
        label: "updateMarca",
        run: (r) => r.updateMarcaMutation.mutate({ id: 1, nome: "a" }),
        fallback: "Erro ao atualizar marca",
        closerShouldStayIdle: "closeModalMarca",
      },
      {
        label: "deleteMarca",
        run: (r) => r.deleteMarcaMutation.mutate(1),
        fallback: "Erro ao deletar marca",
        closerShouldStayIdle: "closeModalMarca",
      },
      {
        label: "createModelo",
        run: (r) => r.createModeloMutation.mutate({ nome: "m", marcaId: 1 }),
        fallback: "Erro ao criar modelo",
        closerShouldStayIdle: "closeModalModelo",
      },
      {
        label: "updateModelo",
        run: (r) => r.updateModeloMutation.mutate({ id: 1, nome: "m" }),
        fallback: "Erro ao atualizar modelo",
        closerShouldStayIdle: "closeModalModelo",
      },
      {
        label: "deleteModelo",
        run: (r) => r.deleteModeloMutation.mutate(1),
        fallback: "Erro ao deletar modelo",
        closerShouldStayIdle: "closeModalModelo",
      },
      {
        label: "createOperadora",
        run: (r) => r.createOperadoraMutation.mutate({ nome: "o" }),
        fallback: "Erro ao criar operadora",
        closerShouldStayIdle: "closeModalOperadora",
      },
      {
        label: "updateOperadora",
        run: (r) => r.updateOperadoraMutation.mutate({ id: 1, nome: "o" }),
        fallback: "Erro ao atualizar operadora",
        closerShouldStayIdle: "closeModalOperadora",
      },
      {
        label: "deleteOperadora",
        run: (r) => r.deleteOperadoraMutation.mutate(1),
        fallback: "Erro ao deletar operadora",
        closerShouldStayIdle: "closeModalOperadora",
      },
      {
        label: "createMarcaSimcard",
        run: (r) =>
          r.createMarcaSimcardMutation.mutate({
            nome: "s",
            operadoraId: 1,
          }),
        fallback: "Erro ao criar marca de simcard",
        closerShouldStayIdle: "closeModalMarcaSimcard",
      },
      {
        label: "updateMarcaSimcard",
        run: (r) => r.updateMarcaSimcardMutation.mutate({ id: 1, nome: "s" }),
        fallback: "Erro ao atualizar marca de simcard",
        closerShouldStayIdle: "closeModalMarcaSimcard",
      },
      {
        label: "deleteMarcaSimcard",
        run: (r) => r.deleteMarcaSimcardMutation.mutate(1),
        fallback: "Erro ao excluir marca de simcard",
        closerShouldStayIdle: "closeModalMarcaSimcard",
      },
      {
        label: "createPlanoSimcard",
        run: (r) =>
          r.createPlanoSimcardMutation.mutate({
            marcaSimcardId: 1,
            planoMb: 1,
          }),
        fallback: "Erro ao criar plano",
        closerShouldStayIdle: "closeModalPlanoSimcard",
      },
      {
        label: "updatePlanoSimcard",
        run: (r) => r.updatePlanoSimcardMutation.mutate({ id: 1, planoMb: 2 }),
        fallback: "Erro ao atualizar plano",
        closerShouldStayIdle: "closeModalPlanoSimcard",
      },
      {
        label: "deletePlanoSimcard",
        run: (r) => r.deletePlanoSimcardMutation.mutate(1),
        fallback: "Erro ao desativar plano",
        closerShouldStayIdle: "closeModalPlanoSimcard",
      },
    ];

    for (const { run, fallback, closerShouldStayIdle } of cases) {
      apiMock.mockClear();
      toastApiErrorMock.mockClear();
      Object.values(closers).forEach((f) => f.mockClear());

      const { result } = renderMutationsHook();
      act(() => run(result.current));

      await waitFor(
        () => {
          expect(toastApiErrorMock).toHaveBeenCalledWith(
            expect.any(Error),
            fallback,
          );
        },
        { timeout: 3000 },
      );
      expect(closers[closerShouldStayIdle]).not.toHaveBeenCalled();
    }
  });
});
