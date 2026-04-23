import { describe, expect, it } from "vitest";
import {
  STATUS_ORDER,
  STATUS_TO_API,
} from "@/pages/pedidos/shared/pedidos-rastreador-kanban";

describe("pedidos-rastreador-kanban (shared)", () => {
  it("STATUS_ORDER: five estágios fixos e únicos", () => {
    expect(new Set(STATUS_ORDER).size).toBe(5);
    expect(STATUS_ORDER[0]).toBe("solicitado");
  });

  it("STATUS_TO_API: round-trip coerente com a API (edge: cada chave mapeia)", () => {
    for (const s of STATUS_ORDER) {
      expect(STATUS_TO_API[s]).toBeTruthy();
    }
  });
});
