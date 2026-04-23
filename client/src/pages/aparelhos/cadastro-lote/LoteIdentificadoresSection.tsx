import { Controller, type UseFormReturn } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { LoteIdValidation } from "./validate-lote-ids";
import type { LoteFormValues } from "./schema";

type LoteIdentificadoresSectionProps = {
  form: UseFormReturn<LoteFormValues>;
  watchTipo: LoteFormValues["tipo"];
  watchDefinirIds: boolean;
  watchIdsTexto: string;
  idValidation: LoteIdValidation;
  erroQuantidade: string | null;
};

export function LoteIdentificadoresSection({
  form,
  watchTipo,
  watchDefinirIds,
  watchIdsTexto,
  idValidation,
  erroQuantidade,
}: LoteIdentificadoresSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MaterialIcon name="barcode_reader" className="text-erp-blue" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Identificadores ({watchTipo === "RASTREADOR" ? "IMEI" : "ICCID"})
          </h3>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-sm border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Definir IDs agora?
          </span>
          <Controller
            name="definirIds"
            control={form.control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-colors",
                  field.value ? "bg-erp-blue" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    field.value ? "right-1" : "left-1",
                  )}
                />
              </button>
            )}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="w-1/3">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Quantidade <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="quantidade"
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="0"
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

        {watchDefinirIds && (
          <>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Colar IDs (Um por linha ou separados por vírgula)
              </Label>
              <Controller
                name="idsTexto"
                control={form.control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder={`Cole os ${watchTipo === "RASTREADOR" ? "IMEIs" : "ICCIDs"} aqui...`}
                    className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-sm font-mono text-sm focus:bg-white focus:ring-2 focus:ring-erp-blue focus:border-erp-blue transition-all resize-none"
                  />
                )}
              />
            </div>

            {watchIdsTexto.trim() && (
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-600 uppercase">
                    <span className="text-slate-900">
                      {idValidation.validos.length}
                    </span>{" "}
                    Válidos
                  </span>
                </div>
                {idValidation.duplicados.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      <span className="text-slate-900">
                        {idValidation.duplicados.length}
                      </span>{" "}
                      Duplicados
                    </span>
                  </div>
                )}
                {idValidation.invalidos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      <span className="text-slate-900">
                        {idValidation.invalidos.length}
                      </span>{" "}
                      Inválidos
                    </span>
                  </div>
                )}
                {idValidation.jaExistentes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      <span className="text-slate-900">
                        {idValidation.jaExistentes.length}
                      </span>{" "}
                      Já cadastrados
                    </span>
                  </div>
                )}
              </div>
            )}

            {erroQuantidade && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{erroQuantidade}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
