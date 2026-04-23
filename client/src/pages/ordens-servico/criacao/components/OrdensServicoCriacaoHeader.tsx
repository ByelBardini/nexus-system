import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";

type Props = {
  userName: string | undefined;
  canCreate: boolean;
  isFormValid: boolean;
  isPending: boolean;
  onCancel: () => void;
  onEmitir: () => void;
};

export function OrdensServicoCriacaoHeader({
  userName,
  canCreate,
  isFormValid,
  isPending,
  onCancel,
  onEmitir,
}: Props) {
  return (
    <header className="sticky -top-4 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon name="assignment" className="text-blue-600 text-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Nova Ordem de Serviço
            </h1>
            <p className="text-xs text-slate-500">
              Criado por: {userName ?? "—"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="text-[11px] font-bold uppercase"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="bg-erp-blue hover:bg-blue-700 text-white text-[11px] font-bold uppercase px-5 gap-2"
          onClick={onEmitir}
          disabled={!canCreate || !isFormValid || isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MaterialIcon name="send" className="text-sm" />
          )}
          Emitir Ordem
        </Button>
      </div>
    </header>
  );
}
