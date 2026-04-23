import { describe, expect, it } from "vitest";
import {
  loteFormSchema,
  loteFormDefaultValues,
} from "@/pages/aparelhos/cadastro-lote/schema";

const baseOk = {
  ...loteFormDefaultValues,
  referencia: "REF-1",
  dataChegada: "2026-01-10",
  valorUnitario: 100,
  quantidade: 0,
  definirIds: true,
  idsTexto: "123456789012345",
  tipo: "RASTREADOR" as const,
  marca: "1",
  modelo: "2",
  operadora: "",
  abaterDivida: false,
  abaterDebitoId: null,
  abaterQuantidade: null,
  proprietarioTipo: "INFINITY" as const,
  clienteId: null,
};

describe("loteFormSchema", () => {
  it("aceita lote mínimo com IDs definidos (rastreador)", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
    });
    expect(r.success).toBe(true);
  });

  it("falha sem referência", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      referencia: "",
    });
    expect(r.success).toBe(false);
  });

  it("exige cliente quando proprietário é CLIENTE", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      proprietarioTipo: "CLIENTE",
      clienteId: null,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.clienteId).toBeDefined();
    }
  });

  it("exige abaterDebito e quantidade quando abaterDivida é true", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      abaterDivida: true,
      abaterDebitoId: null,
      abaterQuantidade: null,
    });
    expect(r.success).toBe(false);
  });

  it("exige operadora no tipo SIM", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      tipo: "SIM",
      operadora: "",
      marca: "",
      modelo: "",
    });
    expect(r.success).toBe(false);
  });

  it("não exige marca/modelo no tipo SIM", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      tipo: "SIM",
      operadora: "1",
      marca: "",
      modelo: "",
    });
    expect(r.success).toBe(true);
  });

  it("exige quantidade quando não define IDs (edge: quantidade 0)", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      definirIds: false,
      quantidade: 0,
    });
    expect(r.success).toBe(false);
  });

  it("aceita quantidade > 0 sem IDs definidos", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      definirIds: false,
      quantidade: 3,
    });
    expect(r.success).toBe(true);
  });

  it("falha com valor unitário 0 (centavos)", () => {
    const r = loteFormSchema.safeParse({
      ...baseOk,
      valorUnitario: 0,
    });
    expect(r.success).toBe(false);
  });
});
