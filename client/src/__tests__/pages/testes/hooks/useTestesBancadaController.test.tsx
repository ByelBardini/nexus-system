import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useTestesBancadaController } from "@/pages/testes/hooks/useTestesBancadaController";
import { osTesteFixture, rastreadorTesteFixture } from "../fixtures";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

function createWrapper(qc: QueryClient, initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <QueryClientProvider client={qc}>
          <Routes>
            <Route path="/testes" element={children} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

beforeEach(() => {
  api.mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.info).mockClear();
});

describe("useTestesBancadaController", () => {
  it("fluxo: carrega fila, seleciona primeira OS e sincroniza IMEI (INSTALACAO)", async () => {
    const os = osTesteFixture({
      id: 10,
      idAparelho: "IMEI-SYNC",
      tipo: "INSTALACAO",
    });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([rastreadorTesteFixture({ identificador: "IMEI-SYNC" })]);
      return Promise.resolve({});
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesBancadaController(), {
      wrapper: createWrapper(qc, "/testes"),
    });
    await waitFor(() => expect(result.current.selectedOsId).toBe(10));
    await waitFor(() => expect(result.current.imeiSearch).toBe("IMEI-SYNC"));
  });

  it("edge: REVISAO sincroniza idEntrada em vez de idAparelho", async () => {
    const os = osTesteFixture({
      tipo: "REVISAO",
      idEntrada: "ENT-1",
      idAparelho: "SAI-9",
    });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([]);
      return Promise.resolve({});
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesBancadaController(), {
      wrapper: createWrapper(qc, "/testes"),
    });
    await waitFor(() => expect(result.current.selectedOs?.tipo).toBe("REVISAO"));
    await waitFor(() => expect(result.current.imeiSearch).toBe("ENT-1"));
  });

  it("edge: ?osId na URL define seleção inicial", async () => {
    const a = osTesteFixture({ id: 1, numero: 1 });
    const b = osTesteFixture({ id: 2, numero: 2 });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([a, b]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([]);
      return Promise.resolve({});
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesBancadaController(), {
      wrapper: createWrapper(qc, "/testes?osId=2"),
    });
    await waitFor(() => expect(result.current.selectedOsId).toBe(2));
  });

  it("handleFinalizar: validações exibem toast.error", async () => {
    const os = osTesteFixture({ idAparelho: "" });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      return Promise.resolve([]);
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesBancadaController(), {
      wrapper: createWrapper(qc, "/testes"),
    });
    await waitFor(() => expect(result.current.selectedOs).not.toBeNull());
    result.current.handleFinalizar();
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Selecione e vincule um aparelho para finalizar",
    );
  });

  it("handleFinalizar: sucesso chama API com TESTES_REALIZADOS", async () => {
    const os = osTesteFixture({ id: 77, idAparelho: "OK" });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([rastreadorTesteFixture({ identificador: "OK" })]);
      return Promise.resolve({});
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useTestesBancadaController(), {
      wrapper: createWrapper(qc, "/testes"),
    });
    await waitFor(() => expect(result.current.imeiSearch).toBe("OK"));
    await act(async () => {
      result.current.handleComunicacaoChange("COMUNICANDO");
      result.current.setNovoLocalInstalacao("Painel");
    });
    await waitFor(() => expect(result.current.canFinalizar).toBe(true));
    await act(async () => {
      result.current.handleFinalizar();
    });
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "/ordens-servico/77/status",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("TESTES_REALIZADOS"),
        }),
      ),
    );
  });
});
