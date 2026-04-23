import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  PROPRIETARIO_CONFIG,
  TIPO_CONFIG,
} from "@/pages/aparelhos/lista/aparelhos-page.shared";

describe("aparelhos-page.shared", () => {
  it("PAGE_SIZE é positivo (paginação)", () => {
    expect(PAGE_SIZE).toBeGreaterThan(0);
  });

  it("TIPO_CONFIG cobre RASTREADOR e SIM", () => {
    expect(TIPO_CONFIG.RASTREADOR.label).toBe("Rastreador");
    expect(TIPO_CONFIG.SIM.label).toBe("SIM Card");
  });

  it("PROPRIETARIO_CONFIG cobre INFINITY e CLIENTE", () => {
    expect(PROPRIETARIO_CONFIG.INFINITY.label).toBe("Infinity");
    expect(PROPRIETARIO_CONFIG.CLIENTE.label).toBe("Cliente");
  });
});
