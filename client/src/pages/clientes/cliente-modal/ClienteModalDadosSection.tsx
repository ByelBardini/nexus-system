import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputCNPJ } from "@/components/InputCNPJ";
import { InputCor } from "@/components/InputCor";
import {
  STATUS_FORM_OPTIONS,
  TIPO_CONTRATO_SELECT_OPTIONS,
  type ClienteFormData,
} from "../shared/clientes-page.shared";

type Props = {
  form: UseFormReturn<ClienteFormData>;
};

export function ClienteModalDadosSection({ form }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
          01. Dados do Cliente
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Razão Social
          </label>
          <Input
            {...form.register("nome")}
            placeholder="Ex: Empresa ABC Ltda"
            className="h-9"
          />
          {form.formState.errors.nome && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.nome.message}
            </p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Nome Fantasia (opcional)
          </label>
          <Input
            {...form.register("nomeFantasia")}
            placeholder="Ex: Empresa ABC"
            className="h-9"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            CNPJ (opcional)
          </label>
          <Controller
            name="cnpj"
            control={form.control}
            render={({ field }) => (
              <InputCNPJ
                value={field.value ?? ""}
                onChange={field.onChange}
                className="h-9 font-mono"
              />
            )}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Tipo Contrato
          </label>
          <Controller
            name="tipoContrato"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_CONTRATO_SELECT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
          </label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FORM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="col-span-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Cor do Badge
          </label>
          <div className="flex items-center gap-3">
            <Controller
              name="cor"
              control={form.control}
              render={({ field }) => (
                <InputCor value={field.value} onChange={field.onChange} />
              )}
            />
            {form.watch("cor") && (
              <span
                className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: `${form.watch("cor")}22`,
                  color: form.watch("cor"),
                  borderColor: `${form.watch("cor")}55`,
                }}
              >
                {form.watch("nome") || "Preview"}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
