import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModalNovoPedidoFooterProps = {
  isPending: boolean;
  onCancel: () => void;
};

export function ModalNovoPedidoFooter({
  isPending,
  onCancel,
}: ModalNovoPedidoFooterProps) {
  return (
    <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isPending}
        className="bg-erp-blue hover:bg-blue-700"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          "Enviar Solicitação"
        )}
      </Button>
    </footer>
  );
}
