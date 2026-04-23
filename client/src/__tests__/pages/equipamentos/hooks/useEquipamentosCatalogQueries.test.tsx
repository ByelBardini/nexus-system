import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEquipamentosFullCatalogQueries,
  useEquipamentosMarcasSimcardListQuery,
  useEquipamentosTrioCatalogQueries,
} from "@/pages/equipamentos/hooks/useEquipamentosCatalogQueries";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockImplementation((url: string) => {
    if (url === "/equipamentos/marcas") return Promise.resolve([]);
    if (url === "/equipamentos/modelos") return Promise.resolve([]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([{ id: 1, nome: "Op" }]);
    if (
      url === "/equipamentos/marcas-simcard" ||
      url.includes("marcas-simcard")
    )
      return Promise.resolve([{ id: 9, nome: "Sim" }]);
    return Promise.resolve(null);
  });
});

describe("useEquipamentosTrioCatalogQueries", () => {
  it("consolida as três listagens e carrega com enabled padrão true", async () => {
    const { result } = renderHook(() => useEquipamentosTrioCatalogQueries(), {
      wrapper: wrapper(),
    });
    await waitFor(() =>
      expect(
        result.current.marcas.length >= 0 && result.current.loadingMarcas,
      ).toBeDefined(),
    );
    await waitFor(() => expect(result.current.loadingMarcas).toBe(false));
    expect(result.current.operadoras).toEqual([{ id: 1, nome: "Op" }]);
    expect(
      apiMock.mock.calls.filter((c) => c[0] === "/equipamentos/marcas").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("edge: mount com enabled false mantém listagens vazias (sem buscar)", () => {
    const { result } = renderHook(
      () => useEquipamentosTrioCatalogQueries({ enabled: false }),
      { wrapper: wrapper() },
    );
    expect(result.current.marcas).toEqual([]);
    expect(result.current.operadoras).toEqual([]);
  });
});

describe("useEquipamentosFullCatalogQueries", () => {
  it("inclui marcas-simcard lista completa e isLoading fica false após sucesso", async () => {
    const { result } = renderHook(() => useEquipamentosFullCatalogQueries(), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.marcasSimcard[0]).toMatchObject({
      id: 9,
      nome: "Sim",
    });
  });

  it("edge: enabled false — queryFn de catálogos não é executada (sem dados iniciais)", () => {
    const { result } = renderHook(
      () => useEquipamentosFullCatalogQueries({ enabled: false }),
      { wrapper: wrapper() },
    );
    expect(result.current.isLoading).toBe(false);
    expect(
      result.current.marcas.length + result.current.marcasSimcard.length,
    ).toBe(0);
  });
});

describe("useEquipamentosMarcasSimcardListQuery", () => {
  it("chama URL com operadoraId quando operadoraId é número", async () => {
    apiMock.mockClear();
    renderHook(
      () =>
        useEquipamentosMarcasSimcardListQuery({
          operadoraId: 7,
          queryEnabled: true,
        }),
      { wrapper: wrapper() },
    );
    await waitFor(() =>
      expect(
        apiMock.mock.calls.some((c) =>
          String(c[0]).includes("marcas-simcard?operadoraId=7"),
        ),
      ).toBe(true),
    );
  });

  it("chama /marcas-simcard sem query quando operadoraId null", async () => {
    apiMock.mockClear();
    const { result } = renderHook(
      () =>
        useEquipamentosMarcasSimcardListQuery({
          operadoraId: null,
          queryEnabled: true,
        }),
      { wrapper: wrapper() },
    );
    await waitFor(() =>
      expect(
        apiMock.mock.calls.some((c) => c[0] === "/equipamentos/marcas-simcard"),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(result.current.marcasSimcard[0]).toMatchObject({
        id: 9,
        nome: "Sim",
      }),
    );
  });

  it("edge: queryEnabled false não requisita", async () => {
    apiMock.mockClear();
    const { result } = renderHook(
      () =>
        useEquipamentosMarcasSimcardListQuery({
          operadoraId: 1,
          queryEnabled: false,
        }),
      { wrapper: wrapper() },
    );
    await waitFor(() => {
      expect(result.current.loadingMarcasSimcard).toBe(false);
    });
    expect(
      apiMock.mock.calls.filter((c) => String(c[0]).includes("marcas-simcard"))
        .length,
    ).toBe(0);
  });
});
