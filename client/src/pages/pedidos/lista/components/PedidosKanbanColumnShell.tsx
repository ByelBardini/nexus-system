import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StatusPedidoKey } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { STATUS_CONFIG } from "@/pages/pedidos/shared/pedidos-rastreador.types";

const COLUMN_VARIANT: Record<"default" | "config", string> = {
  default:
    "flex-1 min-w-[280px] flex flex-col h-full bg-slate-200/80 rounded border border-slate-200 p-3",
  config:
    "flex-1 min-w-[280px] flex flex-col h-full bg-slate-200/50 rounded-sm p-3",
};

type PedidosKanbanColumnShellProps = {
  status: StatusPedidoKey;
  count: number;
  variant?: "default" | "config";
  children: ReactNode;
};

/**
 * Envelope comum das colunas do Kanban (título, contador, área rolável).
 */
export function PedidosKanbanColumnShell({
  status,
  count,
  variant = "default",
  children,
}: PedidosKanbanColumnShellProps) {
  const config = STATUS_CONFIG[status];
  return (
    <div className={cn(COLUMN_VARIANT[variant], "min-h-0")}>
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={cn("w-2.5 h-2.5 rounded-full", config.dotColor)} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {config.label}
        </span>
        <span className="ml-auto text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
          {count}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
