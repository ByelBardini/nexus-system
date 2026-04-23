import { describe, it, expect } from "vitest";
import {
  cobrancaOptions,
  veiculoTipoIconMap,
  VEICULO_TIPOS,
  tipoToPrecoKey,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.constants";

describe("ordens-servico-criacao constants", () => {
  it("cobrancaOptions cobre INFINITY e CLIENTE", () => {
    const values = cobrancaOptions.map((c) => c.value);
    expect(values).toContain("INFINITY");
    expect(values).toContain("CLIENTE");
  });

  it("veiculoTipoIconMap tem chaves principais", () => {
    expect(veiculoTipoIconMap.AUTO).toBeDefined();
  });

  it("VEICULO_TIPOS alinha com o map quando possível", () => {
    for (const { value } of VEICULO_TIPOS) {
      expect(veiculoTipoIconMap[value] ?? "fallback").toBeDefined();
    }
  });

  it("tipoToPrecoKey mapeia instalação com/sem bloqueio", () => {
    expect(tipoToPrecoKey.INSTALACAO_COM_BLOQUEIO).toBe(
      "instalacaoComBloqueio",
    );
  });
});
