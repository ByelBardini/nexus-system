import { describe, expect, it } from "vitest";
import { badgeServicoColunaCadastroRast } from "@/lib/cadastro-rastreamento-ui";
import type { OrdemCadastro } from "@/lib/cadastro-rastreamento.types";
import { ordemMinima } from "@/__tests__/pages/cadastro-rastreamento/cadastro-rastreamento.fixtures";

function ordem(over: Partial<OrdemCadastro>): OrdemCadastro {
  return { ...ordemMinima, ...over };
}

describe("badgeServicoColunaCadastroRast", () => {
  it("CADASTRO com bloqueio mostra rótulo longo c/ bloqueio", () => {
    const b = ordem({
      tipoRegistro: "CADASTRO",
      instalacaoComBloqueio: true,
    });
    const r = badgeServicoColunaCadastroRast(b);
    expect(r.label).toContain("BLOQUEIO");
    expect(r.label).toContain("C/");
  });

  it("CADASTRO sem bloqueio mostra s/ bloqueio", () => {
    const r = badgeServicoColunaCadastroRast(
      ordem({ tipoRegistro: "CADASTRO", instalacaoComBloqueio: false }),
    );
    expect(r.label).toContain("S/");
  });

  it("CADASTRO com instalacaoComBloqueio null cai no rótulo genérico Cadastro", () => {
    const r = badgeServicoColunaCadastroRast(
      ordem({ tipoRegistro: "CADASTRO", instalacaoComBloqueio: null }),
    );
    expect(r.label).toBe("Cadastro");
  });

  it("REVISAO usa config de Revisão", () => {
    const r = badgeServicoColunaCadastroRast(
      ordem({ tipoRegistro: "REVISAO" }),
    );
    expect(r.label).toBe("Revisão");
  });
});
