import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePareamentoRemoteQueries } from "@/pages/equipamentos/pareamento/hooks/usePareamentoRemoteQueries";

type QueryOpts = { enabled?: boolean; queryKey: unknown };

const queryCalls: QueryOpts[] = [];

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: vi.fn((opts: QueryOpts) => {
      queryCalls.push(opts);
      return { data: [] };
    }),
  };
});

describe("usePareamentoRemoteQueries", () => {
  beforeEach(() => {
    queryCalls.length = 0;
  });

  it("modo csv: desabilita queries de lotes e catálogos de equipamento", () => {
    renderHook(() =>
      usePareamentoRemoteQueries({
        modo: "csv",
        proprietarioIndividual: "INFINITY",
        proprietarioMassa: "INFINITY",
        proprietarioCsv: "INFINITY",
        loteBuscaRastreador: "",
        loteBuscaSim: "",
      }),
    );
    const lotesR = queryCalls.find(
      (c) =>
        Array.isArray(c.queryKey) && c.queryKey[0] === "lotes-rastreadores",
    );
    const marcas = queryCalls.find(
      (c) => Array.isArray(c.queryKey) && c.queryKey[0] === "marcas",
    );
    expect(lotesR?.enabled).toBe(false);
    expect(marcas?.enabled).toBe(false);
  });

  it("modo individual: habilita lotes e catálogos", () => {
    renderHook(() =>
      usePareamentoRemoteQueries({
        modo: "individual",
        proprietarioIndividual: "INFINITY",
        proprietarioMassa: "INFINITY",
        proprietarioCsv: "INFINITY",
        loteBuscaRastreador: "",
        loteBuscaSim: "",
      }),
    );
    const lotesR = queryCalls.find(
      (c) =>
        Array.isArray(c.queryKey) && c.queryKey[0] === "lotes-rastreadores",
    );
    const marcas = queryCalls.find(
      (c) => Array.isArray(c.queryKey) && c.queryKey[0] === "marcas",
    );
    expect(lotesR?.enabled).toBe(true);
    expect(marcas?.enabled).toBe(true);
  });

  it("habilita clientes quando qualquer proprietário é CLIENTE", () => {
    renderHook(() =>
      usePareamentoRemoteQueries({
        modo: "csv",
        proprietarioIndividual: "INFINITY",
        proprietarioMassa: "INFINITY",
        proprietarioCsv: "CLIENTE",
        loteBuscaRastreador: "",
        loteBuscaSim: "",
      }),
    );
    const clientes = queryCalls.find(
      (c) => Array.isArray(c.queryKey) && c.queryKey[0] === "clientes-lista",
    );
    expect(clientes?.enabled).toBe(true);
  });

  it("edge: todos INFINITY no csv → clientes desabilitado", () => {
    renderHook(() =>
      usePareamentoRemoteQueries({
        modo: "csv",
        proprietarioIndividual: "INFINITY",
        proprietarioMassa: "INFINITY",
        proprietarioCsv: "INFINITY",
        loteBuscaRastreador: "",
        loteBuscaSim: "",
      }),
    );
    const clientes = queryCalls.find(
      (c) => Array.isArray(c.queryKey) && c.queryKey[0] === "clientes-lista",
    );
    expect(clientes?.enabled).toBe(false);
  });
});
