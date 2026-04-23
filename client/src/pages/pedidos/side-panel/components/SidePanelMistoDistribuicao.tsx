import type { PedidoRastreadorView } from "../../shared/pedidos-rastreador.types";

type Props = { pedido: PedidoRastreadorView };

export function SidePanelMistoDistribuicao({ pedido }: Props) {
  if (
    pedido.tipo !== "misto" ||
    !pedido.itensMisto ||
    pedido.itensMisto.length === 0
  ) {
    return null;
  }

  return (
    <div className="px-6 py-4 border-b border-slate-100">
      <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">
        Distribuição dos Itens
      </p>
      <div className="space-y-1">
        {pedido.itensMisto.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-slate-700">{item.label}</span>
            <span className="font-bold text-slate-800">
              {item.quantidade} un
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-xs font-bold">
        <span className="text-slate-500">Total</span>
        <span className="text-slate-800">{pedido.quantidade} un</span>
      </div>
    </div>
  );
}
