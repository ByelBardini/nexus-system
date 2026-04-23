import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePareamentoModoFromSearchParams } from "@/pages/equipamentos/pareamento/hooks/usePareamentoModoFromSearchParams";

const searchParamsRef = { current: new URLSearchParams() };

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [searchParamsRef.current, vi.fn()],
}));

describe("usePareamentoModoFromSearchParams", () => {
  beforeEach(() => {
    searchParamsRef.current = new URLSearchParams();
  });

  it("default individual quando query vazia ou inválida", () => {
    const { result } = renderHook(() => usePareamentoModoFromSearchParams());
    expect(result.current.modo).toBe("individual");
  });

  it("inicializa a partir de modo=massa na URL", () => {
    searchParamsRef.current = new URLSearchParams("modo=massa");
    const { result } = renderHook(() => usePareamentoModoFromSearchParams());
    expect(result.current.modo).toBe("massa");
  });

  it("inicializa modo=csv", () => {
    searchParamsRef.current = new URLSearchParams("modo=csv");
    const { result } = renderHook(() => usePareamentoModoFromSearchParams());
    expect(result.current.modo).toBe("csv");
  });

  it("ignora modo desconhecido (volta para individual)", () => {
    searchParamsRef.current = new URLSearchParams("modo=xyz");
    const { result } = renderHook(() => usePareamentoModoFromSearchParams());
    expect(result.current.modo).toBe("individual");
  });

  it("setModo altera modo localmente", () => {
    const { result } = renderHook(() => usePareamentoModoFromSearchParams());
    act(() => result.current.setModo("csv"));
    expect(result.current.modo).toBe("csv");
  });
});
