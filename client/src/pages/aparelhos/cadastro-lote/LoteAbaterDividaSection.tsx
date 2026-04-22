import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import {
  type DebitoRastreadorApi,
  formatDebitoLabel,
} from "@/pages/aparelhos/shared/debito-rastreador";
import type { LoteFormValues } from "./schema";

type LoteAbaterDividaSectionProps = {
  form: UseFormReturn<LoteFormValues>;
  watchTipo: LoteFormValues["tipo"];
  watchAbaterDivida: boolean;
  watchAbaterDebitoId: number | null;
  debitosFiltrados: DebitoRastreadorApi[];
  selectedDebito: DebitoRastreadorApi | null;
  quantidadeFinal: number;
};

export function LoteAbaterDividaSection({
  form,
  watchTipo,
  watchAbaterDivida,
  watchAbaterDebitoId,
  debitosFiltrados,
  selectedDebito,
  quantidadeFinal,
}: LoteAbaterDividaSectionProps) {
  if (watchTipo !== "RASTREADOR" || debitosFiltrados.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MaterialIcon
            name="account_balance_wallet"
            className="text-amber-600"
          />
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Abater Dívida
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Parte deste lote como pagamento de débito existente
            </p>
          </div>
        </div>
        <Controller
          name="abaterDivida"
          control={form.control}
          render={({ field }) => (
            <button
              type="button"
              onClick={() => {
                field.onChange(!field.value);
                if (field.value) {
                  form.setValue("abaterDebitoId", null);
                  form.setValue("abaterQuantidade", null);
                }
              }}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                field.value ? "bg-amber-500" : "bg-slate-300",
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

      {watchAbaterDivida && (
        <div className="space-y-4">
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Débito a Abater <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="abaterDebitoId"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => {
                      field.onChange(Number(v));
                      form.setValue("abaterQuantidade", null);
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9",
                        fieldState.error && "border-red-500",
                      )}
                    >
                      <SelectValue placeholder="Selecione o débito..." />
                    </SelectTrigger>
                    <SelectContent>
                      {debitosFiltrados.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {formatDebitoLabel(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-[10px] text-red-600 mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {watchAbaterDebitoId && selectedDebito && (
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Quantidade a Abater{" "}
                <span className="text-slate-400 normal-case font-normal">
                  (máx:{" "}
                  {Math.min(
                    selectedDebito.quantidade,
                    quantidadeFinal || 9999,
                  )}
                  )
                </span>{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="abaterQuantidade"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      type="number"
                      min={1}
                      max={Math.min(
                        selectedDebito.quantidade,
                        quantidadeFinal || 9999,
                      )}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        field.onChange(Number.isNaN(v) ? null : v);
                      }}
                      placeholder="0"
                      className={cn(
                        "h-9 w-40",
                        fieldState.error && "border-red-500",
                      )}
                    />
                    {fieldState.error && (
                      <p className="text-[10px] text-red-600 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                    {field.value && field.value > 0 && (
                      <p className="text-[10px] text-amber-700 mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        {field.value} unidade(s) serão vinculadas ao credor:{" "}
                        <strong>
                          {selectedDebito.credorCliente?.nome ?? "Infinity"}
                        </strong>
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
