import { Loader2 } from "lucide-react";
import { EquipamentosPageToolbar } from "./components/EquipamentosPageToolbar";
import { EquipamentosPipelineStrip } from "./components/EquipamentosPipelineStrip";
import { EquipamentosTable } from "./components/EquipamentosTable";
import type { EquipamentoPipelineFilter } from "./equipamentos-page.shared";
import { useEquipamentosPageList } from "./useEquipamentosPageList";

export function EquipamentosPage() {
  const list = useEquipamentosPageList();

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EquipamentosPipelineStrip
        pipelineFilter={list.pipelineFilter}
        pipelineCounts={list.pipelineCounts}
        onStageClick={list.handlePipelineClick}
      />

      <EquipamentosPageToolbar
        canCreate={list.canCreate}
        busca={list.busca}
        onBuscaChange={(v) => {
          list.setBusca(v);
          list.setPage(0);
        }}
        statusFilter={list.statusFilter}
        onStatusFilterChange={(v) => {
          list.setStatusFilter(v);
          list.setPipelineFilter(v as EquipamentoPipelineFilter);
          list.setPage(0);
        }}
        proprietarioFilter={list.proprietarioFilter}
        onProprietarioFilterChange={(v) => {
          list.setProprietarioFilter(v);
          list.setPage(0);
        }}
        marcaFilter={list.marcaFilter}
        onMarcaFilterChange={(v) => {
          list.setMarcaFilter(v);
          list.setPage(0);
        }}
        marcas={list.marcas}
        operadoraFilter={list.operadoraFilter}
        onOperadoraFilterChange={(v) => {
          list.setOperadoraFilter(v);
          list.setPage(0);
        }}
        operadoras={list.operadoras}
      />

      <EquipamentosTable
        paginated={list.paginated}
        filtered={list.filtered}
        page={list.page}
        totalPages={list.totalPages}
        expandedId={list.expandedId}
        setExpandedId={list.setExpandedId}
        kitsPorId={list.kitsPorId}
        onPageChange={list.setPage}
      />
    </div>
  );
}
