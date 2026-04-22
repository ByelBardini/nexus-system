import { describe, expect, it } from "vitest";
import { totalOrdensFromResumo } from "@/pages/ordens-servico/shared/ordens-servico.constants";

describe("totalOrdensFromResumo", () => {
  it("soma todos os campos", () => {
    expect(
      totalOrdensFromResumo({
        agendado: 1,
        emTestes: 2,
        testesRealizados: 3,
        aguardandoCadastro: 4,
        finalizado: 5,
      }),
    ).toBe(15);
  });

  it("edge: undefined retorna 0", () => {
    expect(totalOrdensFromResumo(undefined)).toBe(0);
  });
});
