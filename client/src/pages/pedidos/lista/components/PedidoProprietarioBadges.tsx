import { cn } from "@/lib/utils";
import type { PedidoRastreadorView } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { PedidoMistoChips } from "./PedidoMistoChips";

type Props = {
  pedido: Pick<
    PedidoRastreadorView,
    "tipo" | "destinatario" | "itensMisto" | "clienteCor"
  >;
  className?: string;
};

export function PedidoProprietarioBadges({ pedido, className }: Props) {
  if (pedido.tipo === "misto" && pedido.itensMisto) {
    return <PedidoMistoChips itens={pedido.itensMisto} className={className} />;
  }

  const isInfinity = pedido.tipo === "tecnico";
  const cor = !isInfinity ? pedido.clienteCor : null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      <span
        className={cn(
          "text-[9px] font-bold px-1.5 py-0.5 rounded border",
          isInfinity
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : !cor && "bg-slate-50 text-slate-600 border-slate-200",
        )}
        style={
          cor
            ? {
                backgroundColor: `${cor}22`,
                color: cor,
                borderColor: `${cor}55`,
              }
            : undefined
        }
      >
        {isInfinity ? "Infinity" : pedido.destinatario}
      </span>
    </div>
  );
}
