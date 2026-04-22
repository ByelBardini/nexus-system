import { describe, expect, it } from "vitest";
import {
  cadastroRastreamentoAcaoLabels,
  labelTipoServico,
  mapTipoOsParaRegistro,
} from "../../lib/cadastro-rastreamento-tipo-mappers";

/** Regressão: não voltar a concatenar "do!" ao rótulo do botão (ex.: "Iniciar Cadastrodo!"). */
function isToastIniciadoValid(s: string): boolean {
  if (!s.trim()) return false;
  if (/\bIniciar\s+\S+do!/i.test(s)) return false;
  return true;
}

describe("mapTipoOsParaRegistro", () => {
  it("mapeia os quatro TipoOS usados hoje no fluxo de cadastro", () => {
    expect(mapTipoOsParaRegistro("INSTALACAO_COM_BLOQUEIO")).toBe("CADASTRO");
    expect(mapTipoOsParaRegistro("INSTALACAO_SEM_BLOQUEIO")).toBe("CADASTRO");
    expect(mapTipoOsParaRegistro("REVISAO")).toBe("REVISAO");
    expect(mapTipoOsParaRegistro("RETIRADA")).toBe("RETIRADA");
  });

  it("tipo desconhecido (novo enum no Prisma) retorna OUTRO, não retirada", () => {
    expect(mapTipoOsParaRegistro("NOVO_TIPO_FUTURO")).toBe("OUTRO");
    expect(mapTipoOsParaRegistro("INSTALACAO_FOO")).toBe("OUTRO");
  });

  it("string vazia cai em OUTRO", () => {
    expect(mapTipoOsParaRegistro("")).toBe("OUTRO");
  });

  it("diferença de maiúsculas / typo não bate no mapa → OUTRO", () => {
    expect(mapTipoOsParaRegistro("revisao")).toBe("OUTRO");
    expect(mapTipoOsParaRegistro(" RETIRADA ")).toBe("OUTRO");
  });
});

describe("labelTipoServico", () => {
  it("rótulos amigáveis para tipos conhecidos", () => {
    expect(labelTipoServico("INSTALACAO_COM_BLOQUEIO")).toBe(
      "Instalação c/ bloqueio",
    );
    expect(labelTipoServico("INSTALACAO_SEM_BLOQUEIO")).toBe(
      "Instalação s/ bloqueio",
    );
    expect(labelTipoServico("REVISAO")).toBe("Troca de Equipamento");
    expect(labelTipoServico("RETIRADA")).toBe("Retirada de Equipamento");
  });

  it("default: substitui _ por espaço (tipo ainda não mapeado no switch)", () => {
    expect(labelTipoServico("TROCA_MODULO_GPS")).toBe("TROCA MODULO GPS");
  });

  it("default: string vazia vira rótulo genérico", () => {
    expect(labelTipoServico("")).toBe("Tipo de serviço");
  });
});

describe("cadastroRastreamentoAcaoLabels", () => {
  it("cada TipoRegistro tem os quatro rótulos preenchidos", () => {
    const keys: Array<keyof typeof cadastroRastreamentoAcaoLabels> = [
      "CADASTRO",
      "REVISAO",
      "RETIRADA",
      "OUTRO",
    ];
    for (const k of keys) {
      const a = cadastroRastreamentoAcaoLabels[k];
      expect(a.iniciar).toBeTruthy();
      expect(a.concluir).toBeTruthy();
      expect(a.concluido).toBeTruthy();
      expect(a.toastIniciado).toBeTruthy();
    }
  });

  it("toastIniciado regresão: não contém o antipadrão 'Iniciar …do!'", () => {
    for (const a of Object.values(cadastroRastreamentoAcaoLabels)) {
      expect(isToastIniciadoValid(a.toastIniciado)).toBe(true);
    }
  });
});
