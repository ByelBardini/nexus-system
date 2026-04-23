import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormNovoPedido } from "../novo-pedido-rastreador.schema";

type Marca = { id: number; nome: string };
type Modelo = { id: number; nome: string; marcaId: number };
type Operadora = { id: number; nome: string };

type NovoPedidoMarcaModeloOperadoraBlockProps = {
  control: Control<FormNovoPedido>;
  setValue: UseFormSetValue<FormNovoPedido>;
  marcaModeloEspecifico: boolean | undefined;
  operadoraEspecifica: boolean | undefined;
  marcaEquipamentoId: number | undefined;
  marcas: Marca[];
  modelosFiltrados: Modelo[];
  operadoras: Operadora[];
};

export function NovoPedidoMarcaModeloOperadoraBlock({
  control,
  setValue,
  marcaModeloEspecifico,
  operadoraEspecifica,
  marcaEquipamentoId,
  marcas,
  modelosFiltrados,
  operadoras,
}: NovoPedidoMarcaModeloOperadoraBlockProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Controller
          name="marcaModeloEspecifico"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="marcaModeloEspecifico"
              checked={field.value ?? false}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (!checked) {
                  setValue("marcaEquipamentoId", undefined);
                  setValue("modeloEquipamentoId", undefined);
                }
              }}
            />
          )}
        />
        <Label
          htmlFor="marcaModeloEspecifico"
          className="text-xs font-medium cursor-pointer"
        >
          Marca/modelo específico
        </Label>
      </div>
      {marcaModeloEspecifico && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
              Marca
            </Label>
            <Controller
              name="marcaEquipamentoId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => {
                    field.onChange(v ? +v : undefined);
                    setValue("modeloEquipamentoId", undefined);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
              Modelo
            </Label>
            <Controller
              name="modeloEquipamentoId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(v ? +v : undefined)}
                  disabled={!marcaEquipamentoId}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelosFiltrados.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Controller
          name="operadoraEspecifica"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="operadoraEspecifica"
              checked={field.value ?? false}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (!checked) setValue("operadoraId", undefined);
              }}
            />
          )}
        />
        <Label
          htmlFor="operadoraEspecifica"
          className="text-xs font-medium cursor-pointer"
        >
          Operadora específica
        </Label>
      </div>
      {operadoraEspecifica && (
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
            Operadora
          </Label>
          <Controller
            name="operadoraId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v ? +v : undefined)}
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Selecione a operadora" />
                </SelectTrigger>
                <SelectContent>
                  {operadoras.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}
    </div>
  );
}
