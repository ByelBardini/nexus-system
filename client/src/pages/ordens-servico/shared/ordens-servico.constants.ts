import type { OrdensServicoResumo } from "./ordens-servico.types";

/** Labels de status de workflow da OS (lista, badges, filtro). */
export const ORDENS_SERVICO_STATUS_LABELS: Record<string, string> = {
  AGENDADO: "Agendado",
  EM_TESTES: "Em Testes",
  TESTES_REALIZADOS: "Testes Realizados",
  AGUARDANDO_CADASTRO: "Ag. Cadastro",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const ORDENS_SERVICO_STATUS_COLORS: Record<string, string> = {
  AGENDADO: "bg-erp-yellow/10 text-yellow-800 border-erp-yellow/30",
  EM_TESTES: "bg-erp-blue/10 text-erp-blue border-erp-blue/30",
  TESTES_REALIZADOS: "bg-erp-purple/10 text-purple-800 border-erp-purple/30",
  AGUARDANDO_CADASTRO: "bg-erp-orange/10 text-orange-800 border-erp-orange/30",
  FINALIZADO: "bg-erp-green/10 text-green-800 border-erp-green/30",
  CANCELADO: "bg-slate-200 text-slate-600 border-slate-400",
};

export function totalOrdensFromResumo(
  resumo: OrdensServicoResumo | undefined,
): number {
  if (!resumo) return 0;
  return (
    resumo.agendado +
    resumo.emTestes +
    resumo.testesRealizados +
    resumo.aguardandoCadastro +
    resumo.finalizado
  );
}
