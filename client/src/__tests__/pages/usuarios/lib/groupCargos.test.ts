import { describe, it, expect } from "vitest";
import { groupCargosBySetorNome } from "@/pages/usuarios/lib/groupCargos";
import type { CargoWithPermissions } from "@/types/usuarios";

const c = (id: number, setor: string): CargoWithPermissions => ({
  id,
  code: `c${id}`,
  nome: `N${id}`,
  categoria: "O",
  setor: { id, code: "x", nome: setor },
  cargoPermissoes: [],
});

describe("groupCargosBySetorNome", () => {
  it("agrupa por nome do setor", () => {
    const g = groupCargosBySetorNome([c(1, "A"), c(2, "A"), c(3, "B")]);
    expect(g.A).toHaveLength(2);
    expect(g.B).toHaveLength(1);
  });

  it("array vazio", () => {
    expect(groupCargosBySetorNome([])).toEqual({});
  });
});
