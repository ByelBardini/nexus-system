/**
 * Intervalo de listagem do cadastro de rastreamento: [dataInicio, dataFim) em ISO UTC,
 * com limites no calendário local do navegador (evita exclusão de horários no fim do dia por UTC).
 */

export type CadastroRastreamentoPeriodo = "hoje" | "semana" | "mes";

function inicioDiaLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function somarDiasLocal(base: Date, delta: number): Date {
  const t = new Date(base);
  t.setDate(t.getDate() + delta);
  return t;
}

export function buildCadastroRastreamentoPeriodoQuery(
  periodo: CadastroRastreamentoPeriodo,
  now: Date = new Date(),
): { dataInicio: string; dataFim: string } {
  let inicio: Date;
  let fimExclusivo: Date;

  if (periodo === "hoje") {
    inicio = inicioDiaLocal(now);
    fimExclusivo = inicioDiaLocal(somarDiasLocal(now, 1));
  } else if (periodo === "semana") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = somarDiasLocal(monday, 6);
    inicio = inicioDiaLocal(monday);
    fimExclusivo = inicioDiaLocal(somarDiasLocal(sunday, 1));
  } else {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    inicio = inicioDiaLocal(firstDay);
    fimExclusivo = inicioDiaLocal(somarDiasLocal(lastDay, 1));
  }

  return {
    dataInicio: inicio.toISOString(),
    dataFim: fimExclusivo.toISOString(),
  };
}
