import { describe, expect, it } from "vitest";
import {
  CATEGORIAS_FALHA,
  DESTINOS_DEFEITO,
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

  it("CATEGORIAS e DESTINOS têm o mesmo tamanho que os enums de formulário (smoke)", () => {
    expect(CATEGORIAS_FALHA.length).toBe(5);
    expect(DESTINOS_DEFEITO.length).toBe(3);
  });
});
