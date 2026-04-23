import { MaterialIcon } from "@/components/MaterialIcon";

export function UsuariosTableFooter({
  totalUsers,
  activeCount,
  inactiveCount,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: {
  totalUsers: number;
  activeCount: number;
  inactiveCount: number;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
          Total de {totalUsers} usuários cadastrados
        </span>
        <div className="flex items-center gap-4 text-[9px] text-slate-400 uppercase font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />{" "}
            {activeCount} Ativos
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full" />{" "}
            {inactiveCount} Inativos
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase">
          Página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-sm border border-slate-300 text-slate-400 bg-white hover:bg-slate-50 disabled:opacity-50"
            disabled={page <= 1}
            onClick={onPrevPage}
          >
            <MaterialIcon name="chevron_left" className="text-base" />
          </button>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-sm border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={onNextPage}
          >
            <MaterialIcon name="chevron_right" className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}
