import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputPreco } from "@/components/InputPreco";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LoteFormValues } from "./schema";

type LoteValoresSectionProps = {
  form: UseFormReturn<LoteFormValues>;
  valorTotal: number;
};

export function LoteValoresSection({
  form,
  valorTotal,
}: LoteValoresSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
        <MaterialIcon name="payments" className="text-erp-blue" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Valores Financeiros
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Valor Unitário (R$) <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="valorUnitario"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  R$
                </span>
                <InputPreco
                  value={field.value}
                  onChange={field.onChange}
                  className={cn(
                    "h-9 pl-10 text-right font-mono",
                    fieldState.error && "border-red-500",
                  )}
                />
                {fieldState.error && (
                  <p className="text-[10px] text-red-600 mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Valor Total do Lote
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
              R$
            </span>
            <Input
              readOnly
              value={formatarMoeda(valorTotal).replace("R$", "").trim()}
              className="h-9 pl-10 text-right font-mono bg-slate-50 border-slate-200 font-bold text-slate-800"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 italic">
            Calculado automaticamente (Unitário x Qtd)
          </p>
        </div>
      </div>
    </div>
  );
}
