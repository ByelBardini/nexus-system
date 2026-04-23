import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function ConfirmIniciarTestesDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  isPending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        ariaTitle="Confirmar Iniciar Testes"
        className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        data-testid="ordens-servico-dialog-iniciar-testes"
      >
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon name="science" className="text-erp-blue" />
            <h2 className="text-lg font-bold text-slate-800">Iniciar Testes</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
            data-testid="ordens-servico-dialog-iniciar-fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-slate-600">
            Tem certeza que deseja iniciar os testes desta ordem de serviço? O
            status será alterado para &quot;Em Testes&quot;.
          </p>
        </div>
        <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            data-testid="ordens-servico-dialog-iniciar-cancelar"
          >
            Cancelar
          </Button>
          <Button
            className="bg-erp-blue hover:bg-blue-700"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="ordens-servico-dialog-iniciar-confirmar"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MaterialIcon name="play_arrow" className="text-lg mr-2" />
            )}
            Iniciar Testes
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
