import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { Cliente } from "../shared/clientes-page.shared";
import { ClienteModalContatosSection } from "./ClienteModalContatosSection";
import { ClienteModalDadosSection } from "./ClienteModalDadosSection";
import { ClienteModalEnderecoSection } from "./ClienteModalEnderecoSection";
import { ClienteModalResumo } from "./ClienteModalResumo";
import { useClienteModal } from "./useClienteModal";

export type ClienteModalProps = {
  open: boolean;
  editingCliente: Cliente | null;
  onClose: () => void;
};

export function ClienteModal({
  open,
  editingCliente,
  onClose,
}: ClienteModalProps) {
  const {
    form,
    ufs,
    municipios,
    handleAddressFound,
    fields,
    handleSubmit,
    addContato,
    remove,
    resumoForm,
    resumoTipoContrato,
    isSubmitting,
  } = useClienteModal({ open, editingCliente, onClose });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        hideClose
        className="max-w-[900px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-sm"
      >
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MaterialIcon name="person" className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {editingCliente ? "Editar Cliente" : "Novo Cliente"}
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
            id="cliente-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30"
          >
            <ClienteModalDadosSection form={form} />
            <ClienteModalEnderecoSection
              form={form}
              ufs={ufs}
              municipios={municipios}
              onAddressFound={handleAddressFound}
            />
            <ClienteModalContatosSection
              form={form}
              fields={fields}
              onAddContato={addContato}
              onRemoveContato={remove}
            />
          </form>

          <ClienteModalResumo
            resumoForm={resumoForm}
            resumoTipoContrato={resumoTipoContrato}
          />
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
            form="cliente-form"
            className="bg-erp-blue hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
