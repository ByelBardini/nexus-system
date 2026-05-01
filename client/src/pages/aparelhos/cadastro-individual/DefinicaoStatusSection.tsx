import { Controller, type UseFormReturn } from "react-hook-form";
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
import { DESTINOS_SWITCH, STATUS_CONFIG } from "./constants";
import type { FormDataCadastroIndividual } from "./schema";
import type { StatusAparelho } from "./constants";
import { useCategoriasFalhaAtivas } from "@/pages/aparelhos/shared/useCategoriasFalhaAtivas";

type DefinicaoStatusSectionProps = {
  form: UseFormReturn<FormDataCadastroIndividual>;
  statusDisponiveis: StatusAparelho[];
  watchStatus: string;
  canExcluir: boolean;
};

export function DefinicaoStatusSection({
  form,
  statusDisponiveis,
  watchStatus,
  canExcluir,
}: DefinicaoStatusSectionProps) {
  const categoriaFalha = form.watch("categoriaFalha");
  const destinoDefeito = form.watch("destinoDefeito");
  const { data: categorias = [] } = useCategoriasFalhaAtivas();
  const destinosDisponiveis = DESTINOS_SWITCH.filter(
    (d) => d.value !== "DESCARTADO" || canExcluir,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
        <MaterialIcon name="settings_suggest" className="text-erp-blue" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Definição de Status
        </h3>
      </div>
      <div className="space-y-6">
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <div className="flex gap-4">
              {statusDisponiveis.map((s) => {
                const config = STATUS_CONFIG[s];
                const isSelected = field.value === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => field.onChange(s)}
                    className={cn(
                      "flex-1 py-3 px-2 border rounded-sm flex flex-col items-center gap-1 transition-all cursor-pointer",
                      isSelected
                        ? cn(
                            config.borderColor,
                            config.bgColor,
                            "ring-1",
                            config.borderColor.replace("border-", "ring-"),
                          )
                        : "border-slate-200 bg-slate-50 opacity-60 hover:opacity-80",
                    )}
                  >
                    <MaterialIcon name={config.icon} className={config.color} />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        isSelected
                          ? config.color
                              .replace("text-", "text-")
                              .replace("600", "700")
                          : "text-slate-600",
                      )}
                    >
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />

        {watchStatus === "CANCELADO_DEFEITO" && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-sm grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-red-800 uppercase mb-3 flex items-center gap-2">
                <MaterialIcon name="report_problem" className="text-sm" />
                Detalhamento de Defeito Requerido
              </p>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Categoria de Falha
              </Label>
              <Controller
                name="categoriaFalha"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      const cat = categorias.find((c) => String(c.id) === val);
                      form.setValue(
                        "categoriaFalhaMotiva",
                        cat?.motivaTexto ?? false,
                      );
                    }}
                  >
                    <SelectTrigger className="h-9 border-red-200">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Destino Imediato
              </Label>
              <div className="flex gap-2 h-9">
                {destinosDisponiveis.map((d) => {
                  const isSelected = destinoDefeito === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => form.setValue("destinoDefeito", d.value)}
                      className={cn(
                        "flex-1 text-xs font-semibold rounded-sm border transition-all cursor-pointer",
                        isSelected
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-white border-red-200 text-slate-600 hover:bg-red-50",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {categoriaFalha && form.watch("categoriaFalhaMotiva") && (
              <div className="col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Motivo do Defeito
                </Label>
                <Controller
                  name="motivoDefeito"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <textarea
                        {...field}
                        rows={3}
                        placeholder="Descreva o motivo do defeito..."
                        className={cn(
                          "w-full rounded-sm border bg-white px-3 py-2 text-sm resize-none",
                          "placeholder:text-slate-400 focus:outline-none focus:ring-1",
                          fieldState.error
                            ? "border-red-500 focus:ring-red-500"
                            : "border-red-200 focus:ring-red-400",
                        )}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
