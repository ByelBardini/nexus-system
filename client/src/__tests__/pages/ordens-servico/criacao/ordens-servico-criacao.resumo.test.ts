import { describe, it, expect } from "vitest";
import {
  precoTecnicoCardDisplay,
  computeDeslocamentoSidebar,
  computeValorTotalAproximado,
  formatBrl,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.resumo";
import type { Tecnico } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.types";

describe("precoTecnicoCardDisplay", () => {
  it("mostra em dash sem valor", () => {
    expect(precoTecnicoCardDisplay(undefined).texto).toBe("—");
  });
  it("aceita string numérica", () => {
    const { texto, temValor } = precoTecnicoCardDisplay("10.5");
    expect(temValor).toBe(true);
    expect(texto).toMatch(/10/);
  });
  it("ignora zero", () => {
    expect(precoTecnicoCardDisplay(0).texto).toBe("—");
  });
});

describe("computeDeslocamentoSidebar", () => {
  it("sem preço de km: total null", () => {
    const r = computeDeslocamentoSidebar({
      kmEstimado: 10,
      precoDeslocamentoRaw: 0,
    });
    expect(r.totalDeslocamento).toBeNull();
  });

  it("com preço e km, calcula total", () => {
    const r = computeDeslocamentoSidebar({
      kmEstimado: 2,
      precoDeslocamentoRaw: 3.5,
    });
    expect(r.temPrecoKm).toBe(true);
    expect(r.totalDeslocamento).toBe(7);
  });

  it("string inválida para preço: sem deslocamento", () => {
    const r = computeDeslocamentoSidebar({
      kmEstimado: 2,
      precoDeslocamentoRaw: "xx",
    });
    expect(r.temPrecoKm).toBe(false);
  });

  it("km vazio: total null", () => {
    const r = computeDeslocamentoSidebar({
      kmEstimado: "",
      precoDeslocamentoRaw: 2,
    });
    expect(r.totalDeslocamento).toBeNull();
  });
});

describe("computeValorTotalAproximado", () => {
  const tecnico: Tecnico = {
    id: 1,
    nome: "T",
    precos: {
      revisao: 100,
      deslocamento: 2,
    },
  };

  it("soma serviço e deslocamento quando ambos existem", () => {
    const r = computeValorTotalAproximado({
      tipo: "REVISAO",
      kmEstimado: 5,
      tecnico,
    });
    expect(r.precoServico).toBe(100);
    expect(r.totalDeslocamento).toBe(10);
    expect(r.valorTotal).toBe(110);
  });

  it("sem tipo mapeado: valor total null", () => {
    const r = computeValorTotalAproximado({
      tipo: "TIPO_INEXISTENTE",
      kmEstimado: 1,
      tecnico,
    });
    expect(r.valorTotal).toBeNull();
  });

  it("técnico undefined: tudo vazio/ null", () => {
    const r = computeValorTotalAproximado({
      tipo: "REVISAO",
      kmEstimado: 1,
      tecnico: undefined,
    });
    expect(r.precoServico).toBeNull();
    expect(r.valorTotal).toBeNull();
  });
});

describe("formatBrl", () => {
  it("formata BRL", () => {
    expect(formatBrl(1.5)).toMatch(/1/);
  });
});
