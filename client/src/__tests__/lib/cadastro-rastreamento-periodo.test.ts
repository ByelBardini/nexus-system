import { describe, expect, it } from "vitest";
import { buildCadastroRastreamentoPeriodoQuery } from "../../lib/cadastro-rastreamento-periodo";

/**
 * Regressão: período em calendário local + [gte, lt) em ISO para a API.
 * Evita regressão para só-datas UTC e OS que somem ao mudar status no mesmo dia.
 */
describe("buildCadastroRastreamentoPeriodoQuery (regressão)", () => {
  it('"hoje" inclui o instante now mesmo no fim da noite local (sem buraco por UTC)', () => {
    const now = new Date(2026, 3, 19, 22, 30, 0);
    const { dataInicio, dataFim } = buildCadastroRastreamentoPeriodoQuery(
      "hoje",
      now,
    );
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(now.getTime()).toBeLessThan(end.getTime());
    expect(end.getTime() - start.getTime()).toBeGreaterThan(0);
  });

  it('"hoje" usa intervalo de um dia civil local (fim exclusivo = meia-noite do dia seguinte)', () => {
    const now = new Date(2026, 3, 19, 8, 0, 0);
    const { dataInicio, dataFim } = buildCadastroRastreamentoPeriodoQuery(
      "hoje",
      now,
    );
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(19);
    expect(end.getDate()).toBe(20);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it('"semana" cobre segunda a domingo da semana corrente (domingo → segunda a domingo)', () => {
    const domingo = new Date(2026, 3, 19, 12, 0, 0);
    expect(domingo.getDay()).toBe(0);
    const { dataInicio, dataFim } = buildCadastroRastreamentoPeriodoQuery(
      "semana",
      domingo,
    );
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(13);
    expect(start.getMonth()).toBe(3);
    expect(domingo.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(domingo.getTime()).toBeLessThan(end.getTime());
  });

  it('"mes" cobre do dia 1 ao último dia do mês (fim exclusivo no dia 1 do mês seguinte)', () => {
    const now = new Date(2026, 3, 15, 10, 0, 0);
    const { dataInicio, dataFim } = buildCadastroRastreamentoPeriodoQuery(
      "mes",
      now,
    );
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(3);
    expect(end.getMonth()).toBe(4);
    expect(end.getDate()).toBe(1);
    expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(now.getTime()).toBeLessThan(end.getTime());
  });

  it("retorna ISO completos (não só YYYY-MM-DD) para o backend aplicar gte/lt corretamente", () => {
    const { dataInicio, dataFim } = buildCadastroRastreamentoPeriodoQuery(
      "hoje",
      new Date(2026, 3, 19, 0, 0, 0),
    );
    expect(dataInicio).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(dataFim).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
