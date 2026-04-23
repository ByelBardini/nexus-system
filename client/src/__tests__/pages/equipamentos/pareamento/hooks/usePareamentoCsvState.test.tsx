import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePareamentoCsvState } from "@/pages/equipamentos/pareamento/hooks/usePareamentoCsvState";

describe("usePareamentoCsvState", () => {
  it("estado inicial CSV", () => {
    const { result } = renderHook(() => usePareamentoCsvState());
    expect(result.current.csvFileName).toBe("");
    expect(result.current.csvLinhas).toEqual([]);
    expect(result.current.csvParseErro).toBe("");
    expect(result.current.csvPreview).toBeNull();
    expect(result.current.proprietarioCsv).toBe("INFINITY");
    expect(result.current.clienteIdCsv).toBeNull();
    expect(result.current.csvFileInputRef.current).toBeNull();
  });

  it("atualiza linhas e nome do arquivo após parse", () => {
    const { result } = renderHook(() => usePareamentoCsvState());
    const linhas = [{ imei: "1", iccid: "2" }];
    act(() => {
      result.current.setCsvFileName("dados.csv");
      result.current.setCsvLinhas(linhas);
      result.current.setCsvParseErro("");
    });
    expect(result.current.csvFileName).toBe("dados.csv");
    expect(result.current.csvLinhas).toEqual(linhas);
  });

  it("edge: erro de parse e preview nulo", () => {
    const { result } = renderHook(() => usePareamentoCsvState());
    act(() => {
      result.current.setCsvParseErro("falhou");
      result.current.setCsvPreview(null);
    });
    expect(result.current.csvParseErro).toBe("falhou");
    expect(result.current.csvPreview).toBeNull();
  });
});
