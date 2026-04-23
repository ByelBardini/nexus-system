import { describe, expect, it } from "vitest";
import { equipamentosQueryKeys } from "@/lib/query-keys/equipamentos";

describe("equipamentosQueryKeys", () => {
  it("exporta tuplas readonly estáveis para listagens base", () => {
    expect(equipamentosQueryKeys.marcas).toEqual(["marcas"]);
    expect(equipamentosQueryKeys.modelos).toEqual(["modelos"]);
    expect(equipamentosQueryKeys.operadoras).toEqual(["operadoras"]);
    expect(equipamentosQueryKeys.marcasSimcard).toEqual(["marcas-simcard"]);
  });

  it("marcasSimcardScoped inclui id ou all para cache por operadora", () => {
    expect(equipamentosQueryKeys.marcasSimcardScoped("all")).toEqual([
      "marcas-simcard",
      "all",
    ]);
    expect(equipamentosQueryKeys.marcasSimcardScoped(7)).toEqual([
      "marcas-simcard",
      7,
    ]);
  });

  it("prefixo marcas-simcard alinha cadastro (scoped) e config (lista cheia)", () => {
    expect(equipamentosQueryKeys.marcasSimcard[0]).toBe(
      equipamentosQueryKeys.marcasSimcardScoped("all")[0],
    );
  });
});
