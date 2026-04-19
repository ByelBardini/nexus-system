import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useConsultaPlaca } from "@/hooks/useConsultaPlaca";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

import { api } from "@/lib/api";

const mockDados = {
  marca: "VOLKSWAGEN",
  modelo: "GOL",
  ano: "2020",
  cor: "BRANCO",
};

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useConsultaPlaca", () => {
  it("null → enabled false, não chama API", () => {
    const { result } = renderHook(() => useConsultaPlaca(null), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api).not.toHaveBeenCalled();
  });

  it("placa com 6 caracteres → enabled false", () => {
    const { result } = renderHook(() => useConsultaPlaca("ABC123"), {
      wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("placa com 7 caracteres → chama API", async () => {
    vi.mocked(api).mockResolvedValue(mockDados);
    const { result } = renderHook(() => useConsultaPlaca("ABC1234"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api).toHaveBeenCalledWith("/veiculos/consulta-placa/ABC1234");
    expect(result.current.data).toEqual(mockDados);
  });

  it("placa com formatação → normaliza para alfanumérico", async () => {
    vi.mocked(api).mockResolvedValue(mockDados);
    const { result } = renderHook(() => useConsultaPlaca("ABC-1234"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api).toHaveBeenCalledWith("/veiculos/consulta-placa/ABC1234");
  });

  it("placa em lowercase → normaliza para uppercase", async () => {
    vi.mocked(api).mockResolvedValue(mockDados);
    const { result } = renderHook(() => useConsultaPlaca("abc1234"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api).toHaveBeenCalledWith("/veiculos/consulta-placa/ABC1234");
  });

  it("string vazia → enabled false", () => {
    const { result } = renderHook(() => useConsultaPlaca(""), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("API retorna erro → isError true", async () => {
    vi.mocked(api).mockRejectedValue(new Error("Placa não encontrada"));
    const { result } = renderHook(() => useConsultaPlaca("XYZ9999"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
