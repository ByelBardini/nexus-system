import { Controller, type UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputPlaca } from "@/components/InputPlaca";
import { MaterialIcon } from "@/components/MaterialIcon";
import { VEICULO_TIPOS, veiculoTipoIconMap } from "../ordens-servico-criacao.constants";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";

type Props = {
  form: UseFormReturn<CriacaoOsFormData>;
  consultaPlacaLoading: boolean;
};

export function OrdensServicoCriacaoVeiculoSection({
  form,
  consultaPlacaLoading,
}: Props) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon
          name="local_shipping"
          className="text-slate-400 text-lg"
        />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          Veículo
        </h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2 relative">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Placa
            </Label>
            <Controller
              name="veiculoPlaca"
              control={form.control}
              render={({ field }) => (
                <InputPlaca
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="ABC-1D23"
                />
              )}
            />
            {consultaPlacaLoading && (
              <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Marca
            </Label>
            <Input
              {...form.register("veiculoMarca")}
              placeholder="Marca"
              className="h-9"
              autoComplete="off"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Modelo
            </Label>
            <Input
              {...form.register("veiculoModelo")}
              placeholder="Modelo"
              className="h-9"
              autoComplete="off"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Ano
            </Label>
            <Input
              {...form.register("veiculoAno")}
              placeholder="Ano"
              className="h-9"
              autoComplete="off"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Cor
            </Label>
            <Input
              {...form.register("veiculoCor")}
              placeholder="Cor"
              className="h-9"
              autoComplete="off"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Tipo
            </Label>
            <Controller
              name="veiculoTipo"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(v) => field.onChange(v || "")}
                >
                  <SelectTrigger className="h-9 flex items-center gap-2">
                    {field.value && (
                      <MaterialIcon
                        name={
                          veiculoTipoIconMap[
                            field.value.toUpperCase()
                          ] ?? "directions_car"
                        }
                        className="text-slate-500 text-lg shrink-0"
                      />
                    )}
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEICULO_TIPOS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
