import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onConfirmSim: () => void;
  onConfirmNao: () => void;
  isPending: boolean;
};

export function RetiradaRealizadaDialog({
  open,
  onOpenChange,
  onClose,
  onConfirmSim,
  onConfirmNao,
  isPending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        ariaTitle="Retirada realizada"
        className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        data-testid="ordens-servico-dialog-retirada"
      >
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon name="remove_circle" className="text-erp-blue" />
            <h2 className="text-lg font-bold text-slate-800">
              Retirada realizada
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
            data-testid="ordens-servico-dialog-retirada-fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            O aparelho foi encontrado no local?
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onConfirmSim}
              disabled={isPending}
              data-testid="ordens-servico-dialog-retirada-sim"
            >
              Sim
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              onClick={onConfirmNao}
              disabled={isPending}
              data-testid="ordens-servico-dialog-retirada-nao"
            >
              Não
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
