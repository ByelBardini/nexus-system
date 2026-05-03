import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isCpfCnpjValidationEnabled,
  validarCNPJ,
  validarCPF,
  validarCPFouCNPJ,
} from "@/lib/cpf-cnpj-validation";

// CPF 529.982.247-25 — cálculo mod-11 verificado
const CPF_VALIDO = "52998224725";
// CPF 111.444.777-35 — segundo valor para confirmar não-hardcoding
const CPF_VALIDO_2 = "11144477735";
// CNPJ 11.222.333/0001-81 — cálculo mod-11 verificado
const CNPJ_VALIDO = "11222333000181";
// CNPJ 54.550.752/0001-55 — segundo valor
const CNPJ_VALIDO_2 = "54550752000155";

describe("validarCPF", () => {
  it("aceita CPF com dígitos verificadores corretos", () => {
    expect(validarCPF(CPF_VALIDO)).toBe(true);
    expect(validarCPF(CPF_VALIDO_2)).toBe(true);
  });

  it("aceita CPF formatado com pontos e traço", () => {
    expect(validarCPF("529.982.247-25")).toBe(true);
  });

  it("rejeita sequência de dígitos repetidos", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validarCPF(String(d).repeat(11))).toBe(false);
    }
  });

  it("rejeita quando o primeiro dígito verificador é errado", () => {
    // Troca o 10º dígito de CPF_VALIDO por outro
    const errado = CPF_VALIDO.slice(0, 9) + "9" + CPF_VALIDO[10];
    expect(validarCPF(errado)).toBe(false);
  });

  it("rejeita quando o segundo dígito verificador é errado", () => {
    const errado = CPF_VALIDO.slice(0, 10) + "9";
    expect(validarCPF(errado)).toBe(false);
  });

  it("rejeita string com menos de 11 dígitos", () => {
    expect(validarCPF("1234567890")).toBe(false);
  });

  it("rejeita string com mais de 11 dígitos", () => {
    expect(validarCPF(CPF_VALIDO + "0")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(validarCPF("")).toBe(false);
  });
});

describe("validarCNPJ", () => {
  it("aceita CNPJ com dígitos verificadores corretos", () => {
    expect(validarCNPJ(CNPJ_VALIDO)).toBe(true);
    expect(validarCNPJ(CNPJ_VALIDO_2)).toBe(true);
  });

  it("aceita CNPJ formatado com pontos, barra e traço", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita sequência de dígitos repetidos", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validarCNPJ(String(d).repeat(14))).toBe(false);
    }
  });

  it("rejeita quando o primeiro dígito verificador é errado", () => {
    const errado = CNPJ_VALIDO.slice(0, 12) + "9" + CNPJ_VALIDO[13];
    expect(validarCNPJ(errado)).toBe(false);
  });

  it("rejeita quando o segundo dígito verificador é errado", () => {
    const errado = CNPJ_VALIDO.slice(0, 13) + "9";
    expect(validarCNPJ(errado)).toBe(false);
  });

  it("rejeita string com menos de 14 dígitos", () => {
    expect(validarCNPJ("1122233300018")).toBe(false);
  });

  it("rejeita string com mais de 14 dígitos", () => {
    expect(validarCNPJ(CNPJ_VALIDO + "0")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(validarCNPJ("")).toBe(false);
  });
});

describe("validarCPFouCNPJ", () => {
  it("valida CPF quando há 11 dígitos", () => {
    expect(validarCPFouCNPJ(CPF_VALIDO)).toBe(true);
  });

  it("valida CNPJ quando há 14 dígitos", () => {
    expect(validarCPFouCNPJ(CNPJ_VALIDO)).toBe(true);
  });

  it("rejeita CPF inválido com 11 dígitos", () => {
    expect(validarCPFouCNPJ("12345678900")).toBe(false);
  });

  it("rejeita CNPJ inválido com 14 dígitos", () => {
    expect(validarCPFouCNPJ("11222333000182")).toBe(false);
  });

  it("rejeita string com comprimento diferente de 11 ou 14", () => {
    expect(validarCPFouCNPJ("1234567890")).toBe(false);
    expect(validarCPFouCNPJ("1234567890123")).toBe(false);
    expect(validarCPFouCNPJ("")).toBe(false);
  });

  it("ignora formatação na contagem de dígitos", () => {
    expect(validarCPFouCNPJ("529.982.247-25")).toBe(true);
    expect(validarCPFouCNPJ("11.222.333/0001-81")).toBe(true);
  });
});

describe("isCpfCnpjValidationEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('retorna true quando VITE_VALIDATE_CPF_CNPJ é "true"', () => {
    vi.stubEnv("VITE_VALIDATE_CPF_CNPJ", "true");
    expect(isCpfCnpjValidationEnabled()).toBe(true);
  });

  it('retorna false somente quando VITE_VALIDATE_CPF_CNPJ é "false"', () => {
    vi.stubEnv("VITE_VALIDATE_CPF_CNPJ", "false");
    expect(isCpfCnpjValidationEnabled()).toBe(false);
  });

  it("retorna true para qualquer outro valor (ex.: '0', '1', 'off')", () => {
    for (const val of ["0", "1", "off", "disabled", "FALSE", ""]) {
      vi.stubEnv("VITE_VALIDATE_CPF_CNPJ", val);
      expect(isCpfCnpjValidationEnabled()).toBe(true);
    }
  });

  it("retorna true quando a variável não está definida", () => {
    vi.stubEnv("VITE_VALIDATE_CPF_CNPJ", undefined as unknown as string);
    expect(isCpfCnpjValidationEnabled()).toBe(true);
  });
});
