import { describe, it, expect } from "vitest";
import {
  criacaoOsFormSchema,
  criacaoOsDefaultValues,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";

describe("ordens-servico-criacao schema", () => {
  it("aceita o pacote padrão completo com tipo e sem veículo", () => {
    const data = { ...criacaoOsDefaultValues, tipo: "REVISAO" };
    const r = criacaoOsFormSchema.safeParse(data);
    expect(r.success).toBe(true);
  });

  it("rejeita tipo vazio", () => {
    const r = criacaoOsFormSchema.safeParse({
      ...criacaoOsDefaultValues,
      tipo: "",
    });
    expect(r.success).toBe(false);
  });

  it("aceita e-mail vazio (literal)", () => {
    const r = criacaoOsFormSchema.safeParse({
      ...criacaoOsDefaultValues,
      tipo: "RETIRADA",
      subclienteEmail: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita e-mail inválido quando preenchido", () => {
    const r = criacaoOsFormSchema.safeParse({
      ...criacaoOsDefaultValues,
      tipo: "RETIRADA",
      subclienteEmail: "não-é-email",
    });
    expect(r.success).toBe(false);
  });

  it("refine: placa vazia não exige marca/modelo", () => {
    const r = criacaoOsFormSchema.safeParse({
      ...criacaoOsDefaultValues,
      tipo: "INSTALACAO_COM_BLOQUEIO",
      veiculoPlaca: "   ",
      veiculoMarca: "",
    });
    expect(r.success).toBe(true);
  });

  it("refine: com placa preenchida exige marca, modelo, ano e cor", () => {
    const r = criacaoOsFormSchema.safeParse({
      ...criacaoOsDefaultValues,
      tipo: "INSTALACAO_COM_BLOQUEIO",
      veiculoPlaca: "ABC1D23",
      veiculoMarca: "X",
      veiculoModelo: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("veiculoMarca"))).toBe(
        true,
      );
    }
  });

  it("refine: placa com dados completos passa", () => {
    const r = criacaoOsFormSchema.safeParse({
      ...criacaoOsDefaultValues,
      tipo: "INSTALACAO_COM_BLOQUEIO",
      veiculoPlaca: "ABC1D23",
      veiculoMarca: "Fiat",
      veiculoModelo: "Uno",
      veiculoAno: "2020",
      veiculoCor: "Prata",
    });
    expect(r.success).toBe(true);
  });
});
