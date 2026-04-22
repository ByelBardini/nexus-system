import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";

export function CadastroLoteHeader() {
  return (
    <header className="sticky -top-4 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <Link
          to="/aparelhos"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon
            name="inventory_2"
            className="text-erp-blue text-xl"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Entrada de Rastreador/Simcard
            </h1>
            <p className="text-xs text-slate-500">Cadastro em massa de lote</p>
          </div>
        </div>
      </div>
    </header>
  );
}
