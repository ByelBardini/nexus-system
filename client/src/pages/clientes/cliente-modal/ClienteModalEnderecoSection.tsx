import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { InputCEP } from "@/components/InputCEP";
import { SelectUF } from "@/components/SelectUF";
import { SelectCidade } from "@/components/SelectCidade";
import type { EnderecoCEP, Municipio, UF } from "@/hooks/useBrasilAPI";
import type { ClienteFormData } from "../shared/clientes-page.shared";

type Props = {
  form: UseFormReturn<ClienteFormData>;
  ufs: UF[];
  municipios: Municipio[];
  onAddressFound: (e: EnderecoCEP) => void;
};

export function ClienteModalEnderecoSection({
  form,
  ufs,
  municipios,
  onAddressFound,
}: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
          02. Endereço (opcional)
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            CEP
          </label>
          <Controller
            name="cep"
            control={form.control}
            render={({ field }) => (
              <InputCEP
                value={field.value ?? ""}
                onChange={field.onChange}
                onAddressFound={onAddressFound}
                placeholder="00000-000"
                className="h-9 font-mono"
              />
            )}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Logradouro
          </label>
          <Input
            {...form.register("logradouro")}
            placeholder="Rua, Av., etc."
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Número
          </label>
          <Input
            {...form.register("numero")}
            placeholder="Nº"
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Complemento
          </label>
          <Input
            {...form.register("complemento")}
            placeholder="Sala, andar, etc."
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Bairro
          </label>
          <Input
            {...form.register("bairro")}
            placeholder="Bairro"
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Estado
          </label>
          <Controller
            name="estado"
            control={form.control}
            render={({ field }) => (
              <SelectUF
                ufs={ufs}
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="UF"
                className="h-9"
              />
            )}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Cidade
          </label>
          <Controller
            name="cidade"
            control={form.control}
            render={({ field }) => (
              <SelectCidade
                municipios={municipios}
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Cidade"
                className="h-9"
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
