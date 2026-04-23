import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { CargoModalProps } from "@/types/cargo";
import { CargoModalFooter } from "./CargoModalFooter";
import { CargoModalHeaderForm } from "./CargoModalHeaderForm";
import { CargoModalSummary } from "./CargoModalSummary";
import { CargoPermissionMatrix } from "./CargoPermissionMatrix";
import { useCargoModal } from "./useCargoModal";

export type { CargoModalProps };

export function CargoModal({
  open,
  cargo,
  isNew,
  onClose,
  permissoes,
  setores,
}: CargoModalProps) {
  const {
    nome,
    setNome,
    descricao,
    setDescricao,
    categoria,
    setCategoria,
    ativo,
    setAtivo,
    selectedPermIds,
    expandedSectors,
    estrutura,
    permissoesAtivas,
    togglePermission,
    toggleSectorExpanded,
    toggleAllSectorPermissions,
    isSectorFullySelected,
    handleSave,
    isPending,
  } = useCargoModal({ cargo, isNew, setores, permissoes, onClose });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        hideClose
        className="max-w-[1000px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-sm"
      >
        <header className="bg-white border-b border-slate-200 p-6 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MaterialIcon
                name="add_moderator"
                className="text-erp-blue font-bold"
              />
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                {isNew ? "Novo Cargo" : "Editar Cargo"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CargoModalHeaderForm
            isNew={isNew}
            nome={nome}
            descricao={descricao}
            categoria={categoria}
            ativo={ativo}
            onNomeChange={setNome}
            onDescricaoChange={setDescricao}
            onCategoriaChange={setCategoria}
            onAtivoChange={setAtivo}
          />
        </header>

        <div className="flex-1 flex overflow-hidden">
          <CargoPermissionMatrix
            estrutura={estrutura}
            expandedSectors={expandedSectors}
            selectedPermIds={selectedPermIds}
            onToggleSectorExpanded={toggleSectorExpanded}
            onToggleAllSectorPermissions={toggleAllSectorPermissions}
            isSectorFullySelected={isSectorFullySelected}
            onTogglePermission={togglePermission}
          />
          <CargoModalSummary
            nome={nome}
            categoria={categoria}
            permissoesAtivas={permissoesAtivas}
            selectedCount={selectedPermIds.length}
          />
        </div>

        <CargoModalFooter
          onClose={onClose}
          onSave={handleSave}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
