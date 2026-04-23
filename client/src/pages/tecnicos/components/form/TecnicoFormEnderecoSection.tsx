import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { InputCEP } from "@/components/InputCEP";
import { SelectUF } from "@/components/SelectUF";
import type { EnderecoCEP, UF } from "@/hooks/useBrasilAPI";
import type { TecnicoFormData } from "../../lib/tecnico-form";

type Props = {
  form: UseFormReturn<TecnicoFormData>;
  ufs: UF[];
  onAddressFound: (endereco: EnderecoCEP) => void;
};

export function TecnicoFormEnderecoSection({
  form,
  ufs,
  onAddressFound,
}: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
          02. Endereço para envio de rastreador
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
                className="h-9"
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
            placeholder="Rua, Avenida..."
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Número
          </label>
          <Input
            {...form.register("numero")}
            placeholder="123"
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Complemento
          </label>
          <Input
            {...form.register("complemento")}
            placeholder="Apto, Bloco..."
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Bairro
          </label>
          <Input
            {...form.register("bairro")}
            placeholder="Centro"
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Cidade
          </label>
          <Input
            {...form.register("cidadeEndereco")}
            placeholder="Cidade"
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Estado
          </label>
          <Controller
            name="estadoEndereco"
            control={form.control}
            render={({ field }) => (
              <SelectUF
                ufs={ufs}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Pesquisar..."
                className="h-9"
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
