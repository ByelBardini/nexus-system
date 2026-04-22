import { describe, expect, it } from "vitest";
import {
  DEBITOS_EQUIPAMENTOS_LISTA_URL,
  DEBITOS_EQUIPAMENTOS_QUERY_KEY,
  ENTIDADE_DEBITO_CONFIG,
  STATUS_DEBITO_CONFIG,
} from "@/pages/debitos-equipamentos/domain/debito-equipamento.constants";
import type { StatusDebito, TipoEntidade } from "@/pages/debitos-equipamentos/domain/types";

describe("debito-equipamento.constants", () => {
  it("STATUS_DEBITO_CONFIG cobre todos os StatusDebito", () => {
    const keys: StatusDebito[] = ["aberto", "parcial", "quitado"];
    for (const k of keys) {
      expect(STATUS_DEBITO_CONFIG[k].label.length).toBeGreaterThan(0);
      expect(STATUS_DEBITO_CONFIG[k].className).toContain("border");
    }
  });

  it("ENTIDADE_DEBITO_CONFIG cobre TipoEntidade", () => {
    const keys: TipoEntidade[] = ["cliente", "infinity"];
    for (const k of keys) {
      expect(ENTIDADE_DEBITO_CONFIG[k].className.length).toBeGreaterThan(0);
    }
  });

  it("query key e URL de listagem estáveis", () => {
    expect(DEBITOS_EQUIPAMENTOS_QUERY_KEY).toEqual(["debitos-rastreadores"]);
    expect(DEBITOS_EQUIPAMENTOS_LISTA_URL).toContain("incluirHistoricos=true");
    expect(DEBITOS_EQUIPAMENTOS_LISTA_URL).toContain("limit=500");
  });
});
