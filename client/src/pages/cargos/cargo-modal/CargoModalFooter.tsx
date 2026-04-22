import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";

export function CargoModalFooter({
  onClose,
  onSave,
  isPending,
}: {
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
        <MaterialIcon name="lock" className="text-sm" />
        Segurança Industrial Garantida
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="px-6 h-10 text-xs font-bold text-slate-600 hover:text-slate-800 uppercase"
          onClick={onClose}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold h-10 px-8 rounded-sm shadow-sm uppercase tracking-wide"
          onClick={onSave}
          disabled={isPending}
        >
          {isPending ? "Salvando..." : "Salvar Cargo"}
        </Button>
      </div>
    </footer>
  );
}
