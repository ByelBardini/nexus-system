import { describe, it, expect } from "vitest";
import {
  calcularPermissoesHerdadas,
  getModuloLabel,
  getAcaoLabel,
} from "@/pages/usuarios/lib/permissoes-heranca";
import type { CargoWithPermissions } from "@/types/usuarios";

function cargo(
  id: number,
  permCodes: string[],
  setorNome = "Administrativo",
): CargoWithPermissions {
  return {
    id,
    code: `C${id}`,
    nome: `Cargo ${id}`,
    categoria: "OPERACIONAL",
    setor: { id: 1, code: "ADM", nome: setorNome },
    cargoPermissoes: permCodes.map((code, i) => ({
      permissao: { id: 100 + i, code },
    })),
  };
}

describe("getModuloLabel", () => {
  it("retorna rótulo conhecido para path completo", () => {
    expect(getModuloLabel("ADMINISTRATIVO.USUARIO")).toBe("Usuários");
    expect(getModuloLabel("AGENDAMENTO.TESTES")).toBe("Testes de Aparelhos");
  });

  it("fallback por chave de item (legado) quando path não mapeado", () => {
    expect(getModuloLabel("X.CLIENTE")).toBe("Clientes");
  });

  it("retorna o próprio módulo se sem segundo segmento mapeado", () => {
    expect(getModuloLabel("SOMESTRING")).toBe("SOMESTRING");
  });
});

describe("getAcaoLabel", () => {
  it("mapeia ações padrão", () => {
    expect(getAcaoLabel("LISTAR")).toBe("Visualizar");
    expect(getAcaoLabel("EXCLUIR")).toBe("Excluir");
  });

  it("retorna código desconhecido como está", () => {
    expect(getAcaoLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("calcularPermissoesHerdadas", () => {
  it("retorna vazio sem cargos selecionados", () => {
    const r = calcularPermissoesHerdadas(
      [],
      [cargo(1, ["ADMINISTRATIVO.USUARIO.CRIAR"])],
    );
    expect(r.setoresHabilitados).toEqual([]);
    expect(r.acoesAltoRisco).toEqual([]);
  });

  it("ignora permissões com código com menos de 3 segmentos", () => {
    const r = calcularPermissoesHerdadas(
      [1],
      [cargo(1, ["A.B", "TOOSHORT.CODE"])],
    );
    expect(r.setoresHabilitados).toEqual([]);
  });

  it("agrega ações por módulo e deduplica EXCLUIR no alto risco", () => {
    const c1 = cargo(1, [
      "AGENDAMENTO.OS.LISTAR",
      "AGENDAMENTO.OS.CRIAR",
      "AGENDAMENTO.OS.EXCLUIR",
    ]);
    const c2 = cargo(2, ["AGENDAMENTO.OS.EXCLUIR", "AGENDAMENTO.OS.EDITAR"]);
    const r = calcularPermissoesHerdadas([1, 2], [c1, c2]);
    const os = r.setoresHabilitados.find((s) => s.modulo === "AGENDAMENTO.OS");
    expect(os?.acoes.sort()).toEqual(
      ["CRIAR", "EDITAR", "EXCLUIR", "LISTAR"].sort(),
    );
    expect(r.acoesAltoRisco).toHaveLength(1);
    expect(r.acoesAltoRisco[0].modulo).toBe("AGENDAMENTO.OS");
  });

  it("múltiplas permissões EXCLUIR de módulos distintos geram várias entradas", () => {
    const c = cargo(1, ["X.A.EXCLUIR", "Y.B.EXCLUIR"]);
    const r = calcularPermissoesHerdadas([1], [c]);
    expect(r.acoesAltoRisco).toHaveLength(2);
  });
});
