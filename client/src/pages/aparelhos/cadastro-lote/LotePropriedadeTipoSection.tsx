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
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import { cn } from "@/lib/utils";
import type {
  ClienteLista,
  MarcaCatalog,
  MarcaModeloCatalog,
  MarcaSimcardRow,
  OperadoraCatalog,
} from "@/pages/aparelhos/shared/catalog.types";
import { LoteSimcardPlanoField } from "./LoteSimcardPlanoField";
import type { LoteFormValues } from "./schema";

type LotePropriedadeTipoSectionProps = {
  form: UseFormReturn<LoteFormValues>;
  clientes: ClienteLista[];
  marcasAtivas: MarcaCatalog[];
  operadorasAtivas: OperadoraCatalog[];
  modelosDisponiveis: MarcaModeloCatalog[];
  marcasSimcardFiltradas: MarcaSimcardRow[];
  watchTipo: LoteFormValues["tipo"];
  watchProprietario: LoteFormValues["proprietarioTipo"];
  watchMarca: string;
  watchOperadora: string;
  watchClienteId: number | null;
  watchMarcaSimcard: string | undefined;
};

export function LotePropriedadeTipoSection({
  form,
  clientes,
  marcasAtivas,
  operadorasAtivas,
  modelosDisponiveis,
  marcasSimcardFiltradas,
  watchTipo,
  watchProprietario,
  watchMarca,
  watchOperadora,
  watchClienteId,
  watchMarcaSimcard,
}: LotePropriedadeTipoSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
        <MaterialIcon name="business" className="text-erp-blue" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Propriedade e Tipo
        </h3>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          {watchTipo === "RASTREADOR" ? (
            <>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                  Pertence a
                </Label>
                <Controller
                  name="proprietarioTipo"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex rounded-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("INFINITY");
                          form.setValue("clienteId", null);
                        }}
                        className={cn(
                          "flex-1 py-2.5 px-4 text-xs font-bold uppercase border transition-all",
                          field.value === "INFINITY"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        Infinity
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("CLIENTE")}
                        className={cn(
                          "flex-1 py-2.5 px-4 text-xs font-bold uppercase border-t border-b border-r transition-all",
                          field.value === "CLIENTE"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        Cliente
                      </button>
                    </div>
                  )}
                />
              </div>
              {watchProprietario === "CLIENTE" && (
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    Cliente <span className="text-red-500">*</span>
                  </Label>
                  <SelectClienteSearch
                    clientes={clientes}
                    value={watchClienteId ?? undefined}
                    onChange={(id) =>
                      form.setValue("clienteId", id ?? null, {
                        shouldValidate: true,
                      })
                    }
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

        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            Tipo de Equipamento
          </Label>
          <Controller
            name="tipo"
            control={form.control}
            render={({ field }) => (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    field.onChange("RASTREADOR");
                    form.setValue("operadora", "");
                    form.setValue("marcaSimcard", "");
                    form.setValue("planoSimcard", "");
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-all",
                    field.value === "RASTREADOR"
                      ? "border-erp-blue bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <MaterialIcon
                    name="sensors"
                    className={cn(
                      "text-3xl",
                      field.value === "RASTREADOR"
                        ? "text-erp-blue"
                        : "text-slate-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-bold uppercase",
                      field.value === "RASTREADOR"
                        ? "text-blue-800"
                        : "text-slate-500",
                    )}
                  >
                    Rastreador
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.onChange("SIM");
                    form.setValue("marca", "");
                    form.setValue("modelo", "");
                    form.setValue("proprietarioTipo", "INFINITY");
                    form.setValue("clienteId", null);
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-all",
                    field.value === "SIM"
                      ? "border-erp-blue bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <MaterialIcon
                    name="sim_card"
                    className={cn(
                      "text-3xl",
                      field.value === "SIM"
                        ? "text-erp-blue"
                        : "text-slate-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-bold uppercase",
                      field.value === "SIM"
                        ? "text-blue-800"
                        : "text-slate-500",
                    )}
                  >
                    Simcard
                  </span>
                </button>
              </div>
            )}
          />
        </div>

        {watchTipo === "RASTREADOR" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Fabricante / Marca <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="marca"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("modelo", "");
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9",
                          fieldState.error && "border-red-500",
                        )}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {marcasAtivas.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.nome}
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
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="modelo"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchMarca}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9",
                          fieldState.error && "border-red-500",
                        )}
                      >
                        <SelectValue
                          placeholder={
                            watchMarca
                              ? "Selecione..."
                              : "Selecione o fabricante primeiro..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {modelosDisponiveis.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.nome}
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
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Operadora <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="operadora"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("marcaSimcard", "");
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9",
                          fieldState.error && "border-red-500",
                        )}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {operadorasAtivas.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.nome}
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
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Marca do Simcard
              </Label>
              <Controller
                name="marcaSimcard"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("planoSimcard", "");
                    }}
                    disabled={!watchOperadora}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={
                          watchOperadora
                            ? "Ex: Getrak, 1nce..."
                            : "Selecione operadora"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasSimcardFiltradas.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <LoteSimcardPlanoField
              form={form}
              marcasSimcardFiltradas={marcasSimcardFiltradas}
              watchMarcaSimcard={watchMarcaSimcard}
            />
          </div>
        )}
      </div>
    </div>
  );
}
