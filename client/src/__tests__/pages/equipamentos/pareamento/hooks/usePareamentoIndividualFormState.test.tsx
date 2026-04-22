import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePareamentoIndividualFormState } from "@/pages/equipamentos/pareamento/hooks/usePareamentoIndividualFormState";

describe("usePareamentoIndividualFormState", () => {
  it("estado inicial coerente", () => {
    const { result } = renderHook(() => usePareamentoIndividualFormState());
    expect(result.current.imeiIndividual).toBe("");
    expect(result.current.proprietarioIndividual).toBe("INFINITY");
    expect(result.current.clienteIdIndividual).toBeNull();
    expect(result.current.quantidadeCriada).toBe(0);
    expect(result.current.criarNovoRastreador).toBe(false);
    expect(result.current.pertenceLoteRastreador).toBe(false);
  });

  it("permite atualizar IMEI e incrementar quantidade criada", () => {
    const { result } = renderHook(() => usePareamentoIndividualFormState());
    act(() => {
      result.current.setImeiIndividual("123");
      result.current.setQuantidadeCriada(5);
    });
    expect(result.current.imeiIndividual).toBe("123");
    expect(result.current.quantidadeCriada).toBe(5);
  });

  it("edge: alterna proprietário para CLIENTE e define clienteId", () => {
    const { result } = renderHook(() => usePareamentoIndividualFormState());
    act(() => {
      result.current.setProprietarioIndividual("CLIENTE");
      result.current.setClienteIdIndividual(42);
    });
    expect(result.current.proprietarioIndividual).toBe("CLIENTE");
    expect(result.current.clienteIdIndividual).toBe(42);
  });
});
