import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPareamentoPostBody } from "@/pages/equipamentos/pareamento/domain/payload";
import { usePareamentoSubmitMutation } from "@/pages/equipamentos/pareamento/hooks/usePareamentoSubmitMutation";

type PostInput = Parameters<typeof buildPareamentoPostBody>[0];

const apiMock = vi.hoisted(() => vi.fn());
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
  return {
    client,
    W: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe("usePareamentoSubmitMutation", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ criados: 2 });
  });

  it("onSuccess individual: chama apenas onIndividualSuccess", async () => {
    const onIndividualSuccess = vi.fn();
    const onMassaSuccess = vi.fn();
    const setQ = vi.fn() as unknown as Dispatch<SetStateAction<number>>;
    const { W, client } = createWrapper();
    const inv = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () =>
        usePareamentoSubmitMutation({
          getModo: () => "individual",
          getPostBodyInput: (): PostInput => ({
            modo: "individual",
            paresIndividual: [{ imei: "1", iccid: "2" }],
            preview: null,
            proprietario: "INFINITY",
            clienteId: null,
            loteRastreadorId: "",
            loteSimId: "",
            criarNovoRastreador: false,
            criarNovoSim: false,
            pertenceLoteRastreador: false,
            pertenceLoteSim: false,
            marcaRastreador: "",
            modeloRastreador: "",
            marcaSimcardIdSim: "",
            planoSimcardIdSim: "",
            operadoraSim: "",
            criarNovoRastreadorMassa: false,
            criarNovoSimMassa: false,
            pertenceLoteRastreadorMassa: true,
            pertenceLoteSimMassa: true,
            marcaRastreadorMassa: "",
            modeloRastreadorMassa: "",
            marcaSimcardIdSimMassa: "",
            planoSimcardIdSimMassa: "",
            operadoraSimMassa: "",
          }),
          onIndividualSuccess,
          onMassaSuccess,
          setQuantidadeCriada: setQ,
          queryClient: client,
        }),
      { wrapper: W },
    );
    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(onIndividualSuccess).toHaveBeenCalled());
    expect(onMassaSuccess).not.toHaveBeenCalled();
    expect(apiMock).toHaveBeenCalledWith(
      "/aparelhos/pareamento",
      expect.objectContaining({ method: "POST" }),
    );
    expect(inv).toHaveBeenCalledWith({ queryKey: ["aparelhos"] });
  });

  it("onSuccess massa: chama onMassaSuccess", async () => {
    const onIndividualSuccess = vi.fn();
    const onMassaSuccess = vi.fn();
    const setQ = vi.fn() as unknown as Dispatch<SetStateAction<number>>;
    const { W, client } = createWrapper();
    const { result } = renderHook(
      () =>
        usePareamentoSubmitMutation({
          getModo: () => "massa",
          getPostBodyInput: (): PostInput => ({
            modo: "massa",
            paresIndividual: [],
            preview: {
              linhas: [
                {
                  imei: "1",
                  iccid: "2",
                  tracker_status: "FOUND_AVAILABLE",
                  sim_status: "FOUND_AVAILABLE",
                  action_needed: "OK",
                },
              ],
              contadores: { validos: 1, exigemLote: 0, erros: 0 },
            },
            proprietario: "INFINITY",
            clienteId: null,
            loteRastreadorId: "",
            loteSimId: "",
            criarNovoRastreador: false,
            criarNovoSim: false,
            pertenceLoteRastreador: false,
            pertenceLoteSim: false,
            marcaRastreador: "",
            modeloRastreador: "",
            marcaSimcardIdSim: "",
            planoSimcardIdSim: "",
            operadoraSim: "",
            criarNovoRastreadorMassa: false,
            criarNovoSimMassa: false,
            pertenceLoteRastreadorMassa: true,
            pertenceLoteSimMassa: true,
            marcaRastreadorMassa: "",
            modeloRastreadorMassa: "",
            marcaSimcardIdSimMassa: "",
            planoSimcardIdSimMassa: "",
            operadoraSimMassa: "",
          }),
          onIndividualSuccess,
          onMassaSuccess,
          setQuantidadeCriada: setQ,
          queryClient: client,
        }),
      { wrapper: W },
    );
    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(onMassaSuccess).toHaveBeenCalled());
    expect(onIndividualSuccess).not.toHaveBeenCalled();
  });
});
