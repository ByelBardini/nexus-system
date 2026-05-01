import { MaterialIcon } from "@/components/MaterialIcon";
import { useDescartadosList } from "./useDescartadosList";
import { DescartadosToolbar } from "./DescartadosToolbar";
import { DescartadosTable } from "./DescartadosTable";
import { Loader2 } from "lucide-react";

export function DescartadosPage() {
  const { lista, isLoading, busca, setBusca, tipoFilter, setTipoFilter } =
    useDescartadosList();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <MaterialIcon name="delete_sweep" className="text-slate-600 text-2xl" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Descartados</h1>
          <p className="text-xs text-slate-500">
            Aparelhos removidos permanentemente do estoque
          </p>
        </div>
      </div>

      <DescartadosToolbar
        busca={busca}
        onBuscaChange={setBusca}
        tipoFilter={tipoFilter}
        onTipoFilterChange={setTipoFilter}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <DescartadosTable lista={lista} />
      )}
    </div>
  );
}
