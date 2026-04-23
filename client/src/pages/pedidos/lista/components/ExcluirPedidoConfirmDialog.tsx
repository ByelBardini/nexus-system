import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";

type ExcluirPedidoConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoCodigo: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação de exclusão de pedido (padrão ERP: header nativo + footer com ação destrutiva).
 */
export function ExcluirPedidoConfirmDialog({
  open,
  onOpenChange,
  pedidoCodigo,
  isPending,
  onCancel,
  onConfirm,
}: ExcluirPedidoConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-sm p-0 gap-0 overflow-hidden rounded-sm"
      >
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon
              name="delete_forever"
              className="text-red-600 text-lg"
            />
            <h2 className="text-base font-bold text-slate-800">Excluir pedido</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir o pedido{" "}
            <strong className="text-slate-800">{pedidoCodigo}</strong>? Esta
            ação não pode ser desfeita.
          </p>
        </div>
        <footer className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="font-bold"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Excluir
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
