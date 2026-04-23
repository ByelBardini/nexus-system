import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatarDataCurta } from "@/lib/format";
import type { PedidoRastreadorView } from "../../shared/pedidos-rastreador.types";
import { getUrgenciaBadgeClass } from "../../shared/pedidos-urgencia-ui";

type Props = { pedido: PedidoRastreadorView };

export function SidePanelHeader({ pedido }: Props) {
  return (
    <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pedido em Foco
          </span>
          {pedido.urgencia && (
            <span
              className={cn(
                "text-[9px] font-bold uppercase px-2 py-0.5 rounded border",
                getUrgenciaBadgeClass(pedido.urgencia),
              )}
            >
              {pedido.urgencia}
            </span>
          )}
        </div>
        <SheetTitle className="text-xl font-bold text-slate-900">
          {pedido.codigo}
        </SheetTitle>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-slate-500 mb-1">Destinatário</p>
          <p className="font-semibold">{pedido.destinatario}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-slate-400">
              {pedido.tipo === "cliente" ? "Cliente" : "Técnico"}
            </p>
            {pedido.tipo === "misto" && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                Misto
              </span>
            )}
          </div>
          {pedido.cidadeEstado && (
            <p className="text-slate-500 text-[11px] mt-0.5">
              {pedido.cidadeEstado}
            </p>
          )}
        </div>
        <div>
          <p className="text-slate-500 mb-1">Solicitação</p>
          <p className="font-semibold">
            {pedido.dataSolicitacao
              ? formatarDataCurta(pedido.dataSolicitacao)
              : "-"}
          </p>
        </div>
        {(pedido.endereco || pedido.cpfCnpj) && (
          <div className="col-span-2 space-y-2">
            {pedido.endereco && (
              <div>
                <p className="text-slate-500 mb-1">Endereço</p>
                <p className="font-medium text-slate-700">{pedido.endereco}</p>
              </div>
            )}
            {pedido.cpfCnpj && (
              <div>
                <p className="text-slate-500 mb-1">CPF/CNPJ</p>
                <p className="font-medium text-slate-700">{pedido.cpfCnpj}</p>
              </div>
            )}
          </div>
        )}
        {(pedido.marcaModelo || pedido.operadora) && (
          <div className="col-span-2 p-3 bg-white border border-slate-200 rounded-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
              Requisitos de Hardware
            </p>
            <div className="flex flex-wrap gap-2">
              {pedido.marcaModelo && (
                <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-medium text-slate-700">
                  {pedido.marcaModelo}
                </span>
              )}
              {pedido.operadora && (
                <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-medium text-slate-700">
                  Operadora: {pedido.operadora}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </SheetHeader>
  );
}
