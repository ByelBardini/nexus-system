import { describe, expect, it } from "vitest";
import type { PreviewResult } from "@/pages/equipamentos/pareamento/preview/PreviewPareamentoTable";
import {
  computeMinIccidSim,
  computeMinImeiRastreador,
  computeParesIndividual,
  computePodeConfirmarIndividual,
  computePodeConfirmarMassa,
  computePodeConfirmarPareamentoIndividual,
  computeProgressoVinculoIndividual,
  loteIdValidoSelecionado,
  paresParaPareamentoMassaFromPreview,
} from "@/pages/equipamentos/pareamento/domain/preview-rules";

const modeloList = [
  { id: 1, nome: "ST-901", marca: { id: 1 }, minCaracteresImei: 14 },
];

const marcasSim = [
  {
    id: 5,
    nome: "MarcaX",
    operadoraId: 1,
    temPlanos: false,
    minCaracteresIccid: 19,
    operadora: { id: 1, nome: "Op" },
  },
];

function previewBase(over: Partial<PreviewResult> = {}): PreviewResult {
  return {
    linhas: [],
    contadores: { validos: 0, exigemLote: 0, erros: 0 },
    ...over,
  };
}

describe("pareamento.preview-logic — computeMinImeiRastreador", () => {
  it("0 quando pertence a lote", () => {
    expect(computeMinImeiRastreador(true, "ST-901", modeloList)).toBe(0);
  });

  it("usa minCaracteresImei do modelo quando manual", () => {
    expect(computeMinImeiRastreador(false, "ST-901", modeloList)).toBe(14);
  });

  it("0 quando modelo não encontrado", () => {
    expect(computeMinImeiRastreador(false, "?", modeloList)).toBe(0);
  });
});

describe("pareamento.preview-logic — computeMinIccidSim", () => {
  it("0 quando pertence a lote", () => {
    expect(computeMinIccidSim(true, "5", marcasSim)).toBe(0);
  });

  it("usa min da marca simcard", () => {
    expect(computeMinIccidSim(false, "5", marcasSim)).toBe(19);
  });
});

describe("pareamento.preview-logic — computeParesIndividual", () => {
  it("vazio quando faltam dígitos", () => {
    expect(computeParesIndividual("", "1", 0, 0)).toEqual([]);
  });

  it("respeita mínimos de imei/iccid", () => {
    expect(computeParesIndividual("123", "456", 5, 0)).toEqual([]);
    expect(computeParesIndividual("12345", "456", 5, 0)).toHaveLength(1);
  });

  it("preserva trim nos valores enviados (não só dígitos)", () => {
    const p = computeParesIndividual(" 3589 ", " 8955 ", 0, 0);
    expect(p[0]).toEqual({ imei: "3589", iccid: "8955" });
  });
});

describe("pareamento.preview-logic — loteIdValidoSelecionado", () => {
  it("false para placeholder _", () => {
    expect(loteIdValidoSelecionado(true, true, "_")).toBe(false);
  });

  it("true para id numérico", () => {
    expect(loteIdValidoSelecionado(true, true, "12")).toBe(true);
  });
});

describe("pareamento.preview-logic — computeProgressoVinculoIndividual", () => {
  it("100% quando tudo preenchido sem criar novo", () => {
    const pct = computeProgressoVinculoIndividual({
      imeiIndividual: "358942109982341",
      iccidIndividual: "8955101234567890123",
      minImeiIndividual: 0,
      minIccidIndividual: 0,
      criarNovoRastreador: false,
      criarNovoSim: false,
      pertenceLoteRastreador: false,
      pertenceLoteSim: false,
      loteRastreadorSelecionado: false,
      loteSimSelecionado: false,
      marcaRastreador: "",
      modeloRastreador: "",
      marcaSimcardIdSim: "",
      operadoraSim: "",
    });
    expect(pct).toBe(100);
  });
});

describe("pareamento.preview-logic — computePodeConfirmarPareamentoIndividual", () => {
  const prevOk = previewBase({ contadores: { validos: 1, exigemLote: 0, erros: 0 } });

  it("false sem preview", () => {
    expect(
      computePodeConfirmarPareamentoIndividual(true, null, {
        criarNovoRastreador: false,
        criarNovoSim: false,
        loteRastreadorId: "",
        loteSimId: "",
        pertenceLoteRastreador: false,
        pertenceLoteSim: false,
        marcaRastreador: "",
        modeloRastreador: "",
        marcaSimcardIdSim: "",
        operadoraSim: "",
      }),
    ).toBe(false);
  });

  it("true quando há válidos", () => {
    expect(
      computePodeConfirmarPareamentoIndividual(true, prevOk, {
        criarNovoRastreador: false,
        criarNovoSim: false,
        loteRastreadorId: "",
        loteSimId: "",
        pertenceLoteRastreador: false,
        pertenceLoteSim: false,
        marcaRastreador: "",
        modeloRastreador: "",
        marcaSimcardIdSim: "",
        operadoraSim: "",
      }),
    ).toBe(true);
  });
});

describe("pareamento.preview-logic — computePodeConfirmarMassa", () => {
  const pares = [{ imei: "1", iccid: "2" }];
  const previewValido = previewBase({
    contadores: { validos: 1, exigemLote: 0, erros: 0 },
  });

  it("false sem preview", () => {
    expect(
      computePodeConfirmarMassa(true, pares, null, {
        criarNovoRastreadorMassa: false,
        criarNovoSimMassa: false,
        loteRastreadorId: "",
        loteSimId: "",
        pertenceLoteRastreadorMassa: true,
        pertenceLoteSimMassa: true,
        marcaRastreadorMassa: "",
        modeloRastreadorMassa: "",
        marcaSimcardIdSimMassa: "",
        operadoraSimMassa: "",
      }),
    ).toBe(false);
  });

  it("permite confirmar quando há válidos no preview", () => {
    expect(
      computePodeConfirmarMassa(true, pares, previewValido, {
        criarNovoRastreadorMassa: false,
        criarNovoSimMassa: false,
        loteRastreadorId: "",
        loteSimId: "",
        pertenceLoteRastreadorMassa: true,
        pertenceLoteSimMassa: true,
        marcaRastreadorMassa: "",
        modeloRastreadorMassa: "",
        marcaSimcardIdSimMassa: "",
        operadoraSimMassa: "",
      }),
    ).toBe(true);
  });

  it("false quando só erros e nada válido/exigem lote", () => {
    const bad = previewBase({
      contadores: { validos: 0, exigemLote: 0, erros: 2 },
    });
    expect(
      computePodeConfirmarMassa(true, pares, bad, {
        criarNovoRastreadorMassa: false,
        criarNovoSimMassa: false,
        loteRastreadorId: "",
        loteSimId: "",
        pertenceLoteRastreadorMassa: true,
        pertenceLoteSimMassa: true,
        marcaRastreadorMassa: "",
        modeloRastreadorMassa: "",
        marcaSimcardIdSimMassa: "",
        operadoraSimMassa: "",
      }),
    ).toBe(false);
  });
});

describe("pareamento.preview-logic — paresParaPareamentoMassaFromPreview", () => {
  it("filtra action_needed permitidas", () => {
    const pr: PreviewResult = {
      linhas: [
        {
          imei: "a",
          iccid: "b",
          tracker_status: "FOUND_AVAILABLE",
          sim_status: "FOUND_AVAILABLE",
          action_needed: "OK",
        },
        {
          imei: "c",
          iccid: "d",
          tracker_status: "INVALID_FORMAT",
          sim_status: "INVALID_FORMAT",
          action_needed: "FIX_ERROR",
        },
      ],
      contadores: { validos: 0, exigemLote: 0, erros: 0 },
    };
    expect(paresParaPareamentoMassaFromPreview(pr)).toEqual([
      { imei: "a", iccid: "b" },
    ]);
  });
});

describe("pareamento.preview-logic — computePodeConfirmarIndividual", () => {
  it("false quando iccid curto demais vs mínimo", () => {
    expect(
      computePodeConfirmarIndividual("358942109982341", "8955", 0, 18),
    ).toBe(false);
  });
});
