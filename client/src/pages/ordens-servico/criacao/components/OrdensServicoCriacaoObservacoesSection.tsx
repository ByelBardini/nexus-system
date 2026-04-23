import type { UseFormReturn } from "react-hook-form";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";

type Props = {
  form: UseFormReturn<CriacaoOsFormData>;
};

export function OrdensServicoCriacaoObservacoesSection({ form }: Props) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon name="chat_bubble" className="text-slate-400 text-lg" />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          Observações Internas
        </h2>
      </div>
      <div className="p-4">
        <textarea
          {...form.register("observacoes")}
          className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Detalhes técnicos adicionais para o serviço em campo..."
          autoComplete="off"
        />
      </div>
    </section>
  );
}
