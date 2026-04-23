import { Trash2 } from "lucide-react";
import { Controller, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import type { FieldArrayWithId } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { filterModelosPorMarca } from "../novo-pedido-rastreador.utils";
import type { FormNovoPedido } from "../novo-pedido-rastreador.schema";
import type { ClienteComSubclientes } from "../novo-pedido-rastreador.utils";

type Marca = { id: number; nome: string };
type Modelo = { id: number; nome: string; marcaId: number };
type Operadora = { id: number; nome: string };

export type NovoPedidoMistoItemProps = {
  control: Control<FormNovoPedido>;
  setValue: UseFormSetValue<FormNovoPedido>;
  field: FieldArrayWithId<FormNovoPedido, "itensMisto", "id">;
  index: number;
  removeItem: (index: number) => void;
  itensMistoFieldsLength: number;
  modelosRaw: Modelo[];
  marcas: Marca[];
  operadoras: Operadora[];
  clientes: ClienteComSubclientes[];
  loadingClientes: boolean;
  itensMistoValues: FormNovoPedido["itensMisto"];
  marcaModeloEspecifico: boolean | undefined;
  operadoraEspecifica: boolean | undefined;
};

export function NovoPedidoMistoItem({
  control,
  setValue,
  field,
  index,
  removeItem,
  itensMistoFieldsLength,
  modelosRaw,
  marcas,
  operadoras,
  clientes,
  loadingClientes,
  itensMistoValues,
  marcaModeloEspecifico,
  operadoraEspecifica,
}: NovoPedidoMistoItemProps) {
  const itemProprietario = useWatch({
    control,
    name: `itensMisto.${index}.proprietario`,
  });
  const itemMarcaId = useWatch({
    control,
    name: `itensMisto.${index}.marcaEquipamentoId`,
  });
  const itemMarcaModelo = useWatch({
    control,
    name: `itensMisto.${index}.marcaModeloEspecifico`,
  });
  const itemOperadora = useWatch({
    control,
    name: `itensMisto.${index}.operadoraEspecifica`,
  });

  const modelosFiltradosItem = itemMarcaId
    ? filterModelosPorMarca(modelosRaw, itemMarcaId)
    : modelosRaw;

  const infinityTaken = (itensMistoValues ?? []).some(
    (item, i) => i !== index && item.proprietario === "INFINITY",
  );

  const clientesJaUsados = new Set(
    (itensMistoValues ?? [])
      .filter((item, i) => i !== index && item.proprietario === "CLIENTE")
      .map((item) => item.clienteId)
      .filter((id): id is number => id != null),
  );

  const clientesDisponiveis = clientes.filter(
    (c) => !clientesJaUsados.has(c.id),
  );

  return (
    <div
      className="border border-slate-200 rounded p-3 space-y-3 bg-slate-50"
      data-misto-item
      data-misto-id={field.id}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded overflow-hidden flex-1">
          <button
            type="button"
            onClick={() =>
              setValue(`itensMisto.${index}.proprietario`, "INFINITY")
            }
            disabled={infinityTaken && itemProprietario !== "INFINITY"}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-slate-200 transition-all",
              itemProprietario === "INFINITY"
                ? "bg-erp-blue text-white border-erp-blue"
                : infinityTaken
                  ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                  : "bg-white text-slate-500 hover:bg-slate-50",
            )}
          >
            Infinity
          </button>
          <button
            type="button"
            onClick={() =>
              setValue(`itensMisto.${index}.proprietario`, "CLIENTE")
            }
            className={cn(
              "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-slate-200 transition-all",
              itemProprietario === "CLIENTE"
                ? "bg-erp-blue text-white border-erp-blue"
                : "bg-white text-slate-500 hover:bg-slate-50",
            )}
          >
            Cliente
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeItem(index)}
          disabled={itensMistoFieldsLength <= 1}
          className="text-slate-400 hover:text-red-500 disabled:opacity-30"
          aria-label="Remover item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {itemProprietario === "CLIENTE" && (
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
            Cliente
          </Label>
          <Controller
            name={`itensMisto.${index}.clienteId`}
            control={control}
            render={({ field: f }) => (
              <Select
                value={f.value ? `cliente-${f.value}` : ""}
                onValueChange={(v) => {
                  if (v.startsWith("cliente-")) {
                    f.onChange(
                      parseInt(v.replace("cliente-", ""), 10),
                    );
                  }
                }}
                disabled={loadingClientes}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesDisponiveis.map((c) => (
                    <SelectItem key={c.id} value={`cliente-${c.id}`}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
            Quantidade
          </Label>
          <Controller
            name={`itensMisto.${index}.quantidade`}
            control={control}
            render={({ field: f }) => (
              <Input
                type="number"
                min={1}
                className="h-9 text-xs"
                value={f.value}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  f.onChange(Number.isNaN(v) ? 1 : Math.max(1, v));
                }}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        {marcaModeloEspecifico ? (
          <div className="flex items-center gap-2 opacity-60">
            <Checkbox checked disabled />
            <span className="text-xs font-medium text-slate-500">
              Marca/modelo do pedido aplicado
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Controller
                name={`itensMisto.${index}.marcaModeloEspecifico`}
                control={control}
                render={({ field: f }) => (
                  <Checkbox
                    checked={f.value ?? false}
                    onCheckedChange={(checked) => {
                      f.onChange(checked);
                      if (!checked) {
                        setValue(
                          `itensMisto.${index}.marcaEquipamentoId`,
                          undefined,
                        );
                        setValue(
                          `itensMisto.${index}.modeloEquipamentoId`,
                          undefined,
                        );
                      }
                    }}
                  />
                )}
              />
              <span className="text-xs font-medium">Marca/modelo específico</span>
            </div>
            {itemMarcaModelo && (
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  name={`itensMisto.${index}.marcaEquipamentoId`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      value={f.value ? String(f.value) : ""}
                      onValueChange={(v) => {
                        f.onChange(v ? +v : undefined);
                        setValue(
                          `itensMisto.${index}.modeloEquipamentoId`,
                          undefined,
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Marca" />
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
                <Controller
                  name={`itensMisto.${index}.modeloEquipamentoId`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      value={f.value ? String(f.value) : ""}
                      onValueChange={(v) => f.onChange(v ? +v : undefined)}
                      disabled={!itemMarcaId}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelosFiltradosItem.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </>
        )}

        {operadoraEspecifica ? (
          <div className="flex items-center gap-2 opacity-60">
            <Checkbox checked disabled />
            <span className="text-xs font-medium text-slate-500">
              Operadora do pedido aplicada
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Controller
                name={`itensMisto.${index}.operadoraEspecifica`}
                control={control}
                render={({ field: f }) => (
                  <Checkbox
                    checked={f.value ?? false}
                    onCheckedChange={(checked) => {
                      f.onChange(checked);
                      if (!checked) {
                        setValue(
                          `itensMisto.${index}.operadoraId`,
                          undefined,
                        );
                      }
                    }}
                  />
                )}
              />
              <span className="text-xs font-medium">Operadora específica</span>
            </div>
            {itemOperadora && (
              <Controller
                name={`itensMisto.${index}.operadoraId`}
                control={control}
                render={({ field: f }) => (
                  <Select
                    value={f.value ? String(f.value) : ""}
                    onValueChange={(v) => f.onChange(v ? +v : undefined)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Operadora" />
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
