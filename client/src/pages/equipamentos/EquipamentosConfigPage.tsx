import { Loader2 } from "lucide-react";
import {
  useEquipamentosConfig,
  EquipamentosConfigPageHeader,
  MarcasModelosPanel,
  OperadorasTablePanel,
  MarcasSimcardPanel,
  EquipamentosConfigModals,
} from "./config";

export function EquipamentosConfigPage() {
  const c = useEquipamentosConfig();

  if (c.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <EquipamentosConfigPageHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          <MarcasModelosPanel
            canEdit={c.canEdit}
            searchMarcas={c.searchMarcas}
            onSearchMarcas={c.setSearchMarcas}
            expandedMarcaIds={c.expandedMarcaIds}
            filteredMarcas={c.filteredMarcas}
            modelosByMarca={c.modelosByMarca}
            totalModelos={c.totalModelos}
            onToggleMarca={c.toggleMarca}
            onOpenCreateMarca={c.openCreateMarca}
            onOpenEditMarca={c.openEditMarca}
            onToggleAtivoMarca={c.toggleAtivoMarca}
            onDeleteMarca={(id) => c.deleteMarcaMutation.mutate(id)}
            onOpenCreateModelo={c.openCreateModelo}
            onOpenEditModelo={c.openEditModelo}
            onToggleAtivoModelo={c.toggleAtivoModelo}
            onDeleteModelo={(id) => c.deleteModeloMutation.mutate(id)}
            deleteMarcaMutation={c.deleteMarcaMutation}
            deleteModeloMutation={c.deleteModeloMutation}
          />

          <OperadorasTablePanel
            canEdit={c.canEdit}
            searchOperadoras={c.searchOperadoras}
            onSearchOperadoras={c.setSearchOperadoras}
            filteredOperadoras={c.filteredOperadoras}
            onOpenCreateOperadora={c.openCreateOperadora}
            onOpenEditOperadora={c.openEditOperadora}
            onToggleAtivo={c.toggleAtivoOperadora}
            onDelete={(id) => c.deleteOperadoraMutation.mutate(id)}
            deleteOperadoraMutation={c.deleteOperadoraMutation}
          />

          <MarcasSimcardPanel
            canEdit={c.canEdit}
            searchMarcasSimcard={c.searchMarcasSimcard}
            onSearchMarcasSimcard={c.setSearchMarcasSimcard}
            expandedMarcasSimcardIds={c.expandedMarcasSimcardIds}
            filteredMarcasSimcard={c.filteredMarcasSimcard}
            onToggleMarca={c.toggleMarcaSimcard}
            onOpenCreateMarca={c.openCreateMarcaSimcard}
            onOpenEditMarca={c.openEditMarcaSimcard}
            onToggleAtivo={c.toggleAtivoMarcaSimcard}
            onDeleteMarca={(id) => c.deleteMarcaSimcardMutation.mutate(id)}
            onOpenCreatePlano={c.openCreatePlanoSimcard}
            onOpenEditPlano={c.openEditPlanoSimcard}
            onDeletePlano={(id) => c.deletePlanoSimcardMutation.mutate(id)}
            deleteMarcaSimcardMutation={c.deleteMarcaSimcardMutation}
            deletePlanoSimcardMutation={c.deletePlanoSimcardMutation}
          />
        </div>
      </div>

      <EquipamentosConfigModals c={c} />
    </div>
  );
}
