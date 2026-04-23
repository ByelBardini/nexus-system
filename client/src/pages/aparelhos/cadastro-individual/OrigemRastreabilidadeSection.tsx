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
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import { cn } from "@/lib/utils";
import type { ClienteLista } from "@/pages/aparelhos/shared/catalog.types";
import { ORIGENS } from "./constants";
import type { FormDataCadastroIndividual } from "./schema";
import type { OrigemItem } from "./constants";

type OrigemRastreabilidadeSectionProps = {
  form: UseFormReturn<FormDataCadastroIndividual>;
  clientes: ClienteLista[];
  watchOrigem: string;
  watchTipo: "RASTREADOR" | "SIM";
  watchProprietario: "INFINITY" | "CLIENTE";
};

export function OrigemRastreabilidadeSection({
  form,
  clientes,
  watchOrigem,
  watchTipo,
  watchProprietario,
}: OrigemRastreabilidadeSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
        <MaterialIcon name="history_edu" className="text-erp-blue" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Origem e Rastreabilidade
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Origem do Item <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="origem"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v: OrigemItem) => {
                  field.onChange(v);
                  form.setValue("proprietario", "INFINITY");
                  form.setValue("clienteId", null);
                  form.setValue("notaFiscal", "");
                  const currentStatus = form.getValues("status");
                  if (v === "COMPRA_AVULSA" && currentStatus !== "NOVO_OK")
                    form.setValue("status", "NOVO_OK");
                  if (
                    (v === "RETIRADA_CLIENTE" || v === "DEVOLUCAO_TECNICO") &&
                    currentStatus === "NOVO_OK"
                  )
                    form.setValue("status", "EM_MANUTENCAO");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-4">
          {watchOrigem === "COMPRA_AVULSA" && (
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Número da Nota Fiscal
              </Label>
              <Controller
                name="notaFiscal"
                control={form.control}
                render={({ field }) => (
                  <div className="relative">
                    <MaterialIcon
                      name="receipt_long"
                      className="absolute left-3 top-2.5 text-slate-400 text-lg"
                    />
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Ex: NF-0001234..."
                      className="h-9 pl-10"
                    />
                  </div>
                )}
              />
            </div>
          )}
        </div>

        <div className="col-span-2">
          {watchTipo === "RASTREADOR" ? (
            <>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Vinculação / Destino <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="proprietario"
                control={form.control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange("INFINITY");
                        form.setValue("clienteId", null);
                      }}
                      className={cn(
                        "flex-1 h-9 flex items-center justify-center gap-2 border rounded-sm text-sm font-medium transition-all",
                        field.value === "INFINITY"
                          ? "border-erp-blue bg-blue-50 text-erp-blue"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      <MaterialIcon name="business" className="text-sm" />
                      Infinity
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("CLIENTE")}
                      className={cn(
                        "flex-1 h-9 flex items-center justify-center gap-2 border rounded-sm text-sm font-medium transition-all",
                        field.value === "CLIENTE"
                          ? "border-erp-blue bg-blue-50 text-erp-blue"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      <MaterialIcon name="person" className="text-sm" />
                      Cliente
                    </button>
                  </div>
                )}
              />
              {watchProprietario === "CLIENTE" && (
                <div className="mt-2">
                  <Controller
                    name="clienteId"
                    control={form.control}
                    render={({ field }) => (
                      <SelectClienteSearch
                        clientes={clientes}
                        value={field.value ?? undefined}
                        onChange={(id) => field.onChange(id ?? null)}
                        placeholder="Digite para pesquisar cliente..."
                      />
                    )}
                  />
                  {form.formState.errors.clienteId && (
                    <p className="text-[10px] text-red-600 mt-1">
                      {form.formState.errors.clienteId.message}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <MaterialIcon name="info" className="text-slate-400 text-sm" />
              <span className="text-xs text-slate-500">
                Simcards são sempre registrados no estoque da Infinity
              </span>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Observações de Recebimento
          </Label>
          <Controller
            name="observacoes"
            control={form.control}
            render={({ field }) => (
              <textarea
                {...field}
                value={field.value ?? ""}
                placeholder="Detalhes adicionais sobre o estado físico ou motivo da entrada..."
                className="w-full h-20 p-3 bg-slate-50 border border-slate-300 rounded-sm text-sm focus:bg-white focus:ring-2 focus:ring-erp-blue focus:border-erp-blue transition-all resize-none"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
