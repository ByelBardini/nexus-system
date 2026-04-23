import { describe, expect, it } from "vitest";
import { SETORES_USUARIO } from "@/pages/usuarios/lib/constants";
import { SETORES_USUARIO as SETORES_USUARIO_TYPES } from "@/types/usuarios";

describe("pages/usuarios/lib/constants", () => {
  it("reexporta a mesma referência de array que @/types/usuarios (barrel correto)", () => {
    expect(SETORES_USUARIO).toBe(SETORES_USUARIO_TYPES);
  });

  it("cada setor tem value estável (UPPER_SNAKE) e label não vazio", () => {
    for (const item of SETORES_USUARIO) {
      expect(item.value).toMatch(/^[A-Z][A-Z_]*$/);
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("values são únicos (não duplicar opção no formulário)", () => {
    const values = SETORES_USUARIO.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("lista não vazia e alinhada ao domínio esperado do cadastro de usuário", () => {
    expect(SETORES_USUARIO.length).toBeGreaterThanOrEqual(3);
    expect(valuesOf(SETORES_USUARIO)).toEqual(
      expect.arrayContaining(["AGENDAMENTO", "CONFIGURACAO", "ADMINISTRATIVO"]),
    );
  });
});

function valuesOf<T extends { value: string }>(arr: readonly T[]): string[] {
  return arr.map((x) => x.value);
}
