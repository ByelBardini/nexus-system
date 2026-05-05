import { Fragment } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatarDataDiaMesAno, formatarDataHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ENTIDADE_DEBITO_CONFIG,
  STATUS_DEBITO_CONFIG,
} from "../domain/debito-equipamento.constants";
import type { DebitoEquipamento } from "../domain/types";

export interface DebitoEquipamentoRowGroupProps {
  debito: DebitoEquipamento;
  isExpanded: boolean;
  onToggle: () => void;
}

export function DebitoEquipamentoRowGroup({
  debito,
  isExpanded,
  onToggle,
}: DebitoEquipamentoRowGroupProps) {
  const totalUnidades = debito.modelos.reduce(
    (acc, m) => acc + m.quantidade,
    0,
  );
  const statusCfg = STATUS_DEBITO_CONFIG[debito.status];
  const devedorCfg = ENTIDADE_DEBITO_CONFIG[debito.devedor.tipo];
  const credorCfg = ENTIDADE_DEBITO_CONFIG[debito.credor.tipo];

  return (
    <Fragment>
      <TableRow
        className={cn(
          "cursor-pointer border-b border-slate-100 hover:bg-blue-50/30 transition-colors bg-white",
          isExpanded && "border-l-4 border-l-blue-600 bg-blue-50/20",
        )}
        onClick={onToggle}
      >
        <TableCell className="pl-4 px-3 py-3">
          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
            #{debito.id}
          </span>
        </TableCell>

        <TableCell className="px-3 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-700">
              {debito.devedor.nome}
            </span>
            <span
              className={cn(
                "self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
                devedorCfg.className,
              )}
            >
              {debito.devedor.tipo === "infinity" ? "Infinity" : "Cliente"}
            </span>
          </div>
        </TableCell>

        <TableCell className="px-3 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-700">
              {debito.credor.nome}
            </span>
            <span
              className={cn(
                "self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
                credorCfg.className,
              )}
            >
              {debito.credor.tipo === "infinity" ? "Infinity" : "Cliente"}
            </span>
          </div>
        </TableCell>

        <TableCell className="px-3 py-3">
          <span className="text-sm font-black text-slate-800">
            {totalUnidades}
          </span>
          <span className="text-[10px] text-slate-400 ml-1">un.</span>
        </TableCell>

        <TableCell className="px-3 py-3">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
              statusCfg.className,
            )}
          >
            {statusCfg.label}
          </span>
        </TableCell>

        <TableCell className="px-3 py-3">
          <span className="text-[10px] font-mono text-slate-500">
            {formatarDataDiaMesAno(debito.ultimaMovimentacao)}
          </span>
        </TableCell>

        <TableCell className="px-3 py-3 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <MaterialIcon
              name={isExpanded ? "expand_less" : "more_vert"}
              className="text-xl"
            />
          </button>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-white border-b border-slate-200">
          <TableCell colSpan={7} className="p-0">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-5">
              <span
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-bold uppercase border shrink-0",
                  statusCfg.className,
                )}
              >
                {statusCfg.label}
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span>{debito.devedor.nome}</span>
                <MaterialIcon
                  name="arrow_forward"
                  className="text-slate-400 text-base"
                />
                <span>{debito.credor.nome}</span>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  Total
                </div>
                <div className="text-lg font-black text-slate-800 leading-none">
                  {totalUnidades}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    un.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="px-6 py-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
                  Distribuição de Modelos
                </h4>
                <div className="space-y-1">
                  {debito.modelos.map((modelo) => (
                    <div
                      key={modelo.nome}
                      className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-xs font-semibold text-slate-700">
                        {modelo.nome}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {modelo.quantidade}{" "}
                        <span className="font-normal text-slate-400 text-[10px]">
                          un.
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Total consolidado
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    {totalUnidades}{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      un.
                    </span>
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
                  Histórico de Movimentações
                </h4>
                <div className="space-y-2">
                  {debito.historico.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">
                      Nenhuma movimentação registrada.
                    </p>
                  )}
                  {debito.historico.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1 w-2 h-2 rounded-full shrink-0",
                          item.tipo === "entrada"
                            ? "bg-emerald-500"
                            : "bg-red-400",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-700">
                            {item.descricao}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-bold shrink-0",
                              item.tipo === "entrada"
                                ? "text-emerald-600"
                                : "text-red-500",
                            )}
                          >
                            {item.tipo === "entrada" ? "+" : "-"}
                            {item.quantidade} un.
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {formatarDataHora(item.data)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
