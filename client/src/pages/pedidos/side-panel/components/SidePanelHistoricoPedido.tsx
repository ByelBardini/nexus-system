import { cn } from "@/lib/utils";
import type { PedidoRastreadorView } from "../../shared/pedidos-rastreador.types";

type Props = { historico: NonNullable<PedidoRastreadorView["historico"]> };

export function SidePanelHistoricoPedido({ historico }: Props) {
  if (!historico.length) return null;

  return (
    <div className="p-6 border-t border-slate-100">
      <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">
        Histórico do Pedido
      </h3>
      <div className="text-[11px]">
        {historico.map((item, idx) => (
          <div
            key={idx}
            className="relative pl-6 pb-4 border-l border-slate-200 last:border-0"
          >
            <div
              className={cn(
                "absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white",
                item.concluido ? "bg-erp-blue" : "bg-slate-300",
              )}
            />
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-800">{item.titulo}</span>
            </div>
            <p className="text-slate-500">{item.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
