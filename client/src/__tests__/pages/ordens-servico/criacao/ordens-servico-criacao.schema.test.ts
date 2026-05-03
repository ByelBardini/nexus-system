import { afterEach, describe, expect, it, vi } from "vitest";
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

  describe("refine subclienteCpf — validação CPF/CNPJ", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    const base = { ...criacaoOsDefaultValues, tipo: "REVISAO" };

    it("aceita subclienteCpf vazio (campo opcional)", () => {
      const r = criacaoOsFormSchema.safeParse({ ...base, subclienteCpf: "" });
      expect(r.success).toBe(true);
    });

    it("aceita CPF com dígitos verificadores corretos", () => {
      const r = criacaoOsFormSchema.safeParse({
        ...base,
        subclienteCpf: "52998224725",
      });
      expect(r.success).toBe(true);
    });

    it("aceita CNPJ com dígitos verificadores corretos", () => {
      const r = criacaoOsFormSchema.safeParse({
        ...base,
        subclienteCpf: "11222333000181",
      });
      expect(r.success).toBe(true);
    });

    it("rejeita CPF com dígito verificador errado", () => {
      const r = criacaoOsFormSchema.safeParse({
        ...base,
        subclienteCpf: "12345678900",
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(
          r.error.issues.some((i) => i.message === "CPF ou CNPJ inválido"),
        ).toBe(true);
    });

    it("rejeita CNPJ com dígito verificador errado", () => {
      const r = criacaoOsFormSchema.safeParse({
        ...base,
        subclienteCpf: "11222333000182",
      });
      expect(r.success).toBe(false);
    });

    it("quando VITE_VALIDATE_CPF_CNPJ=false, aceita documento inválido", () => {
      vi.stubEnv("VITE_VALIDATE_CPF_CNPJ", "false");
      const r = criacaoOsFormSchema.safeParse({
        ...base,
        subclienteCpf: "12345678900",
      });
      expect(r.success).toBe(true);
    });
  });
});
