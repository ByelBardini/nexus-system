import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TIPO_CONTRATO_LABEL,
  TIPO_CONTRATO_LEGEND_SWATCH_CLASS,
  TIPO_CONTRATO_VALUES,
  type ClientesFooterStats,
} from "../shared/clientes-page.shared";

type Props = {
  footerStats: ClientesFooterStats;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function ClientesTableFooter({
  footerStats,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: Props) {
  return (
    <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
          Exibindo {footerStats.exibindo} de {footerStats.totalCadastro}{" "}
          cliente(s) · {footerStats.ativosNaSelecao} ativo(s) na seleção
        </span>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase font-bold">
          {TIPO_CONTRATO_VALUES.map((v, i) => (
            <Fragment key={v}>
              {i > 0 && <span className="ml-2" />}
              <span
                className={cn(
                  "w-3 h-3 border rounded-sm",
                  TIPO_CONTRATO_LEGEND_SWATCH_CLASS[v],
                )}
              />
              {TIPO_CONTRATO_LABEL[v]}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase">
          Página {page + 1} de {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 0}
            onClick={onPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages - 1}
            onClick={onNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
