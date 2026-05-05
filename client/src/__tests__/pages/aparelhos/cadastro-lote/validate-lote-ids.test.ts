import { describe, expect, it } from "vitest";
import { validateLoteIds } from "@/pages/aparelhos/cadastro-lote/validate-lote-ids";

const imei15 = "123456789012345";
const iccid19 = "1234567890123456789";

describe("validateLoteIds", () => {
  it("retorna vazio para texto vazio", () => {
    const v = validateLoteIds("   \n  ", "RASTREADOR", []);
    expect(v).toEqual({
      validos: [],
      duplicados: [],
      invalidos: [],
      jaExistentes: [],
    });
  });

  it("aceita IMEI 15 dígitos (rastreador)", () => {
    const v = validateLoteIds(imei15, "RASTREADOR", []);
    expect(v.validos).toEqual([imei15]);
    expect(v.invalidos).toHaveLength(0);
  });

  it("rejeita IMEI com comprimento diferente da quantidade configurada", () => {
    const v = validateLoteIds("123", "RASTREADOR", [], 15);
    expect(v.validos).toHaveLength(0);
    expect(v.invalidos).toContain("123");
  });

  it("aceita qualquer comprimento quando quantidadeCaracteres não configurado", () => {
    const v = validateLoteIds("123", "RASTREADOR", []);
    expect(v.validos).toContain("123");
    expect(v.invalidos).toHaveLength(0);
  });

  it("aceita ICCID 19 dígitos (SIM)", () => {
    const v = validateLoteIds(iccid19, "SIM", []);
    expect(v.validos).toEqual([iccid19]);
  });

  it("detecta duplicados (mantém string original exibida)", () => {
    const v = validateLoteIds(`${imei15}\n${imei15}`, "RASTREADOR", []);
    expect(v.validos).toHaveLength(1);
    expect(v.duplicados).toHaveLength(1);
  });

  it("detecta ja cadastrados (compara só dígitos)", () => {
    const v = validateLoteIds("123-456-789-012-345", "RASTREADOR", [imei15]);
    expect(v.jaExistentes.length).toBeGreaterThan(0);
    expect(v.validos).toHaveLength(0);
  });

  it("separa múltiplas linhas e vírgulas", () => {
    const a = "111111111111111";
    const b = "222222222222222";
    const v = validateLoteIds(`${a}, ${b};\n${a}`, "RASTREADOR", []);
    expect(v.validos).toContain(a);
    expect(v.validos).toContain(b);
    expect(v.duplicados).toContain(a);
  });

  it("normaliza para só dígitos nos válidos", () => {
    const v = validateLoteIds("abc123456789012345xyz", "RASTREADOR", []);
    expect(v.validos).toEqual([imei15]);
  });
});
