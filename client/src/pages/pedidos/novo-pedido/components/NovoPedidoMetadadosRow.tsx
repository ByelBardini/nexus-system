import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormNovoPedido } from "../novo-pedido-rastreador.schema";

type NovoPedidoMetadadosRowProps = {
  control: Control<FormNovoPedido>;
  nomeUsuario: string | undefined;
};

export function NovoPedidoMetadadosRow({
  control,
  nomeUsuario,
}: NovoPedidoMetadadosRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
          Nº do Pedido
        </Label>
        <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-600 font-medium">
          Será gerado
        </div>
      </div>
      <div>
        <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
          Data do Pedido <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="dataSolicitacao"
          control={control}
          render={({ field }) => (
            <Input type="date" className="h-9 text-xs" {...field} />
          )}
        />
      </div>
      <div>
        <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
          Criado por
        </Label>
        <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-600 font-medium truncate">
          {nomeUsuario ?? "-"}
        </div>
      </div>
    </div>
  );
}
