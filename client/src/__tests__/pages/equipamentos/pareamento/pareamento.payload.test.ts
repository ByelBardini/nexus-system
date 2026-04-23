import { describe, expect, it } from "vitest";
import type { PreviewResult } from "@/pages/equipamentos/pareamento/preview/PreviewPareamentoTable";
import { buildPareamentoPostBody } from "@/pages/equipamentos/pareamento/domain/payload";

const baseInput = {
  paresIndividual: [{ imei: "1", iccid: "2" }],
  preview: null as PreviewResult | null,
  proprietario: "INFINITY" as const,
  clienteId: null as number | null,
  loteRastreadorId: "",
  loteSimId: "",
  criarNovoRastreador: false,
  criarNovoSim: false,
  pertenceLoteRastreador: false,
  pertenceLoteSim: false,
  marcaRastreador: "",
  modeloRastreador: "",
  marcaSimcardIdSim: "",
  planoSimcardIdSim: "",
  operadoraSim: "",
  criarNovoRastreadorMassa: false,
  criarNovoSimMassa: false,
  pertenceLoteRastreadorMassa: false,
  pertenceLoteSimMassa: false,
  marcaRastreadorMassa: "",
  modeloRastreadorMassa: "",
  marcaSimcardIdSimMassa: "",
  planoSimcardIdSimMassa: "",
  operadoraSimMassa: "",
};

describe("buildPareamentoPostBody — individual", () => {
  it("envia paresIndividual quando modo individual", () => {
    const body = buildPareamentoPostBody({ ...baseInput, modo: "individual" });
    expect(body.pares).toEqual([{ imei: "1", iccid: "2" }]);
    expect(body.clienteId).toBeUndefined();
  });

  it("inclui clienteId quando informado", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "individual",
      proprietario: "CLIENTE",
      clienteId: 99,
    });
    expect(body.clienteId).toBe(99);
  });

  it("inclui loteRastreadorId quando criar por lote (individual)", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "individual",
      criarNovoRastreador: true,
      pertenceLoteRastreador: true,
      loteRastreadorId: "7",
    });
    expect(body.loteRastreadorId).toBe(7);
  });

  it("inclui rastreadorManual quando marca+modelo sem lote", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "individual",
      criarNovoRastreador: true,
      pertenceLoteRastreador: false,
      marcaRastreador: "Sun",
      modeloRastreador: "ST",
    });
    expect(body.rastreadorManual).toEqual({ marca: "Sun", modelo: "ST" });
  });

  it("simManual com marcaSimcardId e plano opcional", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "individual",
      criarNovoSim: true,
      pertenceLoteSim: false,
      marcaSimcardIdSim: "3",
      planoSimcardIdSim: "9",
      operadoraSim: "",
    });
    expect(body.simManual).toEqual({
      marcaSimcardId: 3,
      planoSimcardId: 9,
    });
  });

  it("simManual só operadora quando sem marca id", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "individual",
      criarNovoSim: true,
      pertenceLoteSim: false,
      marcaSimcardIdSim: "",
      operadoraSim: "Claro",
    });
    expect(body.simManual).toEqual({ operadora: "Claro" });
  });
});

describe("buildPareamentoPostBody — massa", () => {
  const preview: PreviewResult = {
    linhas: [
      {
        imei: "a",
        iccid: "b",
        tracker_status: "NEEDS_CREATE",
        sim_status: "FOUND_AVAILABLE",
        action_needed: "OK",
      },
    ],
    contadores: { validos: 0, exigemLote: 1, erros: 0 },
  };

  it("usa linhas filtradas do preview, não paresIndividual", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "massa",
      paresIndividual: [{ imei: "x", iccid: "y" }],
      preview,
    });
    expect(body.pares).toEqual([{ imei: "a", iccid: "b" }]);
  });

  it("massa: lote sim quando flags massa", () => {
    const body = buildPareamentoPostBody({
      ...baseInput,
      modo: "massa",
      preview,
      criarNovoSimMassa: true,
      pertenceLoteSimMassa: true,
      loteSimId: "4",
    });
    expect(body.loteSimId).toBe(4);
  });
});
