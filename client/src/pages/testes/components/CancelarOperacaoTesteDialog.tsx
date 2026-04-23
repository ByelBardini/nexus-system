import { X } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CancelarOperacaoTesteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReagendar: () => void;
  onCancelarOs: () => void;
  canAct: boolean;
  isPending: boolean;
}

export function CancelarOperacaoTesteDialog({
  open,
  onOpenChange,
  onReagendar,
  onCancelarOs,
  canAct,
  isPending,
}: CancelarOperacaoTesteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent
        hideClose
        className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        ariaTitle="Cancelar operação"
      >
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon name="help" className="text-erp-blue" />
            <h2 className="text-lg font-bold text-slate-800">
              Cancelar operação
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-slate-600">
            O que deseja fazer com esta ordem de serviço?
          </p>
        </div>
        <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={onReagendar}
            disabled={!canAct || isPending}
          >
            Reagendar
          </Button>
          <Button
            variant="destructive"
            onClick={onCancelarOs}
            disabled={!canAct || isPending}
          >
            Cancelar OS
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
