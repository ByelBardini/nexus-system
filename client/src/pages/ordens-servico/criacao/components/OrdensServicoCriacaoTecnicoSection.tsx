import { Controller, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { SelectTecnicoSearch } from "@/components/SelectTecnicoSearch";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";
import { TECNICO_PRECO_CARDS } from "../ordens-servico-criacao.constants";
import type { PrecoTecnico, Tecnico } from "../ordens-servico-criacao.types";
import { precoTecnicoCardDisplay } from "../ordens-servico-criacao.resumo";

type Props = {
  form: UseFormReturn<CriacaoOsFormData>;
  tecnicos: Tecnico[];
  tecnicoSelecionado: Tecnico | undefined;
};

export function OrdensServicoCriacaoTecnicoSection({
  form,
  tecnicos,
  tecnicoSelecionado,
}: Props) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon
          name="engineering"
          className="text-slate-400 text-lg"
        />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          Técnico Responsável
        </h2>
      </div>
      <div className="p-4">
        <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
          Selecionar Técnico
        </Label>
        <Controller
          name="tecnicoId"
          control={form.control}
          render={({ field }) => (
            <SelectTecnicoSearch
              tecnicos={tecnicos}
              value={field.value}
              onChange={field.onChange}
              subclienteCidade={form.watch("subclienteCidade")}
              subclienteEstado={form.watch("subclienteEstado")}
              placeholder="Digite para pesquisar técnico (nome, cidade ou estado)..."
            />
          )}
        />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TECNICO_PRECO_CARDS.map(({ key, label }) => {
            const valor =
              tecnicoSelecionado?.precos?.[key as keyof PrecoTecnico];
            const { texto } = precoTecnicoCardDisplay(valor);
            return (
              <div
                key={key}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-[9px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="text-sm font-bold text-slate-800">{texto}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
