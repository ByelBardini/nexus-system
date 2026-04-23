import { MaterialIcon } from "@/components/MaterialIcon";
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import { cn } from "@/lib/utils";
import type { ClientePareamentoLista } from "../domain/types";
import type { ProprietarioTipo } from "../domain/types";

type Props = {
  proprietario: ProprietarioTipo;
  onInfinity: () => void;
  onCliente: () => void;
  clientes: ClientePareamentoLista[];
  clienteId: number | null;
  onClienteIdChange: (id: number | null) => void;
  searchPlaceholder?: string;
};

export function PareamentoProprietarioInfinityClienteCard({
  proprietario,
  onInfinity,
  onCliente,
  clientes,
  clienteId,
  onClienteIdChange,
  searchPlaceholder = "Digite para pesquisar cliente...",
}: Props) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <MaterialIcon name="business_center" className="text-erp-blue" />
        <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
          Pertence a
        </h3>
      </div>
      <div className="flex rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={onInfinity}
          className={cn(
            "flex-1 py-2.5 px-4 text-xs font-bold uppercase border transition-all",
            proprietario === "INFINITY"
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
          )}
        >
          Infinity
        </button>
        <button
          type="button"
          onClick={onCliente}
          className={cn(
            "flex-1 py-2.5 px-4 text-xs font-bold uppercase border-t border-b border-r transition-all",
            proprietario === "CLIENTE"
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
          )}
        >
          Cliente
        </button>
      </div>
      {proprietario === "CLIENTE" && (
        <div className="mt-3">
          <SelectClienteSearch
            clientes={clientes}
            value={clienteId ?? undefined}
            onChange={(id) => onClienteIdChange(id ?? null)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
    </div>
  );
}
