import { Loader2 } from "lucide-react";
import { AparelhosStatusPipeline } from "./lista/AparelhosStatusPipeline";
import { AparelhosTable } from "./lista/AparelhosTable";
import { AparelhosToolbar } from "./lista/AparelhosToolbar";
import { useAparelhosList } from "./lista/useAparelhosList";

export function AparelhosPage() {
  const {
    canCreate,
    isLoading,
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    statusFilter,
    setStatusFilter,
    tipoFilter,
    setTipoFilter,
    proprietarioFilter,
    setProprietarioFilter,
    marcaFilter,
    setMarcaFilter,
    page,
    setPage,
    kitsPorId,
    marcas,
    statusCounts,
    totalCount,
    filtered,
    paginated,
    totalPages,
    handleStatusClick,
  } = useAparelhosList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AparelhosStatusPipeline
        statusFilter={statusFilter}
        statusCounts={statusCounts}
        totalCount={totalCount}
        onStatusClick={handleStatusClick}
      />

      <AparelhosToolbar
        canCreate={canCreate}
        busca={busca}
        onBuscaChange={(v) => {
          setBusca(v);
          setPage(0);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPage(0);
        }}
        tipoFilter={tipoFilter}
        onTipoFilterChange={(v) => {
          setTipoFilter(v);
          setPage(0);
        }}
        proprietarioFilter={proprietarioFilter}
        onProprietarioFilterChange={(v) => {
          setProprietarioFilter(v);
          setPage(0);
        }}
        marcaFilter={marcaFilter}
        onMarcaFilterChange={(v) => {
          setMarcaFilter(v);
          setPage(0);
        }}
        marcas={marcas}
      />

      <AparelhosTable
        paginated={paginated}
        filteredLength={filtered.length}
        page={page}
        totalPages={totalPages}
        kitsPorId={kitsPorId}
        expandedId={expandedId}
        onToggleRow={(id) =>
          setExpandedId((cur) => (cur === id ? null : id))
        }
        onPageChange={setPage}
      />
    </div>
  );
}
