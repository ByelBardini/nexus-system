import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { MapState } from "@/lib/tecnicos-page";
import type { TecnicoFormData } from "./lib/tecnico-form";
import { TecnicosMapPanel } from "./components/TecnicosMapPanel";
import { TecnicosPageHeader } from "./components/TecnicosPageHeader";
import { TecnicosTableSection } from "./components/TecnicosTableSection";
import { TecnicoFormDialog } from "./components/form/TecnicoFormDialog";
import { useTecnicoFormModal } from "./hooks/useTecnicoFormModal";
import { useTecnicosListQuery } from "./hooks/useTecnicosListQuery";
import { useTecnicosMutations } from "./hooks/useTecnicosMutations";
import { useTecnicosTableState } from "./hooks/useTecnicosTableState";
import type { Tecnico } from "./lib/tecnicos.types";

export function TecnicosPage() {
  const { hasPermission } = useAuth();
  const [mapState, setMapState] = useState<MapState>("collapsed");
  const canCreate = hasPermission("AGENDAMENTO.TECNICO.CRIAR");
  const canEdit = hasPermission("AGENDAMENTO.TECNICO.EDITAR");

  const {
    data: tecnicos = [],
    isLoading,
    isError,
    error,
  } = useTecnicosListQuery();

  const table = useTecnicosTableState(tecnicos);

  const formModal = useTecnicoFormModal();

  const { updateStatusMutation, createMutation, updateMutation } =
    useTecnicosMutations({
      onCreateSuccess: formModal.closeModal,
      onUpdateSuccess: formModal.closeModal,
    });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleFormSubmit = useCallback(
    (data: TecnicoFormData) => {
      if (isSubmitting) return;
      if (formModal.editingTecnico) {
        updateMutation.mutate({
          id: formModal.editingTecnico.id,
          data,
        });
      } else {
        createMutation.mutate(data);
      }
    },
    [isSubmitting, formModal.editingTecnico, createMutation, updateMutation],
  );

  const toggleStatus = useCallback(
    (t: Tecnico) => {
      if (!canEdit) return;
      updateStatusMutation.mutate({ id: t.id, ativo: !t.ativo });
    },
    [canEdit, updateStatusMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive font-medium">
          Erro ao carregar técnicos
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error instanceof Error ? error.message : "Erro desconhecido."}
        </p>
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <TecnicosPageHeader
        busca={table.busca}
        onBuscaChange={table.setBusca}
        filtroEstado={table.filtroEstado}
        onFiltroEstadoChange={table.setFiltroEstado}
        filtroStatus={table.filtroStatus}
        onFiltroStatusChange={table.setFiltroStatus}
        ufs={formModal.ufs}
        canCreate={canCreate}
        onNovoTecnico={formModal.openCreateModal}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <TecnicosMapPanel
          tecnicos={table.filtered}
          mapState={mapState}
          onMapStateChange={setMapState}
        />

        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden bg-white",
            mapState === "fullscreen" && "hidden",
          )}
        >
          <TecnicosTableSection
            paginated={table.paginated}
            filteredCount={table.filtered.length}
            expandedId={table.expandedId}
            onExpandedChange={table.setExpandedId}
            page={table.page}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            canEdit={canEdit}
            onToggleStatus={toggleStatus}
            onEditTecnico={formModal.openEditModal}
          />
        </section>
      </div>

      <TecnicoFormDialog
        open={formModal.modalOpen}
        editingTecnico={formModal.editingTecnico}
        onClose={formModal.closeModal}
        form={formModal.form}
        ufs={formModal.ufs}
        municipios={formModal.municipios}
        estadoAtuacao={formModal.estadoAtuacao ?? ""}
        onAddressFound={formModal.handleAddressFound}
        watchedResumo={formModal.watchedResumo}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
