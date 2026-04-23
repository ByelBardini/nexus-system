import { describe, expect, it } from "vitest";
import { URGENCIA_STYLE } from "@/pages/pedidos/shared/pedidos-rastreador-kanban";
import {
  getUrgenciaBadgeClass,
  getUrgenciaValueTextClass,
} from "@/pages/pedidos/shared/pedidos-urgencia-ui";

describe("pedidos-urgencia-ui", () => {
  describe("getUrgenciaBadgeClass", () => {
    it("retorna badge de Média para urgência ausente", () => {
      expect(getUrgenciaBadgeClass(undefined)).toBe(
        URGENCIA_STYLE["Média"]!.badge,
      );
    });

    it("mapeia Baixa, Média, Alta e Urgente", () => {
      expect(getUrgenciaBadgeClass("Baixa")).toBe(URGENCIA_STYLE.Baixa.badge);
      expect(getUrgenciaBadgeClass("Média")).toBe(URGENCIA_STYLE["Média"]!.badge);
      expect(getUrgenciaBadgeClass("Alta")).toBe(URGENCIA_STYLE.Alta.badge);
      expect(getUrgenciaBadgeClass("Urgente")).toBe(
        URGENCIA_STYLE.Urgente.badge,
      );
    });

    it("desconhecido cai no fallback Média", () => {
      expect(getUrgenciaBadgeClass("NãoExiste")).toBe(
        URGENCIA_STYLE["Média"]!.badge,
      );
    });
  });

  describe("getUrgenciaValueTextClass", () => {
    it("retorna valueText de Média quando ausente", () => {
      expect(getUrgenciaValueTextClass(undefined)).toBe(
        URGENCIA_STYLE["Média"]!.valueText,
      );
    });

    it("Urgente usa texto vermelho e Alta âmbar", () => {
      expect(getUrgenciaValueTextClass("Urgente")).toBe(
        URGENCIA_STYLE.Urgente.valueText,
      );
      expect(getUrgenciaValueTextClass("Alta")).toBe(
        URGENCIA_STYLE.Alta.valueText,
      );
    });

    it("desconhecido cai no fallback Média", () => {
      expect(getUrgenciaValueTextClass("???")).toBe(
        URGENCIA_STYLE["Média"]!.valueText,
      );
    });
  });
});
