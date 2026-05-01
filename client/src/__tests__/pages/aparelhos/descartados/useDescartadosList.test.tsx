import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDescartadosList } from "@/pages/aparelhos/descartados/useDescartadosList";
import type { AparelhoDescartado } from "@/pages/aparelhos/descartados/useDescartadosList";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: (...a: unknown[]) => apiMock(...a) }));

const descartadoFixture = (
  overrides: Partial<AparelhoDescartado> = {},
): AparelhoDescartado => ({
  id: 1,
  tipo: "RASTREADOR",
  identificador: "IMEI001",
  proprietario: "INFINITY",
  marca: "Suntech",
  modelo: "ST-901",
  operadora: null,
  categoriaFalha: null,
  motivoDefeito: null,
  responsavel: null,
  descartadoEm: "2026-04-01T00:00:00.000Z",
  criadoEm: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useDescartadosList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca GET /aparelhos/descartados e retorna lista", async () => {
    const lista = [
      descartadoFixture({ id: 1 }),
      descartadoFixture({ id: 2, identificador: "IMEI002" }),
    ];
    apiMock.mockResolvedValue(lista);

    const { result } = renderHook(() => useDescartadosList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.lista).toHaveLength(2);
    expect(apiMock).toHaveBeenCalledWith("/aparelhos/descartados");
  });

  it("filtra por busca de identificador", async () => {
    apiMock.mockResolvedValue([
      descartadoFixture({ id: 1, identificador: "IMEI001" }),
      descartadoFixture({ id: 2, identificador: "ICCID999" }),
    ]);

    const { result } = renderHook(() => useDescartadosList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.setBusca("IMEI");
    await waitFor(() => expect(result.current.lista).toHaveLength(1));
    expect(result.current.lista[0].id).toBe(1);
  });

  it("filtra por tipo RASTREADOR", async () => {
    apiMock.mockResolvedValue([
      descartadoFixture({ id: 1, tipo: "RASTREADOR" }),
      descartadoFixture({ id: 2, tipo: "SIM" }),
    ]);

    const { result } = renderHook(() => useDescartadosList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.setTipoFilter("RASTREADOR");
    await waitFor(() => expect(result.current.lista).toHaveLength(1));
    expect(result.current.lista[0].tipo).toBe("RASTREADOR");
  });

  it("filtra por tipo SIM", async () => {
    apiMock.mockResolvedValue([
      descartadoFixture({ id: 1, tipo: "RASTREADOR" }),
      descartadoFixture({ id: 2, tipo: "SIM", identificador: "8955001" }),
    ]);

    const { result } = renderHook(() => useDescartadosList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.setTipoFilter("SIM");
    await waitFor(() => expect(result.current.lista).toHaveLength(1));
    expect(result.current.lista[0].tipo).toBe("SIM");
  });

  it("TODOS retorna todos os registros", async () => {
    const lista = [
      descartadoFixture({ id: 1, tipo: "RASTREADOR" }),
      descartadoFixture({ id: 2, tipo: "SIM" }),
    ];
    apiMock.mockResolvedValue(lista);

    const { result } = renderHook(() => useDescartadosList(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.lista).toHaveLength(2);
  });
});
