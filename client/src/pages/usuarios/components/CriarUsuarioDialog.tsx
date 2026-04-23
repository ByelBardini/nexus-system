import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import { calcularPermissoesHerdadas } from "../lib/permissoes-heranca";
import { computeAccessScore } from "../lib/usuarios-format";
import type { FormCreate } from "../lib/schemas";
import type { CargoWithPermissions, Permission } from "@/types/usuarios";
import { CargosAtribuicaoBlock } from "./CargosAtribuicaoBlock";
import { PermissoesHerancaSidebar } from "./PermissoesHerancaSidebar";
import { UsuarioDadosForm } from "./UsuarioDadosForm";

export function CriarUsuarioDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  selectedCreateRoleIds,
  onToggleCreateRole,
  showCreateRoleSelector,
  onToggleCreateRoleSelector,
  cargosPorSetor,
  cargosComPermissoes,
  permissoes,
  createMutationPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FormCreate>;
  onSubmit: (data: FormCreate) => void;
  selectedCreateRoleIds: number[];
  onToggleCreateRole: (id: number) => void;
  showCreateRoleSelector: boolean;
  onToggleCreateRoleSelector: () => void;
  cargosPorSetor: Record<string, CargoWithPermissions[]>;
  cargosComPermissoes: CargoWithPermissions[];
  permissoes: Permission[];
  createMutationPending: boolean;
}) {
  const permissoesCreatePreview = calcularPermissoesHerdadas(
    selectedCreateRoleIds,
    cargosComPermissoes,
  );
  const createAccessScore = computeAccessScore(
    selectedCreateRoleIds,
    cargosComPermissoes,
    permissoes.length,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <MaterialIcon name="person_add" className="text-erp-blue text-xl" />
            <span className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Configuração de Novo Usuário
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
                selectedRoleIds={selectedCreateRoleIds}
                cargosComPermissoes={cargosComPermissoes}
                cargosPorSetor={cargosPorSetor}
                showSelector={showCreateRoleSelector}
                onToggleShowSelector={onToggleCreateRoleSelector}
                onToggleRole={onToggleCreateRole}
                chipsLabel="Cargos Selecionados"
              />

              <section className="bg-slate-50 p-5 border border-slate-200 rounded">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                  <MaterialIcon name="security" className="text-base" />
                  Protocolos de Segurança
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-not-allowed">
                    <Checkbox checked disabled className="w-5 h-5" />
                    <span className="text-sm font-medium text-slate-700">
                      Forçar reset de senha no primeiro login{" "}
                      <span className="text-slate-400">(Obrigatório)</span>
                    </span>
                  </label>
                  <p className="text-xs text-slate-400 italic ml-8">
                    A senha inicial será{" "}
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">
                      #Infinity123
                    </code>{" "}
                    e o usuário deverá alterá-la no primeiro acesso.
                  </p>
                </div>
              </section>
            </div>
          </form>

          <PermissoesHerancaSidebar
            setoresHabilitados={permissoesCreatePreview.setoresHabilitados}
            acoesAltoRisco={permissoesCreatePreview.acoesAltoRisco}
            accessScore={createAccessScore}
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
            disabled={createMutationPending}
            className="px-8 py-3 bg-erp-blue text-white text-sm font-bold uppercase hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MaterialIcon name="verified_user" className="text-base" />
            {createMutationPending ? "Criando..." : "Criar Usuário"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
