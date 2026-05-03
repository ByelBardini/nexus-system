import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { InputCPFCNPJ } from "@/components/InputCPFCNPJ";
import { InputTelefone } from "@/components/InputTelefone";
import { SelectUF } from "@/components/SelectUF";
import { SelectCidade } from "@/components/SelectCidade";
import { cn } from "@/lib/utils";
import type { Municipio, UF } from "@/hooks/useBrasilAPI";
import type { TecnicoFormData } from "../../lib/tecnico-form";

type Props = {
  form: UseFormReturn<TecnicoFormData>;
  ufs: UF[];
  municipios: Municipio[];
  estadoAtuacao: string;
};

export function TecnicoFormBasicsSection({
  form,
  ufs,
  municipios,
  estadoAtuacao,
}: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
          01. Dados Básicos
        </span>
      </div>
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Nome Completo
          </label>
          <Input
            {...form.register("nome")}
            placeholder="Ex: Ricardo Silva"
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
            CPF / CNPJ
          </label>
          <Controller
            name="cpfCnpj"
            control={form.control}
            render={({ field }) => (
              <InputCPFCNPJ
                value={field.value ?? ""}
                onChange={field.onChange}
                className="h-9"
              />
            )}
          />
          {form.formState.errors.cpfCnpj && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.cpfCnpj.message}
            </p>
          )}
        </div>
        <div className="col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
          </label>
          <div className="flex items-center gap-2 h-9">
            <Controller
              name="ativo"
              control={form.control}
              render={({ field }) => (
                <>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-10 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-200 [&>span]:h-4 [&>span]:w-4"
                  />
                  <span
                    className={cn(
                      "text-xs font-bold whitespace-nowrap",
                      field.value ? "text-emerald-600" : "text-slate-500",
                    )}
                  >
                    {field.value ? "ATIVO" : "INATIVO"}
                  </span>
                </>
              )}
            />
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Telefone / WhatsApp
          </label>
          <Controller
            name="telefone"
            control={form.control}
            render={({ field }) => (
              <InputTelefone
                value={field.value ?? ""}
                onChange={field.onChange}
                className="h-9"
              />
            )}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Estado de Atuação
          </label>
          <Controller
            name="estado"
            control={form.control}
            render={({ field }) => (
              <SelectUF
                ufs={ufs}
                value={field.value || ""}
                onChange={(v) => {
                  field.onChange(v);
                  form.setValue("cidade", "");
                }}
                placeholder="Pesquisar estado..."
                className="h-9"
              />
            )}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Cidade de Atuação
          </label>
          <Controller
            name="cidade"
            control={form.control}
            render={({ field }) => (
              <SelectCidade
                municipios={municipios}
                value={field.value || ""}
                onChange={field.onChange}
                disabled={!estadoAtuacao}
                placeholder="Pesquisar cidade..."
                className="h-9"
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
