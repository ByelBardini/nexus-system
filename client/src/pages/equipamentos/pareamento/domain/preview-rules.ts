import type { PreviewResult } from "../preview/PreviewPareamentoTable";
import type { MarcaSimcardPareamentoCatalog } from "./types";
import type { ModeloPareamentoCatalog } from "./types";
import type { ParImeiIccid } from "./types";

export function computeMinImeiRastreador(
  pertenceLote: boolean,
  modeloRastreador: string,
  modelosPorMarca: ModeloPareamentoCatalog[],
): number {
  if (pertenceLote) return 0;
  const modelo = modelosPorMarca.find((m) => m.nome === modeloRastreador);
  return modelo?.minCaracteresImei ?? 0;
}

export function computeMinIccidSim(
  pertenceLote: boolean,
  marcaSimcardId: string,
  marcasSimcard: MarcaSimcardPareamentoCatalog[],
): number {
  if (pertenceLote) return 0;
  const marca = marcasSimcard.find((m) => String(m.id) === marcaSimcardId);
  return marca?.minCaracteresIccid ?? 0;
}

export function computeParesIndividual(
  imeiIndividual: string,
  iccidIndividual: string,
  minImei: number,
  minIccid: number,
): ParImeiIccid[] {
  const imei = imeiIndividual.replace(/\D/g, "");
  const iccid = iccidIndividual.replace(/\D/g, "");
  if (imei.length < 1 || iccid.length < 1) return [];
  if (minImei > 0 && imei.length < minImei) return [];
  if (minIccid > 0 && iccid.length < minIccid) return [];
  return [{ imei: imeiIndividual.trim(), iccid: iccidIndividual.trim() }];
}

export function computePodeConfirmarIndividual(
  imeiIndividual: string,
  iccidIndividual: string,
  minImeiIndividual: number,
  minIccidIndividual: number,
): boolean {
  const imei = imeiIndividual.replace(/\D/g, "");
  const iccid = iccidIndividual.replace(/\D/g, "");
  if (imei.length < 1 || iccid.length < 1) return false;
  if (minImeiIndividual > 0 && imei.length < minImeiIndividual) return false;
  if (minIccidIndividual > 0 && iccid.length < minIccidIndividual) return false;
  return true;
}

export function loteIdValidoSelecionado(
  criarNovo: boolean,
  pertenceLote: boolean,
  loteId: string,
): boolean {
  return (
    criarNovo &&
    pertenceLote &&
    !!loteId &&
    loteId !== "_" &&
    !Number.isNaN(Number(loteId))
  );
}

export function computeProgressoVinculoIndividual(input: {
  imeiIndividual: string;
  iccidIndividual: string;
  minImeiIndividual: number;
  minIccidIndividual: number;
  criarNovoRastreador: boolean;
  criarNovoSim: boolean;
  pertenceLoteRastreador: boolean;
  pertenceLoteSim: boolean;
  loteRastreadorSelecionado: boolean;
  loteSimSelecionado: boolean;
  marcaRastreador: string;
  modeloRastreador: string;
  marcaSimcardIdSim: string;
  operadoraSim: string;
}): number {
  const imei = input.imeiIndividual.replace(/\D/g, "");
  const iccid = input.iccidIndividual.replace(/\D/g, "");
  const imeiOk =
    imei.length >= 1 &&
    (input.minImeiIndividual === 0 || imei.length >= input.minImeiIndividual);
  const iccidOk =
    iccid.length >= 1 &&
    (input.minIccidIndividual === 0 ||
      iccid.length >= input.minIccidIndividual);
  const rastreadorOk = input.criarNovoRastreador
    ? input.pertenceLoteRastreador
      ? input.loteRastreadorSelecionado
      : !!(input.marcaRastreador && input.modeloRastreador)
    : true;
  const simOk = input.criarNovoSim
    ? input.pertenceLoteSim
      ? input.loteSimSelecionado
      : !!(input.marcaSimcardIdSim || input.operadoraSim)
    : true;
  const itensCompletos =
    (imeiOk ? 1 : 0) +
    (iccidOk ? 1 : 0) +
    (rastreadorOk ? 1 : 0) +
    (simOk ? 1 : 0);
  return (itensCompletos / 4) * 100;
}

export function computePodeConfirmarPareamentoIndividual(
  podeConfirmarIndividual: boolean,
  preview: PreviewResult | null,
  input: {
    criarNovoRastreador: boolean;
    criarNovoSim: boolean;
    loteRastreadorId: string;
    loteSimId: string;
    pertenceLoteRastreador: boolean;
    pertenceLoteSim: boolean;
    marcaRastreador: string;
    modeloRastreador: string;
    marcaSimcardIdSim: string;
    operadoraSim: string;
  },
): boolean {
  if (!podeConfirmarIndividual || !preview) return false;
  if (preview.contadores.validos > 0) return true;
  if (preview.contadores.exigemLote > 0) {
    const needTracker = preview.linhas.some(
      (l) => l.tracker_status === "NEEDS_CREATE",
    );
    const needSim = preview.linhas.some((l) => l.sim_status === "NEEDS_CREATE");
    if (needTracker) {
      if (!input.criarNovoRastreador) return false;
      const temLote = input.pertenceLoteRastreador && input.loteRastreadorId;
      const temManual =
        !input.pertenceLoteRastreador &&
        input.marcaRastreador &&
        input.modeloRastreador;
      if (!temLote && !temManual) return false;
    }
    if (needSim) {
      if (!input.criarNovoSim) return false;
      const temLote = input.pertenceLoteSim && input.loteSimId;
      const temManual =
        !input.pertenceLoteSim &&
        (input.marcaSimcardIdSim || input.operadoraSim);
      if (!temLote && !temManual) return false;
    }
    return true;
  }
  return false;
}

export function computePodeConfirmarMassa(
  quantidadeBate: boolean,
  paresMassa: ParImeiIccid[],
  preview: PreviewResult | null,
  input: {
    criarNovoRastreadorMassa: boolean;
    criarNovoSimMassa: boolean;
    loteRastreadorId: string;
    loteSimId: string;
    pertenceLoteRastreadorMassa: boolean;
    pertenceLoteSimMassa: boolean;
    marcaRastreadorMassa: string;
    modeloRastreadorMassa: string;
    marcaSimcardIdSimMassa: string;
    operadoraSimMassa: string;
  },
): boolean {
  if (!quantidadeBate || paresMassa.length === 0) return false;
  if (!preview) return false;
  const validos = preview.contadores.validos;
  const exigemLote = preview.contadores.exigemLote;
  const temErros = preview.contadores.erros > 0;
  if (temErros && validos === 0 && exigemLote === 0) return false;
  if (exigemLote > 0) {
    const needTracker = preview.linhas.some(
      (l) => l.tracker_status === "NEEDS_CREATE",
    );
    const needSim = preview.linhas.some((l) => l.sim_status === "NEEDS_CREATE");
    if (needTracker) {
      if (!input.criarNovoRastreadorMassa) return false;
      const temLote =
        input.pertenceLoteRastreadorMassa && input.loteRastreadorId;
      const temManual =
        !input.pertenceLoteRastreadorMassa &&
        input.marcaRastreadorMassa &&
        input.modeloRastreadorMassa;
      if (!temLote && !temManual) return false;
    }
    if (needSim) {
      if (!input.criarNovoSimMassa) return false;
      const temLote = input.pertenceLoteSimMassa && input.loteSimId;
      const temManual =
        !input.pertenceLoteSimMassa &&
        (input.marcaSimcardIdSimMassa || input.operadoraSimMassa);
      if (!temLote && !temManual) return false;
    }
  }
  return validos > 0 || exigemLote > 0;
}

export function paresParaPareamentoMassaFromPreview(
  preview: PreviewResult | null,
): ParImeiIccid[] {
  return (
    preview?.linhas
      .filter(
        (l) =>
          l.action_needed === "OK" ||
          l.action_needed === "SELECT_TRACKER_LOT" ||
          l.action_needed === "SELECT_SIM_LOT",
      )
      .map((l) => ({ imei: l.imei, iccid: l.iccid })) ?? []
  );
}
