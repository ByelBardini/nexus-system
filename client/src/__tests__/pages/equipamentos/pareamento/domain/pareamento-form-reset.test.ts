import { describe, expect, it, vi } from "vitest";
import {
  limparCsvForm,
  limparIndividualFormComPreview,
  resetIndividualFormAfterPareamentoSuccess,
  resetMassaFormAndPreview,
} from "@/pages/equipamentos/pareamento/domain/pareamento-form-reset";

describe("pareamento-form-reset", () => {
  it("resetIndividualFormAfterPareamentoSuccess: zera campos e não toca em preview/ref", () => {
    const setImeiIndividual = vi.fn();
    const setPreview = vi.fn();
    const ref = { current: "x" as string | null };
    resetIndividualFormAfterPareamentoSuccess({
      setImeiIndividual,
      setIccidIndividual: vi.fn(),
      setCriarNovoRastreador: vi.fn(),
      setCriarNovoSim: vi.fn(),
      setPertenceLoteRastreador: vi.fn(),
      setPertenceLoteSim: vi.fn(),
      setMarcaRastreador: vi.fn(),
      setModeloRastreador: vi.fn(),
      setOperadoraSim: vi.fn(),
      setMarcaSimcardIdSim: vi.fn(),
      setPlanoSimcardIdSim: vi.fn(),
      setLoteRastreadorId: vi.fn(),
      setLoteSimId: vi.fn(),
      setProprietarioIndividual: vi.fn(),
      setClienteIdIndividual: vi.fn(),
    });
    expect(setImeiIndividual).toHaveBeenCalledWith("");
    expect(setPreview).not.toHaveBeenCalled();
    expect(ref.current).toBe("x");
  });

  it("limparIndividualFormComPreview: também limpa preview e ref de tentativa", () => {
    const setPreview = vi.fn();
    const lastPreviewAttemptRef = { current: "k" as string | null };
    limparIndividualFormComPreview({
      setImeiIndividual: vi.fn(),
      setIccidIndividual: vi.fn(),
      setCriarNovoRastreador: vi.fn(),
      setCriarNovoSim: vi.fn(),
      setPertenceLoteRastreador: vi.fn(),
      setPertenceLoteSim: vi.fn(),
      setMarcaRastreador: vi.fn(),
      setModeloRastreador: vi.fn(),
      setOperadoraSim: vi.fn(),
      setMarcaSimcardIdSim: vi.fn(),
      setPlanoSimcardIdSim: vi.fn(),
      setLoteRastreadorId: vi.fn(),
      setLoteSimId: vi.fn(),
      setProprietarioIndividual: vi.fn(),
      setClienteIdIndividual: vi.fn(),
      setPreview,
      lastPreviewAttemptRef,
    });
    expect(setPreview).toHaveBeenCalledWith(null);
    expect(lastPreviewAttemptRef.current).toBeNull();
  });

  it("resetMassaFormAndPreview: limpa listas, flags e preview", () => {
    const setPreview = vi.fn();
    const setMarcaSimcardIdSimMassa = vi.fn();
    resetMassaFormAndPreview({
      setTextImeis: vi.fn(),
      setTextIccids: vi.fn(),
      setCriarNovoRastreadorMassa: vi.fn(),
      setCriarNovoSimMassa: vi.fn(),
      setLoteRastreadorId: vi.fn(),
      setLoteSimId: vi.fn(),
      setPertenceLoteRastreadorMassa: vi.fn(),
      setPertenceLoteSimMassa: vi.fn(),
      setMarcaRastreadorMassa: vi.fn(),
      setModeloRastreadorMassa: vi.fn(),
      setOperadoraSimMassa: vi.fn(),
      setMarcaSimcardIdSimMassa,
      setPlanoSimcardIdSimMassa: vi.fn(),
      setProprietarioMassa: vi.fn(),
      setClienteIdMassa: vi.fn(),
      setPreview,
    });
    expect(setPreview).toHaveBeenCalledWith(null);
    expect(setMarcaSimcardIdSimMassa).toHaveBeenCalledWith("");
  });

  it("limparCsvForm: edge — zera input file quando ref aponta para elemento", () => {
    const input = document.createElement("input");
    input.value = "fake";
    const csvFileInputRef = { current: input };
    const setCsvLinhas = vi.fn();
    limparCsvForm({
      setCsvFileName: vi.fn(),
      setCsvLinhas,
      setCsvParseErro: vi.fn(),
      setCsvPreview: vi.fn(),
      setProprietarioCsv: vi.fn(),
      setClienteIdCsv: vi.fn(),
      csvFileInputRef,
    });
    expect(input.value).toBe("");
    expect(setCsvLinhas).toHaveBeenCalledWith([]);
  });

  it("limparCsvForm: edge — ref null não quebra", () => {
    limparCsvForm({
      setCsvFileName: vi.fn(),
      setCsvLinhas: vi.fn(),
      setCsvParseErro: vi.fn(),
      setCsvPreview: vi.fn(),
      setProprietarioCsv: vi.fn(),
      setClienteIdCsv: vi.fn(),
      csvFileInputRef: { current: null },
    });
  });
});
