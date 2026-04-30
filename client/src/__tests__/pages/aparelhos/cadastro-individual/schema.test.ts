import { describe, expect, it } from "vitest";
import {
  cadastroIndividualSchema,
  cadastroIndividualDefaultValues,
} from "@/pages/aparelhos/cadastro-individual/schema";

describe("cadastroIndividualSchema", () => {
  it("aceita rastreador com marca, modelo, identificador e Infinity", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "123",
      tipo: "RASTREADOR",
      marca: "M",
      modelo: "X",
    });
    expect(r.success).toBe(true);
  });

  it("falha sem marca/modelo em RASTREADOR", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "RASTREADOR",
      marca: "",
      modelo: "",
    });
    expect(r.success).toBe(false);
  });

  it("falha SIM sem operadora", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "SIM",
      operadora: "",
    });
    expect(r.success).toBe(false);
  });

  it("falha proprietario CLIENTE sem clienteId", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "RASTREADOR",
      marca: "A",
      modelo: "B",
      proprietario: "CLIENTE",
      clienteId: null,
    });
    expect(r.success).toBe(false);
  });

  it("aceita SIM com operadora", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "SIM",
      operadora: "Vivo",
    });
    expect(r.success).toBe(true);
  });

  it("falha CANCELADO_DEFEITO + categoriaFalhaMotiva true sem motivoDefeito", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "RASTREADOR",
      marca: "A",
      modelo: "B",
      status: "CANCELADO_DEFEITO",
      categoriaFalha: "Outro",
      categoriaFalhaMotiva: true,
      motivoDefeito: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("motivoDefeito");
    }
  });

  it("aceita CANCELADO_DEFEITO + categoriaFalhaMotiva true com motivoDefeito preenchido", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "RASTREADOR",
      marca: "A",
      modelo: "B",
      status: "CANCELADO_DEFEITO",
      categoriaFalha: "Outro",
      categoriaFalhaMotiva: true,
      motivoDefeito: "Componente queimado",
    });
    expect(r.success).toBe(true);
  });

  it("aceita CANCELADO_DEFEITO + categoriaFalhaMotiva false sem motivoDefeito", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "1",
      tipo: "RASTREADOR",
      marca: "A",
      modelo: "B",
      status: "CANCELADO_DEFEITO",
      categoriaFalha: "Dano Físico / Carcaça",
      categoriaFalhaMotiva: false,
      motivoDefeito: "",
    });
    expect(r.success).toBe(true);
  });

  it("aceita string vazia no identificador após preprocess como falha (refine mínimo 1 caractere)", () => {
    const r = cadastroIndividualSchema.safeParse({
      ...cadastroIndividualDefaultValues,
      identificador: "",
    });
    expect(r.success).toBe(false);
  });
});
