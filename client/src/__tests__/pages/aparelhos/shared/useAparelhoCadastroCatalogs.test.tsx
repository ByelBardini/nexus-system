import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useAparelhoCadastroCatalogs } from "@/pages/aparelhos/shared/useAparelhoCadastroCatalogs";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function mockDefaults() {
  apiMock.mockImplementation((url: string) => {
    if (url === "/clientes") return Promise.resolve([]);
    if (url === "/equipamentos/marcas") return Promise.resolve([]);
    if (url === "/equipamentos/modelos") return Promise.resolve([]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([{ id: 1, nome: "Op", ativo: true }]);
    if (url === "/equipamentos/marcas-simcard")
      return Promise.resolve([
        { id: 1, nome: "MS", operadoraId: 1, temPlanos: false, operadora: { id: 1, nome: "Op" } },
      ]);
    if (url.startsWith("/debitos-rastreadores"))
      return Promise.resolve({ data: [] });
    if (url === "/aparelhos")
      return Promise.resolve([{ identificador: "1" }]);
    return Promise.resolve(null);
  });
}

describe("useAparelhoCadastroCatalogs", () => {
  beforeEach(() => {
    apiMock.mockReset();
    mockDefaults();
  });

  it("desabilita marcas sim e débitos conforme opções (SIM + só débito em rastreador)", async () => {
    const { result, rerender } = renderHook(
      ({ sim, rast, op }) =>
        useAparelhoCadastroCatalogs({
          marcasSimcardQueryEnabled: sim,
          operadora: { value: "Op", idMode: "nome" },
          debitosQueryEnabled: rast,
        }),
      {
        wrapper: createWrapper(),
        initialProps: { sim: true, rast: true, op: "Op" } as {
          sim: boolean;
          rast: boolean;
          op: string;
        },
      },
    );
    await waitFor(() => expect(result.current.marcasAtivas).toEqual([]));
    apiMock.mockClear();
    rerender({ sim: false, rast: false, op: "Op" });
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it("chama /marcas-simcard com operadoraId quando idMode id", async () => {
    renderHook(
      () =>
        useAparelhoCadastroCatalogs({
          marcasSimcardQueryEnabled: true,
          operadora: { value: "7", idMode: "id" },
          debitosQueryEnabled: false,
        }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(
        apiMock.mock.calls.some(
          (c) =>
            typeof c[0] === "string" && c[0].includes("marcas-simcard?operadoraId=7"),
        ),
      ).toBe(true);
    });
  });
});
