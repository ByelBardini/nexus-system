import { describe, expect, it } from "vitest";
import {
  buildTextoCopiarTodosCadastroRast,
  getAuxilioCopiaItens,
} from "@/lib/cadastro-rastreamento-copy";
import type { OrdemCadastro } from "@/types/cadastro-rastreamento";
import { ordemMinima } from "@/__tests__/pages/cadastro-rastreamento/cadastro-rastreamento.fixtures";

function o(over: Partial<OrdemCadastro>): OrdemCadastro {
  return { ...ordemMinima, ...over };
}

describe("getAuxilioCopiaItens", () => {
  it("inclui placa, nome (subcliente) e entradas quando há IMEI", () => {
    const itens = getAuxilioCopiaItens(
      o({ subcliente: "Sub", cliente: "Cli", imei: "1", iccid: "2" }),
    );
    const labels = itens.map((i) => i.label);
    expect(labels).toContain("Placa");
    expect(labels).toContain("Nome");
    expect(itens.find((i) => i.label === "Nome")?.value).toBe("Sub");
    expect(labels).toContain("IMEI (Entrada)");
  });

  it("sem IMEI de entrada não inclui ICCID/IMEI de entrada", () => {
    const itens = getAuxilioCopiaItens(o({ imei: null, iccid: "x" }));
    const labels = itens.map((i) => i.label);
    expect(labels).not.toContain("IMEI (Entrada)");
  });

  it("inclui saída quando imeiSaida preenchido", () => {
    const itens = getAuxilioCopiaItens(
      o({ imeiSaida: "OUT", iccidSaida: "9" }),
    );
    expect(itens.map((i) => i.label)).toContain("IMEI (Saída)");
  });
});

describe("buildTextoCopiarTodosCadastroRast", () => {
  it("monta bloco com placa, cliente e linhas condicionais", () => {
    const text = buildTextoCopiarTodosCadastroRast(
      o({
        placa: "AAA",
        cliente: "B",
        imei: "1",
        iccid: "2",
        imeiSaida: "3",
        iccidSaida: "4",
      }),
    );
    expect(text).toContain("Placa: AAA");
    expect(text).toContain("Cliente: B");
    expect(text).toContain("IMEI (Entrada): 1");
    expect(text).toContain("ICCID (Entrada): 2");
    expect(text).toContain("IMEI (Saída): 3");
  });
});
