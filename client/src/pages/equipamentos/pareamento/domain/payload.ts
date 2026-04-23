import type { PreviewResult } from "../preview/PreviewPareamentoTable";
import type { ProprietarioTipo } from "./types";
import type { ParImeiIccid } from "./types";
import { paresParaPareamentoMassaFromPreview } from "./preview-rules";

export type PareamentoPostBody = {
  pares: ParImeiIccid[];
  loteRastreadorId?: number;
  loteSimId?: number;
  rastreadorManual?: { marca: string; modelo: string };
  simManual?:
    | { marcaSimcardId: number; planoSimcardId?: number }
    | { operadora: string };
  proprietario: ProprietarioTipo;
  clienteId?: number;
};

export function buildPareamentoPostBody(input: {
  modo: "individual" | "massa";
  paresIndividual: ParImeiIccid[];
  preview: PreviewResult | null;
  proprietario: ProprietarioTipo;
  clienteId: number | null;
  loteRastreadorId: string;
  loteSimId: string;
  criarNovoRastreador: boolean;
  criarNovoSim: boolean;
  pertenceLoteRastreador: boolean;
  pertenceLoteSim: boolean;
  marcaRastreador: string;
  modeloRastreador: string;
  marcaSimcardIdSim: string;
  planoSimcardIdSim: string;
  operadoraSim: string;
  criarNovoRastreadorMassa: boolean;
  criarNovoSimMassa: boolean;
  pertenceLoteRastreadorMassa: boolean;
  pertenceLoteSimMassa: boolean;
  marcaRastreadorMassa: string;
  modeloRastreadorMassa: string;
  marcaSimcardIdSimMassa: string;
  planoSimcardIdSimMassa: string;
  operadoraSimMassa: string;
}): PareamentoPostBody {
  const paresParaEnviar =
    input.modo === "individual"
      ? input.paresIndividual
      : paresParaPareamentoMassaFromPreview(input.preview);

  const loteRastreadorId =
    input.modo === "individual" &&
    input.criarNovoRastreador &&
    input.pertenceLoteRastreador &&
    input.loteRastreadorId
      ? +input.loteRastreadorId
      : input.modo === "massa" &&
          input.criarNovoRastreadorMassa &&
          input.pertenceLoteRastreadorMassa &&
          input.loteRastreadorId
        ? +input.loteRastreadorId
        : undefined;

  const loteSimId =
    input.modo === "individual" &&
    input.criarNovoSim &&
    input.pertenceLoteSim &&
    input.loteSimId
      ? +input.loteSimId
      : input.modo === "massa" &&
          input.criarNovoSimMassa &&
          input.pertenceLoteSimMassa &&
          input.loteSimId
        ? +input.loteSimId
        : undefined;

  const rastreadorManual =
    input.modo === "individual" &&
    input.criarNovoRastreador &&
    !input.pertenceLoteRastreador &&
    input.marcaRastreador &&
    input.modeloRastreador
      ? { marca: input.marcaRastreador, modelo: input.modeloRastreador }
      : input.modo === "massa" &&
          input.criarNovoRastreadorMassa &&
          !input.pertenceLoteRastreadorMassa &&
          input.marcaRastreadorMassa &&
          input.modeloRastreadorMassa
        ? {
            marca: input.marcaRastreadorMassa,
            modelo: input.modeloRastreadorMassa,
          }
        : undefined;

  const simManual =
    input.modo === "individual" &&
    input.criarNovoSim &&
    !input.pertenceLoteSim &&
    (input.marcaSimcardIdSim || input.operadoraSim)
      ? input.marcaSimcardIdSim
        ? {
            marcaSimcardId: +input.marcaSimcardIdSim,
            planoSimcardId: input.planoSimcardIdSim
              ? +input.planoSimcardIdSim
              : undefined,
          }
        : { operadora: input.operadoraSim }
      : input.modo === "massa" &&
          input.criarNovoSimMassa &&
          !input.pertenceLoteSimMassa &&
          (input.marcaSimcardIdSimMassa || input.operadoraSimMassa)
        ? input.marcaSimcardIdSimMassa
          ? {
              marcaSimcardId: +input.marcaSimcardIdSimMassa,
              planoSimcardId: input.planoSimcardIdSimMassa
                ? +input.planoSimcardIdSimMassa
                : undefined,
            }
          : { operadora: input.operadoraSimMassa }
        : undefined;

  return {
    pares: paresParaEnviar,
    loteRastreadorId,
    loteSimId,
    rastreadorManual,
    simManual,
    proprietario: input.proprietario,
    clienteId: input.clienteId ?? undefined,
  };
}
