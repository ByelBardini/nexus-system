import { describe, it, expect } from "vitest";
import { schemaCreate, schemaEdit } from "@/pages/usuarios/lib/schemas";

describe("schemaCreate", () => {
  it("aceita payload válido", () => {
    const r = schemaCreate.safeParse({
      nome: "A",
      email: "a@b.com",
      ativo: true,
      setor: "AGENDAMENTO",
      cargoIds: [1, 2],
    });
    expect(r.success).toBe(true);
  });

  it("falha sem nome ou email inválido", () => {
    expect(
      schemaCreate.safeParse({
        nome: "",
        email: "x",
        ativo: true,
        cargoIds: [],
      }).success,
    ).toBe(false);
  });
});

describe("schemaEdit", () => {
  it("não exige cargoIds", () => {
    const r = schemaEdit.safeParse({
      nome: "A",
      email: "a@b.com",
      ativo: false,
      setor: null,
    });
    expect(r.success).toBe(true);
  });
});
