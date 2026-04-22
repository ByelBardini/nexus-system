import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { DebitosEquipamentosStats } from "../domain/debitos-equipamentos-helpers";

export interface DebitosEquipamentosSummaryCardsProps {
  stats: DebitosEquipamentosStats;
}

export function DebitosEquipamentosSummaryCards({
  stats,
}: DebitosEquipamentosSummaryCardsProps) {
  return (
    <div className="flex w-full shadow-sm border border-slate-300 bg-white">
      <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="border-l-4 border-amber-500 pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Aparelhos Devidos
            </span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
              {stats.totalAparelhosDevidos}
            </div>
          </div>
          <MaterialIcon
            name="account_balance"
            className="text-amber-400 text-2xl"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <MaterialIcon
            name={stats.saldoMes >= 0 ? "trending_up" : "trending_down"}
            className={cn(
              "text-base",
              stats.saldoMes >= 0 ? "text-red-500" : "text-emerald-500",
            )}
          />
          <span
            className={cn(
              "text-[11px] font-bold",
              stats.saldoMes >= 0 ? "text-red-600" : "text-emerald-600",
            )}
          >
            {stats.saldoMes >= 0 ? "+" : ""}
            {stats.saldoMes} un.
          </span>
          <span className="text-[10px] text-slate-400">
            desde início do mês
          </span>
        </div>
      </div>

      <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="border-l-4 border-erp-blue pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Clientes Devedores
            </span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
              {stats.devedoresCliente}
            </div>
          </div>
          <MaterialIcon name="groups" className="text-blue-400 text-2xl" />
        </div>
        <div className="space-y-1">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-erp-blue rounded-full transition-all"
              style={{ width: `${stats.pctCliente}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-blue-600 font-bold">
              {stats.pctCliente}% clientes
            </span>
            <span className="text-slate-400">
              {100 - stats.pctCliente}% infinity
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="border-l-4 border-emerald-500 pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Modelos Ativos
            </span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
              {stats.modelosAtivos}
            </div>
          </div>
          <MaterialIcon name="devices" className="text-emerald-400 text-2xl" />
        </div>
        <div className="flex items-center gap-1.5">
          <MaterialIcon name="star" className="text-amber-400 text-sm" />
          <span className="text-[10px] text-slate-400">Predominante:</span>
          <span className="text-[11px] font-bold text-slate-700">
            {stats.modeloPredominante}
          </span>
        </div>
      </div>
    </div>
  );
}
