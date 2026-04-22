import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCadastroLote } from "@/pages/aparelhos/cadastro-lote/useCadastroLote";

const apiMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true }),
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

function setupApi() {
  apiMock.mockImplementation((url: string) => {
    if (url === "/clientes") return Promise.resolve([]);
    if (url === "/equipamentos/marcas")
      return Promise.resolve([{ id: 1, nome: "M1", ativo: true }]);
    if (url === "/equipamentos/modelos")
      return Promise.resolve([
        {
          id: 10,
          nome: "X1",
          ativo: true,
          marca: { id: 1, nome: "M1" },
          minCaracteresImei: 15,
        },
      ]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([{ id: 2, nome: "Op", ativo: true }]);
    if (url === "/equipamentos/marcas-simcard" || url.includes("marcas-simcard"))
      return Promise.resolve([
        {
          id: 3,
          nome: "SC",
          operadoraId: 2,
          temPlanos: false,
          operadora: { id: 2, nome: "Op" },
        },
      ]);
    if (url.startsWith("/debitos-rastreadores"))
      return Promise.resolve({ data: [] });
    if (url === "/aparelhos")
      return Promise.resolve([{ identificador: "999999999999999", lote: null }]);
    return Promise.resolve(null);
  });
}

describe("useCadastroLote", () => {
  beforeEach(() => {
    apiMock.mockReset();
    navigateMock.mockReset();
    setupApi();
  });

  it("inicia com podeSalvar false (formulário vazio / valor zero)", async () => {
    const { result } = renderHook(() => useCadastroLote(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.marcasAtivas.length).toBeGreaterThan(0);
    });
    expect(result.current.podeSalvar).toBe(false);
  });

  it("podeSalvar fica true após preencher rastreador, IDs e valor (edge: trim na referência)", async () => {
    const { result } = renderHook(() => useCadastroLote(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

    act(() => {
      result.current.form.setValue("referencia", "  L-1  ");
      result.current.form.setValue("marca", "1");
      result.current.form.setValue("modelo", "10");
      result.current.form.setValue("idsTexto", "123456789012345");
      result.current.form.setValue("valorUnitario", 1000);
    });

    await waitFor(() => {
      expect(result.current.podeSalvar).toBe(true);
    });
  });

  it("podeSalvar exige operadora no modo SIM", async () => {
    const { result } = renderHook(() => useCadastroLote(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.operadorasAtivas.length).toBe(1));

    act(() => {
      result.current.form.setValue("referencia", "S");
      result.current.form.setValue("tipo", "SIM");
      result.current.form.setValue("definirIds", false);
      result.current.form.setValue("quantidade", 1);
      result.current.form.setValue("valorUnitario", 1000);
    });
    expect(result.current.podeSalvar).toBe(false);

    act(() => {
      result.current.form.setValue("operadora", "2");
      result.current.form.setValue(
        "idsTexto",
        "1234567890123456789",
      );
    });
    act(() => {
      result.current.form.setValue("definirIds", true);
    });
    await waitFor(() => {
      expect(result.current.idValidation.validos.length).toBe(1);
    });
    expect(result.current.podeSalvar).toBe(true);
  });
});
