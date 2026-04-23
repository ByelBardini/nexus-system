import type { MutableRefObject } from "react";
import type { CsvLinhaInput } from "./types";
import type { ProprietarioTipo } from "./types";

/** Campos do formulário individual afetados por limpar / sucesso de pareamento. */
export type PareamentoIndividualFieldSetters = {
  setImeiIndividual: (v: string) => void;
  setIccidIndividual: (v: string) => void;
  setCriarNovoRastreador: (v: boolean) => void;
  setCriarNovoSim: (v: boolean) => void;
  setPertenceLoteRastreador: (v: boolean) => void;
  setPertenceLoteSim: (v: boolean) => void;
  setMarcaRastreador: (v: string) => void;
  setModeloRastreador: (v: string) => void;
  setOperadoraSim: (v: string) => void;
  setMarcaSimcardIdSim: (v: string) => void;
  setPlanoSimcardIdSim: (v: string) => void;
  setLoteRastreadorId: (v: string) => void;
  setLoteSimId: (v: string) => void;
  setProprietarioIndividual: (v: ProprietarioTipo) => void;
  setClienteIdIndividual: (v: number | null) => void;
};

export type PareamentoMassaFieldSetters = {
  setTextImeis: (v: string) => void;
  setTextIccids: (v: string) => void;
  setCriarNovoRastreadorMassa: (v: boolean) => void;
  setCriarNovoSimMassa: (v: boolean) => void;
  setLoteRastreadorId: (v: string) => void;
  setLoteSimId: (v: string) => void;
  setPertenceLoteRastreadorMassa: (v: boolean) => void;
  setPertenceLoteSimMassa: (v: boolean) => void;
  setMarcaRastreadorMassa: (v: string) => void;
  setModeloRastreadorMassa: (v: string) => void;
  setOperadoraSimMassa: (v: string) => void;
  setMarcaSimcardIdSimMassa: (v: string) => void;
  setPlanoSimcardIdSimMassa: (v: string) => void;
  setProprietarioMassa: (v: ProprietarioTipo) => void;
  setClienteIdMassa: (v: number | null) => void;
};

export type PareamentoCsvFieldSetters = {
  setCsvFileName: (v: string) => void;
  setCsvLinhas: (v: CsvLinhaInput[]) => void;
  setCsvParseErro: (v: string) => void;
  setCsvPreview: (v: null) => void;
  setProprietarioCsv: (v: ProprietarioTipo) => void;
  setClienteIdCsv: (v: number | null) => void;
};

/** Reset compartilhado após pareamento individual bem-sucedido (não limpa preview). */
export function resetIndividualFormAfterPareamentoSuccess(
  s: PareamentoIndividualFieldSetters,
): void {
  s.setImeiIndividual("");
  s.setIccidIndividual("");
  s.setCriarNovoRastreador(false);
  s.setCriarNovoSim(false);
  s.setPertenceLoteRastreador(false);
  s.setPertenceLoteSim(false);
  s.setMarcaRastreador("");
  s.setModeloRastreador("");
  s.setOperadoraSim("");
  s.setMarcaSimcardIdSim("");
  s.setPlanoSimcardIdSim("");
  s.setLoteRastreadorId("");
  s.setLoteSimId("");
  s.setProprietarioIndividual("INFINITY");
  s.setClienteIdIndividual(null);
}

/** Limpar formulário individual + preview + chave de auto-preview. */
export function limparIndividualFormComPreview(
  s: PareamentoIndividualFieldSetters & {
    setPreview: (v: null) => void;
    lastPreviewAttemptRef: MutableRefObject<string | null>;
  },
): void {
  resetIndividualFormAfterPareamentoSuccess(s);
  s.setPreview(null);
  s.lastPreviewAttemptRef.current = null;
}

/** Reset massa + preview (mesmo conjunto para limpar e após sucesso). */
export function resetMassaFormAndPreview(
  s: PareamentoMassaFieldSetters & { setPreview: (v: null) => void },
): void {
  s.setTextImeis("");
  s.setTextIccids("");
  s.setPreview(null);
  s.setCriarNovoRastreadorMassa(false);
  s.setCriarNovoSimMassa(false);
  s.setLoteRastreadorId("");
  s.setLoteSimId("");
  s.setPertenceLoteRastreadorMassa(true);
  s.setPertenceLoteSimMassa(true);
  s.setMarcaRastreadorMassa("");
  s.setModeloRastreadorMassa("");
  s.setOperadoraSimMassa("");
  s.setMarcaSimcardIdSimMassa("");
  s.setPlanoSimcardIdSimMassa("");
  s.setProprietarioMassa("INFINITY");
  s.setClienteIdMassa(null);
}

export function limparCsvForm(
  s: PareamentoCsvFieldSetters & {
    csvFileInputRef: MutableRefObject<HTMLInputElement | null>;
  },
): void {
  s.setCsvFileName("");
  s.setCsvLinhas([]);
  s.setCsvParseErro("");
  s.setCsvPreview(null);
  s.setProprietarioCsv("INFINITY");
  s.setClienteIdCsv(null);
  if (s.csvFileInputRef.current) s.csvFileInputRef.current.value = "";
}
