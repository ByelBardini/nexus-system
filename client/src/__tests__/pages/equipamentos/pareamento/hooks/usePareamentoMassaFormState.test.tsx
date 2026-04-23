import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePareamentoMassaFormState } from "@/pages/equipamentos/pareamento/hooks/usePareamentoMassaFormState";

describe("usePareamentoMassaFormState", () => {
  it("estado inicial: pertence lote true (padrão massa)", () => {
    const { result } = renderHook(() => usePareamentoMassaFormState());
    expect(result.current.pertenceLoteRastreadorMassa).toBe(true);
    expect(result.current.pertenceLoteSimMassa).toBe(true);
    expect(result.current.textImeis).toBe("");
    expect(result.current.criarNovoRastreadorMassa).toBe(false);
  });

  it("atualiza listas de texto", () => {
    const { result } = renderHook(() => usePareamentoMassaFormState());
    act(() => {
      result.current.setTextImeis("1\n2");
      result.current.setTextIccids("a\nb");
    });
    expect(result.current.textImeis).toBe("1\n2");
    expect(result.current.textIccids).toBe("a\nb");
  });

  it("edge: flags de criar novo massa", () => {
    const { result } = renderHook(() => usePareamentoMassaFormState());
    act(() => {
      result.current.setCriarNovoRastreadorMassa(true);
      result.current.setCriarNovoSimMassa(true);
    });
    expect(result.current.criarNovoRastreadorMassa).toBe(true);
    expect(result.current.criarNovoSimMassa).toBe(true);
  });
});
