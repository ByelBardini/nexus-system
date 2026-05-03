import { Fragment } from "react";
import { Plus } from "lucide-react";
import {
  Controller,
  type UseFieldArrayAppend,
  type UseFormReturn,
} from "react-hook-form";
import type { FieldArrayWithId } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SelectTecnicoSearch } from "@/components/SelectTecnicoSearch";
import { cn } from "@/lib/utils";
import type { TecnicoResumo } from "../../shared/pedidos-rastreador.types";
import type { FormNovoPedido } from "../novo-pedido-rastreador.schema";
import {
  getDestinatarioDisplayNome,
  type ClienteComSubclientes,
  type OpcaoDestinoCliente,
} from "../novo-pedido-rastreador.utils";
import { NovoPedidoMistoItem } from "./NovoPedidoMistoItem";

type NovoPedidoDestinoSectionProps = {
  form: UseFormReturn<FormNovoPedido>;
  tecnicos: TecnicoResumo[];
  loadingTecnicos: boolean;
  clientes: ClienteComSubclientes[];
  loadingClientes: boolean;
  opcoesCliente: OpcaoDestinoCliente[];
  itensMistoFields: FieldArrayWithId<FormNovoPedido, "itensMisto", "id">[];
  appendItem: UseFieldArrayAppend<FormNovoPedido, "itensMisto">;
  removeItem: (index: number) => void;
  modelosRaw: { id: number; nome: string; marcaId: number }[];
  marcas: { id: number; nome: string }[];
  operadoras: { id: number; nome: string }[];
  tipoDestino: FormNovoPedido["tipoDestino"];
  deCliente: boolean | undefined;
  destinatarioSelecionado: unknown;
  cidadeDisplay: string | null;
  filialDisplay: string | null;
  marcaModeloEspecifico: boolean | undefined;
  operadoraEspecifica: boolean | undefined;
  itensMistoValues: FormNovoPedido["itensMisto"];
};

export function NovoPedidoDestinoSection({
  form,
  tecnicos,
  loadingTecnicos,
  clientes,
  loadingClientes,
  opcoesCliente,
  itensMistoFields,
  appendItem,
  removeItem,
  modelosRaw,
  marcas,
  operadoras,
  tipoDestino,
  deCliente,
  destinatarioSelecionado,
  cidadeDisplay,
  filialDisplay,
  marcaModeloEspecifico,
  operadoraEspecifica,
  itensMistoValues,
}: NovoPedidoDestinoSectionProps) {
  const { control, setValue, formState } = form;
  const nomeDestinatario = getDestinatarioDisplayNome(destinatarioSelecionado);

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest border-l-4 border-erp-blue pl-2">
        Informações de Destino
      </h3>
      <div className="flex rounded overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setValue("tipoDestino", "TECNICO");
            setValue("tecnicoId", undefined);
            setValue("destinoCliente", undefined);
            setValue("deCliente", false);
            setValue("deClienteId", undefined);
          }}
          className={cn(
            "flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-all",
            tipoDestino === "TECNICO" || tipoDestino === "MISTO"
              ? "bg-erp-blue text-white border-erp-blue"
              : "bg-white text-slate-500 hover:bg-slate-50",
          )}
        >
          Técnico
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("tipoDestino", "CLIENTE");
            setValue("tecnicoId", undefined);
            setValue("destinoCliente", "");
            setValue("itensMisto", [
              { proprietario: "INFINITY", quantidade: 0 },
            ]);
          }}
          className={cn(
            "flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-all",
            tipoDestino === "CLIENTE"
              ? "bg-erp-blue text-white border-erp-blue"
              : "bg-white text-slate-500 hover:bg-slate-50",
          )}
        >
          Cliente
        </button>
      </div>

      {(tipoDestino === "TECNICO" || tipoDestino === "MISTO") && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="pedidoMisto"
            checked={tipoDestino === "MISTO"}
            onCheckedChange={(checked) => {
              setValue("tipoDestino", checked ? "MISTO" : "TECNICO");
              if (!checked) {
                setValue("itensMisto", [
                  { proprietario: "INFINITY", quantidade: 0 },
                ]);
              }
            }}
          />
          <Label
            htmlFor="pedidoMisto"
            className="text-xs font-medium cursor-pointer"
          >
            Pedido misto (múltiplos proprietários para o mesmo técnico)
          </Label>
        </div>
      )}

      <div>
        <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
          Pesquisar Destinatário
        </Label>
        {tipoDestino !== "CLIENTE" ? (
          <Fragment key="busca-destinatario-tecnico">
            <Controller
              name="tecnicoId"
              control={control}
              render={({ field }) => (
                <SelectTecnicoSearch
                  tecnicos={tecnicos}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={loadingTecnicos}
                />
              )}
            />
          </Fragment>
        ) : (
          <Fragment key="busca-destinatario-cliente">
            <Controller
              name="destinoCliente"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                  />
                  <Select
                    value={String(field.value ?? "")}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    disabled={loadingClientes}
                  >
                    <SelectTrigger className="pl-9 h-9 text-xs">
                      <SelectValue placeholder="Selecione o destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesCliente.map((o) => (
                        <SelectItem
                          key={`${o.tipo}-${o.id}`}
                          value={`${o.tipo}-${o.id}`}
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </Fragment>
        )}
        {(formState.errors.tecnicoId ??
          formState.errors.destinoCliente ??
          formState.errors.root) && (
          <p className="text-xs text-destructive mt-1">
            {(
              formState.errors.tecnicoId ??
              formState.errors.destinoCliente ??
              formState.errors.root
            )?.message ?? "Selecione o destinatário"}
          </p>
        )}
      </div>

      {destinatarioSelecionado != null && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-start gap-4">
          <div className="bg-blue-100 text-blue-600 p-2 rounded shrink-0">
            <MaterialIcon
              name={tipoDestino === "CLIENTE" ? "business" : "engineering"}
              className="text-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 mb-0.5">
              {nomeDestinatario ?? "—"}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              {cidadeDisplay && (
                <span className="flex items-center gap-1">
                  <MaterialIcon name="location_on" className="text-[14px]" />
                  {cidadeDisplay}
                </span>
              )}
              {filialDisplay && (
                <span className="flex items-center gap-1">
                  <MaterialIcon name="apartment" className="text-[14px]" />
                  {filialDisplay}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tipoDestino === "TECNICO" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Controller
              name="deCliente"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="deCliente"
                  checked={field.value ?? false}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) setValue("deClienteId", undefined);
                  }}
                />
              )}
            />
            <Label
              htmlFor="deCliente"
              className="text-xs font-medium cursor-pointer"
            >
              De Cliente (cliente enviando rastreadores para o técnico)
            </Label>
          </div>
          {deCliente && (
            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                Cliente remetente
              </Label>
              <Controller
                name="deClienteId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(v ? +v : undefined)}
                    disabled={loadingClientes}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </div>
      )}

      {tipoDestino === "MISTO" && (
        <div className="space-y-3">
          {itensMistoFields.map((field, index) => (
            <NovoPedidoMistoItem
              key={field.id}
              control={control}
              setValue={setValue}
              field={field}
              index={index}
              removeItem={removeItem}
              itensMistoFieldsLength={itensMistoFields.length}
              modelosRaw={modelosRaw}
              marcas={marcas}
              operadoras={operadoras}
              clientes={clientes}
              loadingClientes={loadingClientes}
              itensMistoValues={itensMistoValues}
              marcaModeloEspecifico={marcaModeloEspecifico}
              operadoraEspecifica={operadoraEspecifica}
            />
          ))}

          <button
            type="button"
            onClick={() => {
              const infinityTomado = (itensMistoValues ?? []).some(
                (i) => i.proprietario === "INFINITY",
              );
              appendItem({
                proprietario: infinityTomado ? "CLIENTE" : "INFINITY",
                quantidade: 0,
              });
            }}
            className="w-full py-2 text-xs font-bold text-erp-blue border border-dashed border-erp-blue rounded hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Destino
          </button>
        </div>
      )}

      <div
        className={cn(
          "grid gap-4 w-full",
          tipoDestino !== "MISTO" ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {tipoDestino !== "MISTO" && (
          <div>
            <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
              Quantidade <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Controller
                name="quantidade"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="h-9 text-xs flex-1"
                    value={field.value ? String(field.value) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      field.onChange(raw === "" ? 0 : parseInt(raw, 10));
                    }}
                  />
                )}
              />
              <span className="text-[11px] font-bold text-slate-500 shrink-0">
                Unidades
              </span>
            </div>
          </div>
        )}
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
            Urgência
          </Label>
          <Controller
            name="urgencia"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? "MEDIA"}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      {formState.errors.quantidade && (
        <p className="text-xs text-destructive">
          {formState.errors.quantidade.message}
        </p>
      )}
      {formState.errors.dataSolicitacao && (
        <p className="text-xs text-destructive">
          {formState.errors.dataSolicitacao.message}
        </p>
      )}
    </div>
  );
}
