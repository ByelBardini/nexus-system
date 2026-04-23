import { MaterialIcon } from "@/components/MaterialIcon";

export function CadastroRastreamentoStatsCards({
  statsAguardando,
  statsEmCadastro,
  statsConcluido,
}: {
  statsAguardando: number;
  statsEmCadastro: number;
  statsConcluido: number;
}) {
  return (
    <div className="flex w-full shadow-sm border border-slate-300 bg-white">
      <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="border-l-4 border-amber-500 pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Aguardando
            </span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
              {statsAguardando}
            </div>
          </div>
          <MaterialIcon name="schedule" className="text-amber-400 text-2xl" />
        </div>
        <div className="flex items-center gap-1.5">
          <MaterialIcon name="list_alt" className="text-slate-400 text-sm" />
          <span className="text-[10px] text-slate-400">ordens na fila</span>
        </div>
      </div>

      <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="border-l-4 border-erp-blue pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Em Cadastro
            </span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
              {statsEmCadastro}
            </div>
          </div>
          <MaterialIcon name="sync" className="text-blue-400 text-2xl" />
        </div>
        <div className="flex items-center gap-1.5">
          <MaterialIcon name="person" className="text-slate-400 text-sm" />
          <span className="text-[10px] text-slate-400">sendo registradas</span>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="border-l-4 border-emerald-500 pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Concluídas no Período
            </span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
              {statsConcluido}
            </div>
          </div>
          <MaterialIcon
            name="check_circle"
            className="text-emerald-400 text-2xl"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <MaterialIcon name="verified" className="text-slate-400 text-sm" />
          <span className="text-[10px] text-slate-400">
            registros concluídos
          </span>
        </div>
      </div>
    </div>
  );
}
