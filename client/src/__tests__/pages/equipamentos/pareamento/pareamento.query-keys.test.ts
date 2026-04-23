import { describe, expect, it } from "vitest";
import { pareamentoQueryKeys } from "@/pages/equipamentos/pareamento/domain/query-keys";

describe("pareamentoQueryKeys", () => {
  it("chaves são tuplas readonly estáveis para invalidação", () => {
    expect(pareamentoQueryKeys.lotesRastreadores[0]).toBe("lotes-rastreadores");
    expect(pareamentoQueryKeys.lotesSims[0]).toBe("lotes-sims");
  });
});
