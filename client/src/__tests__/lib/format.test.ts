import { describe, expect, it } from "vitest";
import {
  centavosParaReais,
  formatarCEP,
  formatarCNPJ,
  formatarCPF,
  formatarCPFCNPJ,
  formatarDataCompleta,
  formatarDataHora,
  formatarDuracao,
  formatarFromNow,
  formatarMoeda,
  formatarMoedaDeCentavos,
  formatarPlaca,
  formatarTempoMinutos,
  formatarTelefone,
  formatId,
  parseDataLocal,
  placaApenasAlfanumericos,
  reaisParaCentavos,
} from "@/lib/format";

describe("formatarMoeda", () => {
  it("formata zero", () => expect(formatarMoeda(0)).toBe("R$\u00a00,00"));
  it("formata valor simples", () =>
    expect(formatarMoeda(1)).toBe("R$\u00a01,00"));
  it("formata decimais", () => expect(formatarMoeda(1.5)).toBe("R$\u00a01,50"));
  it("formata valor negativo", () => expect(formatarMoeda(-10)).toMatch(/-/));
  it("formata valor grande", () =>
    expect(formatarMoeda(1234.56)).toBe("R$\u00a01.234,56"));
});

describe("formatarMoedaDeCentavos", () => {
  it("0 centavos → R$ 0,00", () =>
    expect(formatarMoedaDeCentavos(0)).toBe("R$\u00a00,00"));
  it("100 centavos → R$ 1,00", () =>
    expect(formatarMoedaDeCentavos(100)).toBe("R$\u00a01,00"));
  it("1050 centavos → R$ 10,50", () =>
    expect(formatarMoedaDeCentavos(1050)).toBe("R$\u00a010,50"));
});

describe("reaisParaCentavos", () => {
  it('string "1,50" → 150', () => expect(reaisParaCentavos("1,50")).toBe(150));
  it('string "1.50" → 150', () => expect(reaisParaCentavos("1.50")).toBe(150));
  it("número 1.5 → 150", () => expect(reaisParaCentavos(1.5)).toBe(150));
  it("string vazia → 0", () => expect(reaisParaCentavos("")).toBe(0));
  it('string "0" → 0', () => expect(reaisParaCentavos("0")).toBe(0));
  it("número 0 → 0", () => expect(reaisParaCentavos(0)).toBe(0));
});

describe("centavosParaReais", () => {
  it('0 → "0,00"', () => expect(centavosParaReais(0)).toBe("0,00"));
  it('100 → "1,00"', () => expect(centavosParaReais(100)).toBe("1,00"));
  it('1050 → "10,50"', () => expect(centavosParaReais(1050)).toBe("10,50"));
});

describe("formatarTelefone", () => {
  it('vazio → ""', () => expect(formatarTelefone("")).toBe(""));
  it("1 dígito → com parêntese", () =>
    expect(formatarTelefone("1")).toBe("(1"));
  it("2 dígitos → parênteses", () =>
    expect(formatarTelefone("11")).toBe("(11"));
  it("fixo (10 dígitos)", () =>
    expect(formatarTelefone("1133334444")).toBe("(11) 3333-4444"));
  it("celular (11 dígitos)", () =>
    expect(formatarTelefone("11999998888")).toBe("(11) 99999-8888"));
  it("ignora não-dígitos", () =>
    expect(formatarTelefone("(11) 99999-8888")).toBe("(11) 99999-8888"));
});

describe("formatarCEP", () => {
  it("menos de 5 dígitos → só dígitos", () =>
    expect(formatarCEP("1234")).toBe("1234"));
  it("8 dígitos → formatado", () =>
    expect(formatarCEP("01310100")).toBe("01310-100"));
  it("com hífen já formatado → idempotente", () =>
    expect(formatarCEP("01310-100")).toBe("01310-100"));
});

describe("formatarPlaca", () => {
  it("menos de 3 chars → sem hífen", () =>
    expect(formatarPlaca("AB")).toBe("AB"));
  it("placa antiga 7 chars", () =>
    expect(formatarPlaca("ABC1234")).toBe("ABC-1234"));
  it("placa mercosul", () => expect(formatarPlaca("ABC1D23")).toBe("ABC-1D23"));
  it("remove caracteres especiais e aplica uppercase", () =>
    expect(formatarPlaca("abc-1234")).toBe("ABC-1234"));
  it("trunca em 7 chars", () =>
    expect(formatarPlaca("ABC12345")).toBe("ABC-1234"));
});

describe("placaApenasAlfanumericos", () => {
  it("remove hífen", () =>
    expect(placaApenasAlfanumericos("ABC-1234")).toBe("ABC1234"));
  it("converte para uppercase", () =>
    expect(placaApenasAlfanumericos("abc1234")).toBe("ABC1234"));
  it("remove espaços", () =>
    expect(placaApenasAlfanumericos("ABC 1234")).toBe("ABC1234"));
});

describe("formatarCNPJ", () => {
  it("2 dígitos", () => expect(formatarCNPJ("12")).toBe("12"));
  it("5 dígitos", () => expect(formatarCNPJ("12345")).toBe("12.345"));
  it("8 dígitos", () => expect(formatarCNPJ("12345678")).toBe("12.345.678"));
  it("12 dígitos", () =>
    expect(formatarCNPJ("123456780001")).toBe("12.345.678/0001"));
  it("14 dígitos completo", () =>
    expect(formatarCNPJ("12345678000195")).toBe("12.345.678/0001-95"));
});

describe("formatarCPF", () => {
  it("3 dígitos", () => expect(formatarCPF("123")).toBe("123"));
  it("6 dígitos", () => expect(formatarCPF("123456")).toBe("123.456"));
  it("9 dígitos", () => expect(formatarCPF("123456789")).toBe("123.456.789"));
  it("11 dígitos completo", () =>
    expect(formatarCPF("12345678901")).toBe("123.456.789-01"));
});

describe("formatarCPFCNPJ", () => {
  it("11 dígitos → formata como CPF", () =>
    expect(formatarCPFCNPJ("12345678901")).toBe("123.456.789-01"));
  it("14 dígitos → formata como CNPJ", () =>
    expect(formatarCPFCNPJ("12345678000195")).toBe("12.345.678/0001-95"));
});

describe("parseDataLocal", () => {
  it("string vazia → epoch", () =>
    expect(parseDataLocal("")).toEqual(new Date(0)));
  it("YYYY-MM-DD → sem deslocamento de fuso", () => {
    const d = parseDataLocal("2024-04-18");
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(3); // abril = 3
    expect(d.getDate()).toBe(18);
  });
  it("ISO completo com T → parse nativo", () => {
    const d = parseDataLocal("2024-04-18T12:00:00.000Z");
    expect(d instanceof Date).toBe(true);
  });
});

describe("formatarDataCompleta", () => {
  it("retorna string não vazia para data válida", () => {
    const result = formatarDataCompleta("2024-04-18");
    expect(result).toMatch(/2024/);
    expect(result.length).toBeGreaterThan(5);
  });
});

describe("formatarDataHora", () => {
  it('string vazia → "-"', () => expect(formatarDataHora("")).toBe("-"));
  it("data válida → string com ano", () =>
    expect(formatarDataHora("2024-04-18T10:00:00")).toMatch(/2024/));
});

describe("formatarFromNow", () => {
  it('menos de 1 minuto → "agora"', () => {
    const agora = new Date().toISOString();
    expect(formatarFromNow(agora)).toBe("agora");
  });
  it('1 hora atrás → "1h atrás"', () => {
    const d = new Date(Date.now() - 3_600_000).toISOString();
    expect(formatarFromNow(d)).toBe("1h atrás");
  });
  it('2 dias atrás → "2 dias atrás"', () => {
    const d = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(formatarFromNow(d)).toBe("2 dias atrás");
  });
  it('30 minutos atrás → "30 min atrás"', () => {
    const d = new Date(Date.now() - 30 * 60_000).toISOString();
    expect(formatarFromNow(d)).toBe("30 min atrás");
  });
});

describe("formatarDuracao", () => {
  it('mesma data → "menos de 1h"', () => {
    expect(formatarDuracao("2024-01-01", "2024-01-01")).toBe("menos de 1h");
  });
  it('só horas → "2h"', () => {
    expect(formatarDuracao("2024-01-01T08:00:00", "2024-01-01T10:00:00")).toBe(
      "2h",
    );
  });
  it('1 dia → "1 dia"', () => {
    expect(formatarDuracao("2024-01-01", "2024-01-02")).toBe("1 dia");
  });
  it('2 dias → "2 dias"', () => {
    expect(formatarDuracao("2024-01-01", "2024-01-03")).toBe("2 dias");
  });
  it('dias e horas → "1 dia e 2h"', () => {
    expect(formatarDuracao("2024-01-01T08:00:00", "2024-01-02T10:00:00")).toBe(
      "1 dia e 2h",
    );
  });
});

describe("formatarTempoMinutos", () => {
  it('42 minutos → "42 min"', () =>
    expect(formatarTempoMinutos(42)).toBe("42 min"));
  it('60 minutos → "1h"', () => expect(formatarTempoMinutos(60)).toBe("1h"));
  it('90 minutos → "1h 30min"', () =>
    expect(formatarTempoMinutos(90)).toBe("1h 30min"));
  it('0 minutos → "0 min"', () =>
    expect(formatarTempoMinutos(0)).toBe("0 min"));
});

describe("formatId", () => {
  it("id 1 → 9 dígitos com zeros", () => expect(formatId(1)).toBe("000000001"));
  it("id 123456789 → sem zeros", () =>
    expect(formatId(123456789)).toBe("123456789"));
  it('id 42 → "000000042"', () => expect(formatId(42)).toBe("000000042"));
});
