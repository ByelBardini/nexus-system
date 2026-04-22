import { describe, expect, it } from "vitest";
import {
  equipamentoMatchesStageFilter,
  type EquipamentoListItem,
} from "@/pages/equipamentos/equipamentos-page.shared";

function item(
  overrides: Partial<EquipamentoListItem> &
    Pick<EquipamentoListItem, "id" | "status">,
): EquipamentoListItem {
  return {
    tipo: "RASTREADOR",
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "",
    ...overrides,
  };
}

describe("equipamentoMatchesStageFilter", () => {
  it('TODOS aceita qualquer registro', () => {
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 1, status: "CONFIGURADO", kitId: null }),
        "TODOS",
      ),
    ).toBe(true);
  });

  it("CONFIGURADO exige status CONFIGURADO sem kit", () => {
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 1, status: "CONFIGURADO", kitId: null }),
        "CONFIGURADO",
      ),
    ).toBe(true);
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 2, status: "CONFIGURADO", kitId: 9 }),
        "CONFIGURADO",
      ),
    ).toBe(false);
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 3, status: "DESPACHADO", kitId: null }),
        "CONFIGURADO",
      ),
    ).toBe(false);
  });

  it("EM_KIT exige CONFIGURADO com kitId", () => {
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 1, status: "CONFIGURADO", kitId: 1 }),
        "EM_KIT",
      ),
    ).toBe(true);
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 2, status: "CONFIGURADO", kitId: null }),
        "EM_KIT",
      ),
    ).toBe(false);
  });

  it("DESPACHADO, COM_TECNICO e INSTALADO batem status exato", () => {
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 1, status: "DESPACHADO" }),
        "DESPACHADO",
      ),
    ).toBe(true);
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 2, status: "COM_TECNICO" }),
        "COM_TECNICO",
      ),
    ).toBe(true);
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 3, status: "INSTALADO" }),
        "INSTALADO",
      ),
    ).toBe(true);
  });

  it("filtro desconhecido retorna false", () => {
    expect(
      equipamentoMatchesStageFilter(
        item({ id: 1, status: "CONFIGURADO" }),
        "INVALIDO",
      ),
    ).toBe(false);
  });
});
