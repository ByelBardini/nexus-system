import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buscarCEP, useMunicipios, useUFs } from "@/hooks/useBrasilAPI";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockUFs = [
  {
    id: 35,
    sigla: "SP",
    nome: "São Paulo",
    regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
  },
];

const mockMunicipios = [
  { nome: "São Paulo", codigo_ibge: "3550308" },
  { nome: "Campinas", codigo_ibge: "3509502" },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useUFs", () => {
  it("retorna lista de UFs em sucesso", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUFs),
    } as Response);

    const { result } = renderHook(() => useUFs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUFs);
  });

  it("lança erro quando API falha", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useUFs(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});

describe("useMunicipios", () => {
  it("não faz fetch quando siglaUF é null (enabled: false)", () => {
    const fetchMock = vi.mocked(fetch);
    const { result } = renderHook(() => useMunicipios(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("busca municípios quando siglaUF é fornecida", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMunicipios),
    } as Response);

    const { result } = renderHook(() => useMunicipios("SP"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMunicipios);
  });

  it("lança erro quando API de municípios falha", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useMunicipios("XX"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("buscarCEP", () => {
  it("retorna endereço completo para CEP válido", async () => {
    const mockEndereco = {
      cep: "01310-100",
      logradouro: "Avenida Paulista",
      complemento: "",
      bairro: "Bela Vista",
      localidade: "São Paulo",
      uf: "SP",
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEndereco),
    } as Response);

    const result = await buscarCEP("01310100");
    expect(result).toEqual(mockEndereco);
  });

  it("normaliza CEP com hífen antes de buscar", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          cep: "01310-100",
          logradouro: "Av Paulista",
          complemento: "",
          bairro: "Bela Vista",
          localidade: "SP",
          uf: "SP",
        }),
    } as Response);

    await buscarCEP("01310-100");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("01310100"));
  });

  it("retorna null para CEP com menos de 8 dígitos", async () => {
    const result = await buscarCEP("123");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retorna null quando resposta tem erro: true", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ erro: true }),
    } as Response);

    const result = await buscarCEP("99999999");
    expect(result).toBeNull();
  });

  it("retorna null quando fetch lança exceção", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const result = await buscarCEP("01310100");
    expect(result).toBeNull();
  });

  it("retorna null quando resposta não é ok", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const result = await buscarCEP("00000000");
    expect(result).toBeNull();
  });
});
