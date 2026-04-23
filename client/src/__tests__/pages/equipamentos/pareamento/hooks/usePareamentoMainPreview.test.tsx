import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePareamentoMainPreview } from "@/pages/equipamentos/pareamento/hooks/usePareamentoMainPreview";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));

vi.mock("@/lib/toast-api-error", () => ({
  toastApiError: (e: unknown, fb: string) =>
    toastError(e instanceof Error ? e.message : fb),
}));

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const W = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return W;
}

const base = {
  modo: "individual" as const,
  paresIndividual: [{ imei: "123456789012345", iccid: "89551012345678901234" }],
  paresMassa: [] as { imei: string; iccid: string }[],
  podeConfirmarIndividual: true,
  imeiIndividual: "123456789012345",
  iccidIndividual: "89551012345678901234",
  quantidadeBate: true,
  imeisLength: 1,
  iccidsLength: 1,
  minImeiIndividual: 15,
  minIccidIndividual: 19,
};

describe("usePareamentoMainPreview", () => {
  beforeEach(() => {
    apiMock.mockReset();
    toastError.mockReset();
    apiMock.mockResolvedValue({ linhas: [] });
  });

  it("mutation de preview: POST /preview com pares no modo individual", async () => {
    const { result } = renderHook(
      () =>
        usePareamentoMainPreview({
          ...base,
        }),
      { wrapper: wrapper() },
    );
    await act(async () => {
      result.current.previewMutation.mutate();
    });
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledWith(
      "/aparelhos/pareamento/preview",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      (apiMock.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.pares).toEqual(base.paresIndividual);
  });

  it("modo massa: envia paresMassa no preview", async () => {
    const paresMassa = [{ imei: "1", iccid: "2" }];
    const { result } = renderHook(
      () =>
        usePareamentoMainPreview({
          ...base,
          modo: "massa",
          paresMassa,
          paresIndividual: [],
        }),
      { wrapper: wrapper() },
    );
    await act(async () => {
      result.current.previewMutation.mutate();
    });
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    const body = JSON.parse(
      (apiMock.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.pares).toEqual(paresMassa);
  });

  it("handleGerarPreview: individual sem pares válidos → toast e sem API", () => {
    const { result } = renderHook(
      () =>
        usePareamentoMainPreview({
          ...base,
          paresIndividual: [],
          podeConfirmarIndividual: false,
        }),
      { wrapper: wrapper() },
    );
    act(() => {
      result.current.handleGerarPreview();
    });
    expect(toastError).toHaveBeenCalled();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("handleGerarPreview: massa sem quantidadeBate → toast de contagem", () => {
    const { result } = renderHook(
      () =>
        usePareamentoMainPreview({
          ...base,
          modo: "massa",
          quantidadeBate: false,
          imeisLength: 2,
          iccidsLength: 1,
          paresMassa: [{ imei: "a", iccid: "b" }],
        }),
      { wrapper: wrapper() },
    );
    act(() => {
      result.current.handleGerarPreview();
    });
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/2.*IMEIs.*1.*ICCIDs/),
    );
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("edge: zero pares em massa com quantidade ok → pede para colar listas", () => {
    const { result } = renderHook(
      () =>
        usePareamentoMainPreview({
          ...base,
          modo: "massa",
          paresMassa: [],
          quantidadeBate: true,
        }),
      { wrapper: wrapper() },
    );
    act(() => {
      result.current.handleGerarPreview();
    });
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/cole as listas/i),
    );
  });
});
