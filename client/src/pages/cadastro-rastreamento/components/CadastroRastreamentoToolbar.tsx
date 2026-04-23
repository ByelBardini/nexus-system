import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CADASTRO_RAST_STATUS_TABS,
  SELECT_CADASTRO_RAST_TODOS,
} from "@/lib/cadastro-rastreamento-ui";
import type { StatusCadastro } from "@/types/cadastro-rastreamento";
import { cn } from "@/lib/utils";

export function CadastroRastreamentoToolbar({
  tecnicos,
  filtroTecnico,
  setFiltroTecnico,
  filtroTipo,
  setFiltroTipo,
  periodo,
  setPeriodo,
  filtroStatus,
  setFiltroStatus,
  temFiltroAtivo,
  onLimparFiltrosTecnicoETipo,
}: {
  tecnicos: string[];
  filtroTecnico: string;
  setFiltroTecnico: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  periodo: string;
  setPeriodo: (v: string) => void;
  filtroStatus: StatusCadastro | "TODOS";
  setFiltroStatus: (v: StatusCadastro | "TODOS") => void;
  temFiltroAtivo: boolean;
  onLimparFiltrosTecnicoETipo: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Técnico
          </label>
          <Select
            value={
              filtroTecnico === "" ? SELECT_CADASTRO_RAST_TODOS : filtroTecnico
            }
            onValueChange={(v) =>
              setFiltroTecnico(v === SELECT_CADASTRO_RAST_TODOS ? "" : v)
            }
          >
            <SelectTrigger className="h-9 text-xs w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_CADASTRO_RAST_TODOS}>Todos</SelectItem>
              {tecnicos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Tipo de Registro
          </label>
          <Select
            value={filtroTipo === "" ? SELECT_CADASTRO_RAST_TODOS : filtroTipo}
            onValueChange={(v) =>
              setFiltroTipo(v === SELECT_CADASTRO_RAST_TODOS ? "" : v)
            }
          >
            <SelectTrigger className="h-9 text-xs w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_CADASTRO_RAST_TODOS}>Todos</SelectItem>
              <SelectItem value="CADASTRO">Instalação</SelectItem>
              <SelectItem value="REVISAO">Revisão</SelectItem>
              <SelectItem value="RETIRADA">Retirada</SelectItem>
              <SelectItem value="OUTRO">Outro tipo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Período
          </label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {temFiltroAtivo && (
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={onLimparFiltrosTecnicoETipo}
              className="h-9 px-3 text-[11px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded bg-white hover:bg-slate-50 flex items-center gap-1"
            >
              <MaterialIcon name="close" className="text-sm" />
              Limpar
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {CADASTRO_RAST_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFiltroStatus(tab.value)}
            className={cn(
              "px-3 py-1 text-[11px] font-bold rounded border transition-colors",
              filtroStatus === tab.value
                ? "bg-erp-blue text-white border-erp-blue"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
