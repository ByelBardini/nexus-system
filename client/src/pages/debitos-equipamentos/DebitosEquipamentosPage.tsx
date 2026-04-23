import { DebitosEquipamentosFilters } from "./components/DebitosEquipamentosFilters";
import { DebitosEquipamentosSummaryCards } from "./components/DebitosEquipamentosSummaryCards";
import { DebitosEquipamentosTable } from "./components/DebitosEquipamentosTable";
import { useDebitosEquipamentos } from "./hooks/useDebitosEquipamentos";

export function DebitosEquipamentosPage() {
  const {
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroDevedor,
    setFiltroDevedor,
    filtroModelo,
    setFiltroModelo,
    opcoesDevedor,
    opcoesModelo,
    stats,
    filtered,
    clearFilters,
  } = useDebitosEquipamentos();

  return (
    <div className="space-y-4">
      <DebitosEquipamentosSummaryCards stats={stats} />
      <DebitosEquipamentosFilters
        busca={busca}
        onBuscaChange={setBusca}
        filtroDevedor={filtroDevedor}
        onFiltroDevedorChange={setFiltroDevedor}
        filtroModelo={filtroModelo}
        onFiltroModeloChange={setFiltroModelo}
        filtroStatus={filtroStatus}
        onFiltroStatusChange={setFiltroStatus}
        opcoesDevedor={opcoesDevedor}
        opcoesModelo={opcoesModelo}
        onClearFilters={clearFilters}
      />
      <DebitosEquipamentosTable
        filtered={filtered}
        expandedId={expandedId}
        onExpandedChange={setExpandedId}
      />
      <div className="text-[11px] text-slate-500">
        {filtered.length} registro(s) encontrado(s)
      </div>
    </div>
  );
}
