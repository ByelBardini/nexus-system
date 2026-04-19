import { describe, expect, it } from "vitest";
import {
  STATUS_CONFIG_APARELHO,
  type StatusAparelho,
} from "@/lib/aparelho-status";

const STATUS_ESPERADOS: StatusAparelho[] = [
  "EM_ESTOQUE",
  "CONFIGURADO",
  "DESPACHADO",
  "COM_TECNICO",
  "INSTALADO",
];

describe("STATUS_CONFIG_APARELHO", () => {
  it("contém todos os 5 status", () => {
    expect(Object.keys(STATUS_CONFIG_APARELHO)).toHaveLength(5);
  });

  STATUS_ESPERADOS.forEach((status) => {
    describe(status, () => {
      it("tem label", () =>
        expect(STATUS_CONFIG_APARELHO[status].label).toBeTruthy());
      it("tem color", () =>
        expect(STATUS_CONFIG_APARELHO[status].color).toBeTruthy());
      it("tem bgColor", () =>
        expect(STATUS_CONFIG_APARELHO[status].bgColor).toBeTruthy());
      it("tem borderColor", () =>
        expect(STATUS_CONFIG_APARELHO[status].borderColor).toBeTruthy());
      it("tem icon", () =>
        expect(STATUS_CONFIG_APARELHO[status].icon).toBeTruthy());
      it("tem dotColor", () =>
        expect(STATUS_CONFIG_APARELHO[status].dotColor).toBeTruthy());
    });
  });

  it('INSTALADO tem label "Instalado"', () => {
    expect(STATUS_CONFIG_APARELHO.INSTALADO.label).toBe("Instalado");
  });

  it('EM_ESTOQUE tem label "Em Estoque"', () => {
    expect(STATUS_CONFIG_APARELHO.EM_ESTOQUE.label).toBe("Em Estoque");
  });
});
