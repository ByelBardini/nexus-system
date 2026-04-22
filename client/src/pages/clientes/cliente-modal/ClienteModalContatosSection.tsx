import { Controller, type UseFormReturn } from "react-hook-form";
import type { FieldArrayWithId } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputTelefone } from "@/components/InputTelefone";
import type { ClienteFormData } from "../shared/clientes-page.shared";

type Props = {
  form: UseFormReturn<ClienteFormData>;
  fields: FieldArrayWithId<ClienteFormData, "contatos", "id">[];
  onAddContato: () => void;
  onRemoveContato: (index: number) => void;
};

export function ClienteModalContatosSection({
  form,
  fields,
  onAddContato,
  onRemoveContato,
}: Props) {
  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
          03. Contatos
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[10px] uppercase gap-1"
          onClick={onAddContato}
        >
          <Plus className="h-3 w-3" />
          Adicionar Contato
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="bg-slate-100 border border-dashed border-slate-300 rounded p-6 text-center">
          <p className="text-sm text-slate-500">Nenhum contato adicionado</p>
          <p className="text-xs text-slate-400 mt-1">
            Clique em &quot;Adicionar Contato&quot; para incluir meios de contato
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white border border-slate-200 rounded p-4 relative"
            >
              <button
                type="button"
                onClick={() => onRemoveContato(index)}
                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                aria-label={`Remover contato ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Nome
                  </label>
                  <Input
                    {...form.register(`contatos.${index}.nome`)}
                    placeholder="Nome do contato"
                    className="h-9"
                  />
                  {form.formState.errors.contatos?.[index]?.nome && (
                    <p className="text-xs text-red-500 mt-1">
                      {form.formState.errors.contatos[index]?.nome?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Telefone
                  </label>
                  <Controller
                    name={`contatos.${index}.celular`}
                    control={form.control}
                    render={({ field: f }) => (
                      <InputTelefone
                        value={f.value ?? ""}
                        onChange={f.onChange}
                        className="h-9"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    E-mail
                  </label>
                  <Input
                    {...form.register(`contatos.${index}.email`)}
                    placeholder="email@empresa.com"
                    type="email"
                    className="h-9"
                  />
                  {form.formState.errors.contatos?.[index]?.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {form.formState.errors.contatos[index]?.email?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
