import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { UseFormReturn } from "react-hook-form";
import type { EnderecoCEP, Municipio, UF } from "@/hooks/useBrasilAPI";
import type { TecnicoFormData } from "../../lib/tecnico-form";
import type { Tecnico } from "../../lib/tecnicos.types";
import { TecnicoFormBasicsSection } from "./TecnicoFormBasicsSection";
import { TecnicoFormEnderecoSection } from "./TecnicoFormEnderecoSection";
import { TecnicoFormResumoSidebar } from "./TecnicoFormResumoSidebar";
import { TecnicoFormValoresSection } from "./TecnicoFormValoresSection";

type WatchedResumo = {
  nome: string | undefined;
  cidade: string | undefined;
  estado: string | undefined;
  instalacaoSemBloqueio: number | undefined;
  revisao: number | undefined;
  deslocamento: number | undefined;
};

type Props = {
  open: boolean;
  editingTecnico: Tecnico | null;
  onClose: () => void;
  form: UseFormReturn<TecnicoFormData>;
  ufs: UF[];
  municipios: Municipio[];
  estadoAtuacao: string;
  onAddressFound: (e: EnderecoCEP) => void;
  watchedResumo: WatchedResumo;
  onSubmit: (data: TecnicoFormData) => void;
  isSubmitting: boolean;
};

export function TecnicoFormDialog({
  open,
  editingTecnico,
  onClose,
  form,
  ufs,
  municipios,
  estadoAtuacao,
  onAddressFound,
  watchedResumo,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        hideClose
        ariaTitle={editingTecnico ? "Editar Técnico" : "Novo Técnico"}
        className="max-w-[900px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-sm"
      >
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MaterialIcon name="engineering" className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {editingTecnico ? "Editar Técnico" : "Novo Técnico"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <form
            id="tecnico-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30"
          >
            <TecnicoFormBasicsSection
              form={form}
              ufs={ufs}
              municipios={municipios}
              estadoAtuacao={estadoAtuacao}
            />
            <TecnicoFormEnderecoSection
              form={form}
              ufs={ufs}
              onAddressFound={onAddressFound}
            />
            <TecnicoFormValoresSection form={form} />
          </form>

          <TecnicoFormResumoSidebar watched={watchedResumo} />
        </div>

        <footer className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="tecnico-form"
            className="bg-erp-blue hover:bg-blue-700"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? "Salvando..." : "Salvar Técnico"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
