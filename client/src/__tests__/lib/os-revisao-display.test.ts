import { describe, expect, it } from "vitest";
import {
  getCadastroMapDeviceFields,
  getOsDadosTesteParaExibicao,
} from "../../lib/os-revisao-display";

describe("getOsDadosTesteParaExibicao", () => {
  it("em REVISÃO usa idEntrada, localInstalacaoEntrada e posChaveEntrada quando preenchidos", () => {
    const r = getOsDadosTesteParaExibicao({
      idAparelho: "IMEI_SAIDA",
      idEntrada: "IMEI_ENTRADA",
      localInstalacao: "Local emissão",
      localInstalacaoEntrada: "Local teste",
      posChave: "SIM",
      posChaveEntrada: "NAO",
    });
    expect(r).toEqual({
      imeiEntrada: "IMEI_ENTRADA",
      localInstalacao: "Local teste",
      posChave: "NAO",
    });
  });

  it("faz fallback para campos de emissão quando *Entrada ausentes (ex.: INSTALAÇÃO)", () => {
    const r = getOsDadosTesteParaExibicao({
      idAparelho: "SÓ_APARELHO",
      idEntrada: null,
      localInstalacao: "Painel",
      localInstalacaoEntrada: null,
      posChave: "SIM",
      posChaveEntrada: null,
    });
    expect(r).toEqual({
      imeiEntrada: "SÓ_APARELHO",
      localInstalacao: "Painel",
      posChave: "SIM",
    });
  });
});

describe("getCadastroMapDeviceFields", () => {
  const base = {
    idAparelho: "111",
    idEntrada: "222",
    iccidAparelho: "ICCID_A",
    iccidEntrada: "ICCID_E",
    localInstalacao: "L0",
    localInstalacaoEntrada: "L1",
    posChave: "SIM" as string | null,
    posChaveEntrada: "NAO" as string | null,
  };

  it("em REVISÃO: saída = idAparelho (original), entrada = idEntrada e campos *Entrada", () => {
    const r = getCadastroMapDeviceFields("REVISAO", base);
    expect(r.isRevisao).toBe(true);
    expect(r.imeiSaida).toBe("111");
    expect(r.imeiEntrada).toBe("222");
    expect(r.iccidSaidaOs).toBe("ICCID_A");
    expect(r.iccidEntradaOs).toBe("ICCID_E");
    expect(r.local).toBe("L1");
    expect(r.posChave).toBe("NAO");
  });

  it("em REVISÃO sem local/pos *Entrada usa emissão", () => {
    const r = getCadastroMapDeviceFields("REVISAO", {
      ...base,
      localInstalacaoEntrada: null,
      posChaveEntrada: null,
    });
    expect(r.local).toBe("L0");
    expect(r.posChave).toBe("SIM");
  });

  it("em INSTALAÇÃO: entrada = idAparelho, saída = idEntrada", () => {
    const r = getCadastroMapDeviceFields("INSTALACAO_COM_BLOQUEIO", base);
    expect(r.isRevisao).toBe(false);
    expect(r.imeiEntrada).toBe("111");
    expect(r.imeiSaida).toBe("222");
    expect(r.iccidEntradaOs).toBe("ICCID_A");
    expect(r.iccidSaidaOs).toBe("ICCID_E");
    expect(r.local).toBe("L0");
    expect(r.posChave).toBe("SIM");
  });

  it("INSTALACAO_SEM_BLOQUEIO mantém o mesmo mapa que COM_BLOQUEIO (cadastro-rastreamento)", () => {
    const com = getCadastroMapDeviceFields("INSTALACAO_COM_BLOQUEIO", base);
    const sem = getCadastroMapDeviceFields("INSTALACAO_SEM_BLOQUEIO", base);
    expect(sem).toEqual(com);
  });

  it("regressão: REVISAO troca entrada/saída em relação à INSTALAÇÃO (espelha findPendentes no backend)", () => {
    const rev = getCadastroMapDeviceFields("REVISAO", base);
    const inst = getCadastroMapDeviceFields("INSTALACAO_COM_BLOQUEIO", base);
    expect(rev.imeiEntrada).toBe(inst.imeiSaida);
    expect(rev.imeiSaida).toBe(inst.imeiEntrada);
    expect(rev.iccidEntradaOs).toBe(inst.iccidSaidaOs);
    expect(rev.iccidSaidaOs).toBe(inst.iccidEntradaOs);
  });

  it("em RETIRADA: não há entrada; saída = idAparelho (aparelho sai do veículo para estoque)", () => {
    const r = getCadastroMapDeviceFields("RETIRADA", base);
    expect(r.isRevisao).toBe(false);
    expect(r.imeiEntrada).toBeNull();
    expect(r.imeiSaida).toBe("111");
    expect(r.iccidEntradaOs).toBeNull();
    expect(r.iccidSaidaOs).toBe("ICCID_A");
    expect(r.local).toBe("L0");
    expect(r.posChave).toBe("SIM");
  });
});
