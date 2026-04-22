import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { LoteFormValues } from "./schema";

type LoteIdentificacaoSectionProps = {
  form: UseFormReturn<LoteFormValues>;
};

export function LoteIdentificacaoSection({ form }: LoteIdentificacaoSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
        <MaterialIcon name="tag" className="text-erp-blue" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Identificação do Lote
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Referência do Lote <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="referencia"
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="Ex: LT-2026-001"
                  className={cn("h-9", fieldState.error && "border-red-500")}
                />
                {fieldState.error && (
                  <p className="text-[10px] text-red-600 mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Nº Nota Fiscal
          </Label>
          <Controller
            name="notaFiscal"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Ex: 123456"
                className="h-9"
              />
            )}
          />
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Data de Chegada
          </Label>
          <Controller
            name="dataChegada"
            control={form.control}
            render={({ field }) => (
              <Input type="date" {...field} className="h-9" />
            )}
          />
        </div>
      </div>
    </div>
  );
}
