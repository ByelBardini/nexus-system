import { describe, expect, it } from "vitest";
import {
  agruparPermissoes,
  NOMES_ACAO,
  ORDEM_ACOES,
  rotulosPermissoesAtivas,
} from "@/pages/cargos/permissionMatrix";
import type { Permission } from "@/types/cargo";

function perm(id: number, code: string): Permission {
  return { id, code };
}

describe("agruparPermissoes", () => {
  it("retorna objeto vazio para lista vazia", () => {
    expect(agruparPermissoes([])).toEqual({});
  });

  it("ignora códigos sem três segmentos", () => {
    const r = agruparPermissoes([
      perm(1, "ADMINISTRATIVO.CARGO"),
      perm(2, "SOMENTEUM"),
      perm(3, ""),
    ]);
    expect(r["ADMINISTRATIVO"]?.["CARGO"]).toBeUndefined();
    expect(Object.keys(r).length).toBe(0);
  });

  it("ignora segmentos vazios (pontos duplicados)", () => {
    const r = agruparPermissoes([perm(1, "ADMINISTRATIVO..CRIAR")]);
    expect(Object.keys(r).length).toBe(0);
  });

  it("agrupa e ordena ações pela ORDEM_ACOES", () => {
    const r = agruparPermissoes([
      perm(10, "ADMINISTRATIVO.CARGO.EXCLUIR"),
      perm(11, "ADMINISTRATIVO.CARGO.LISTAR"),
      perm(12, "ADMINISTRATIVO.CARGO.CRIAR"),
    ]);
    const acoes = r.ADMINISTRATIVO.CARGO.map((x) => x.acao);
    expect(acoes).toEqual(["LISTAR", "CRIAR", "EXCLUIR"]);
  });

  it("ações desconhecidas (indexOf -1) ordenam antes de LISTAR na comparação", () => {
    const r = agruparPermissoes([
      perm(1, "ADMINISTRATIVO.CARGO.LISTAR"),
      perm(2, "ADMINISTRATIVO.CARGO.FOO"),
    ]);
    const acoes = r.ADMINISTRATIVO.CARGO.map((x) => x.acao);
    expect(acoes).toContain("LISTAR");
    expect(acoes).toContain("FOO");
    expect(acoes[0]).toBe("FOO");
  });
});

describe("rotulosPermissoesAtivas", () => {
  it("retorna lista vazia sem seleção", () => {
    const p = [perm(1, "ADMINISTRATIVO.CARGO.LISTAR")];
    expect(rotulosPermissoesAtivas(p, [])).toEqual([]);
  });

  it("usa NOMES_ACAO e NOMES_ITEM para rótulo legível", () => {
    const p = [perm(5, "ADMINISTRATIVO.CARGO.CRIAR")];
    expect(rotulosPermissoesAtivas(p, [5])).toEqual([
      `${NOMES_ACAO.CRIAR} Cargos`,
    ]);
  });

  it("código malformado ainda produz rótulo (fallback de segmentos)", () => {
    const p = [perm(9, "X.Y.Z")];
    expect(rotulosPermissoesAtivas(p, [9])).toEqual(["Z Y"]);
  });
});

describe("ORDEM_ACOES", () => {
  it("inclui as cinco ações esperadas", () => {
    expect(ORDEM_ACOES).toEqual([
      "LISTAR",
      "CRIAR",
      "EDITAR",
      "EXCLUIR",
      "EXECUTAR",
    ]);
  });
});
