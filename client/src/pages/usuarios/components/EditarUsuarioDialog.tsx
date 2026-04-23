import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import { calcularPermissoesHerdadas } from "../lib/permissoes-heranca";
import { computeAccessScore } from "../lib/usuarios-format";
import type { FormEdit } from "../lib/schemas";
import type { CargoWithPermissions, Permission } from "@/types/usuarios";
import { CargosAtribuicaoBlock } from "./CargosAtribuicaoBlock";
import { PermissoesHerancaSidebar } from "./PermissoesHerancaSidebar";
import { UsuarioDadosForm } from "./UsuarioDadosForm";

export function EditarUsuarioDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  selectedRoleIds,
  onToggleRole,
  showEditRoleSelector,
  onToggleEditRoleSelector,
  cargosPorSetor,
  cargosComPermissoes,
  permissoes,
  updateMutationPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FormEdit>;
  onSubmit: (data: FormEdit) => void;
  selectedRoleIds: number[];
  onToggleRole: (id: number) => void;
  showEditRoleSelector: boolean;
  onToggleEditRoleSelector: () => void;
  cargosPorSetor: Record<string, CargoWithPermissions[]>;
  cargosComPermissoes: CargoWithPermissions[];
  permissoes: Permission[];
  updateMutationPending: boolean;
}) {
  const permissoesEditPreview = calcularPermissoesHerdadas(
    selectedRoleIds,
    cargosComPermissoes,
  );
  const editAccessScore = computeAccessScore(
    selectedRoleIds,
    cargosComPermissoes,
    permissoes.length,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <MaterialIcon name="edit" className="text-erp-blue text-xl" />
            <span className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Editar Usuário
            </span>
            <div className="h-5 w-px bg-slate-200 mx-3" />
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-erp-blue">
              <span className="w-6 h-6 rounded-full border-2 border-erp-blue flex items-center justify-center text-[10px]">
                01
              </span>
              Identidade & Acesso
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-12 py-10"
          >
            <div className="max-w-2xl mx-auto space-y-10">
              <UsuarioDadosForm form={form} />
              <CargosAtribuicaoBlock
                selectedRoleIds={selectedRoleIds}
                cargosComPermissoes={cargosComPermissoes}
                cargosPorSetor={cargosPorSetor}
                showSelector={showEditRoleSelector}
                onToggleShowSelector={onToggleEditRoleSelector}
                onToggleRole={onToggleRole}
                chipsLabel="Cargos Vinculados"
              />
            </div>
          </form>

          <PermissoesHerancaSidebar
            setoresHabilitados={permissoesEditPreview.setoresHabilitados}
            acoesAltoRisco={permissoesEditPreview.acoesAltoRisco}
            accessScore={editAccessScore}
          />
        </div>

        <footer className="h-20 border-t border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-sm font-bold text-slate-500 uppercase hover:text-slate-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutationPending}
            className="px-8 py-3 bg-erp-blue text-white text-sm font-bold uppercase hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MaterialIcon name="verified_user" className="text-base" />
            {updateMutationPending ? "Salvando..." : "Confirmar Edição"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
