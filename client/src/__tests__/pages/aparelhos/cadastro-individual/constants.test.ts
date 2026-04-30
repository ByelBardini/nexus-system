import { describe, expect, it } from "vitest";
import {
  DESTINOS_SWITCH,
  ORIGENS,
  STATUS_CONFIG,
} from "@/pages/aparelhos/cadastro-individual/constants";

describe("cadastro-individual constants", () => {
  it("ORIGENS cobre as três origens esperadas", () => {
    const vals = new Set(ORIGENS.map((o) => o.value));
    expect(vals.has("COMPRA_AVULSA")).toBe(true);
    expect(vals.has("RETIRADA_CLIENTE")).toBe(true);
    expect(vals.has("DEVOLUCAO_TECNICO")).toBe(true);
  });

  it("STATUS_CONFIG possui rótulo para todos os estados de StatusAparelho", () => {
    expect(STATUS_CONFIG.NOVO_OK.label).toBeTruthy();
    expect(STATUS_CONFIG.EM_MANUTENCAO.label).toBeTruthy();
    expect(STATUS_CONFIG.CANCELADO_DEFEITO.label).toBeTruthy();
  });

  it("DESTINOS_SWITCH cobre os dois destinos de defeito", () => {
    const vals = new Set(DESTINOS_SWITCH.map((d) => d.value));
    expect(vals.has("DESCARTADO")).toBe(true);
    expect(vals.has("EM_ESTOQUE_DEFEITO")).toBe(true);
  });
});
