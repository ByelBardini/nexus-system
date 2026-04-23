import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePareamentoSharedLotesState } from "@/pages/equipamentos/pareamento/hooks/usePareamentoSharedLotesState";

describe("usePareamentoSharedLotesState", () => {
  it("estado inicial de lotes vazio", () => {
    const { result } = renderHook(() => usePareamentoSharedLotesState());
    expect(result.current.loteRastreadorId).toBe("");
    expect(result.current.loteSimId).toBe("");
    expect(result.current.loteBuscaRastreador).toBe("");
    expect(result.current.loteBuscaSim).toBe("");
  });

  it("compartilha ids entre atualizações (fluxo típico)", () => {
    const { result } = renderHook(() => usePareamentoSharedLotesState());
    act(() => {
      result.current.setLoteRastreadorId("10");
      result.current.setLoteSimId("20");
      result.current.setLoteBuscaRastreador("ref-a");
      result.current.setLoteBuscaSim("ref-b");
    });
    expect(result.current.loteRastreadorId).toBe("10");
    expect(result.current.loteSimId).toBe("20");
    expect(result.current.loteBuscaRastreador).toBe("ref-a");
    expect(result.current.loteBuscaSim).toBe("ref-b");
  });

  it("edge: limpar buscas mantém ids ou vice-versa — setters independentes", () => {
    const { result } = renderHook(() => usePareamentoSharedLotesState());
    act(() => {
      result.current.setLoteRastreadorId("5");
      result.current.setLoteBuscaRastreador("x");
    });
    act(() => {
      result.current.setLoteBuscaRastreador("");
    });
    expect(result.current.loteRastreadorId).toBe("5");
    expect(result.current.loteBuscaRastreador).toBe("");
  });
});
