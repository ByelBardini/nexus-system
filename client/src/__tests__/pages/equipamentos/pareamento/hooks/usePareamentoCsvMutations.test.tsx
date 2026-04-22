import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePareamentoCsvMutations } from "@/pages/equipamentos/pareamento/hooks/usePareamentoCsvMutations";
import { pareamentoQueryKeys } from "@/pages/equipamentos/pareamento/domain/query-keys";

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

describe("usePareamentoCsvMutations", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("preview: POST /csv/preview com linhas e proprietário", async () => {
    apiMock.mockResolvedValue({
      linhas: [],
      contadores: { validos: 0, comAviso: 0, erros: 0 },
    });
    const setCsvPreview = vi.fn();
    const { W } = createWrapper();
    const { result } = renderHook(
      () =>
        usePareamentoCsvMutations({
          csvLinhas: [{ imei: "1", iccid: "2" }],
          proprietarioCsv: "CLIENTE",
          clienteIdCsv: 9,
          setCsvPreview,
          onImportSuccess: vi.fn(),
        }),
      { wrapper: W },
    );
    await act(async () => {
      result.current.csvPreviewMutation.mutate();
    });
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledWith(
      "/aparelhos/pareamento/csv/preview",
      expect.anything(),
    );
    const init = apiMock.mock.calls[0][1] as { body: string };
    const body = JSON.parse(init.body);
    expect(body.linhas).toEqual([{ imei: "1", iccid: "2" }]);
    expect(body.proprietario).toBe("CLIENTE");
    expect(body.clienteId).toBe(9);
  });

  it("importar: invalida aparelhos e lotes; chama onImportSuccess", async () => {
    apiMock.mockResolvedValue({ criados: 3 });
    const onImportSuccess = vi.fn();
    const { W, client } = createWrapper();
    const inv = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () =>
        usePareamentoCsvMutations({
          csvLinhas: [{ imei: "1", iccid: "2" }],
          proprietarioCsv: "INFINITY",
          clienteIdCsv: null,
          setCsvPreview: vi.fn(),
          onImportSuccess,
          queryClient: client,
        }),
      { wrapper: W },
    );
    await act(async () => {
      result.current.csvImportarMutation.mutate();
    });
    await waitFor(() => expect(onImportSuccess).toHaveBeenCalled());
    const keys = inv.mock.calls.map(
      (c) => (c[0] as { queryKey: unknown }).queryKey,
    );
    expect(keys.some((k) => Array.isArray(k) && k[0] === "aparelhos")).toBe(
      true,
    );
    expect(
      keys.some(
        (k) =>
          Array.isArray(k) && k[0] === pareamentoQueryKeys.lotesRastreadores[0],
      ),
    ).toBe(true);
  });

  it("edge: clienteId omitido no body quando null", async () => {
    apiMock.mockResolvedValue({ linhas: [] });
    const { W } = createWrapper();
    const { result } = renderHook(
      () =>
        usePareamentoCsvMutations({
          csvLinhas: [],
          proprietarioCsv: "INFINITY",
          clienteIdCsv: null,
          setCsvPreview: vi.fn(),
          onImportSuccess: vi.fn(),
        }),
      { wrapper: W },
    );
    await act(async () => {
      result.current.csvPreviewMutation.mutate();
    });
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    const body = JSON.parse(
      (apiMock.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.clienteId).toBeUndefined();
  });
});
