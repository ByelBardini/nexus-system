import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";

export function EquipamentosConfigPageHeader() {
  return (
    <header className="h-20 shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <Link
          to="/equipamentos"
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon
            name="precision_manufacturing"
            className="text-erp-blue text-xl"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              Marcas, Modelos e Operadoras
            </h1>
            <p className="text-xs text-slate-500">
              Gestão de marcas, modelos e operadoras dos aparelhos e simcards.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
