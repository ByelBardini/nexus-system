import { X } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";

type ModalNovoPedidoHeaderProps = {
  onClose: () => void;
};

export function ModalNovoPedidoHeader({ onClose }: ModalNovoPedidoHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <MaterialIcon name="add_circle" className="text-xl text-erp-blue" />
        <h2 className="text-base font-bold text-slate-800">
          Novo Pedido de Rastreador
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>
    </header>
  );
}
