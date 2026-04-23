import { describe, expect, it } from "vitest";
import { getColunaEquipamentoSaida } from "@/pages/cadastro-rastreamento/lib/table-helpers";
import type { OrdemCadastro } from "@/types/cadastro-rastreamento";
import { ordemMinima } from "./cadastro-rastreamento.fixtures";

function o(over: Partial<OrdemCadastro>): OrdemCadastro {
  return { ...ordemMinima, ...over };
}

describe("getColunaEquipamentoSaida", () => {
  it("CADASTRO sem IMEI de saída mostra mesma saída que entrada", () => {
    const r = getColunaEquipamentoSaida(
      o({
        tipoRegistro: "CADASTRO",
        imei: "E",
        modeloAparelhoEntrada: "ModEnt",
        imeiSaida: "   ",
        modeloSaida: "ModSai",
      }),
    );
    expect(r.imei).toBe("E");
    expect(r.modelo).toBe("ModEnt");
  });

  it("CADASTRO com IMEI de saída usa saída explícita", () => {
    const r = getColunaEquipamentoSaida(
      o({
        tipoRegistro: "CADASTRO",
        imei: "E",
        imeiSaida: "S",
        modeloAparelhoEntrada: "A",
        modeloSaida: "B",
      }),
    );
    expect(r.imei).toBe("S");
    expect(r.modelo).toBe("B");
  });

  it("REVISAO não replica entrada na coluna de saída", () => {
    const r = getColunaEquipamentoSaida(
      o({
        tipoRegistro: "REVISAO",
        imei: "E",
        imeiSaida: null,
        modeloSaida: null,
      }),
    );
    expect(r.imei).toBeNull();
  });
});
