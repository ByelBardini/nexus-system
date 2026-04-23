import { Controller, type UseFormReturn } from "react-hook-form";
import { InputPreco } from "@/components/InputPreco";
import type { TecnicoFormData } from "../../lib/tecnico-form";

type Props = {
  form: UseFormReturn<TecnicoFormData>;
};

export function TecnicoFormValoresSection({ form }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
          03. Valores de Serviço
        </span>
      </div>
      <div className="space-y-4">
        <div className="bg-white p-4 border border-slate-200 rounded-sm">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3">
            Instalação
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Com Bloqueio
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <Controller
                  name="instalacaoComBloqueio"
                  control={form.control}
                  render={({ field }) => (
                    <InputPreco
                      value={field.value}
                      onChange={field.onChange}
                      className="h-9 pl-9 text-right font-mono"
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Sem Bloqueio
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <Controller
                  name="instalacaoSemBloqueio"
                  control={form.control}
                  render={({ field }) => (
                    <InputPreco
                      value={field.value}
                      onChange={field.onChange}
                      className="h-9 pl-9 text-right font-mono"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 border border-slate-200 rounded-sm">
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Revisão
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <Controller
                name="revisao"
                control={form.control}
                render={({ field }) => (
                  <InputPreco
                    value={field.value}
                    onChange={field.onChange}
                    className="h-9 pl-9 text-right font-mono"
                  />
                )}
              />
            </div>
          </div>
          <div className="bg-white p-4 border border-slate-200 rounded-sm">
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Retirada
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <Controller
                name="retirada"
                control={form.control}
                render={({ field }) => (
                  <InputPreco
                    value={field.value}
                    onChange={field.onChange}
                    className="h-9 pl-9 text-right font-mono"
                  />
                )}
              />
            </div>
          </div>
          <div className="bg-white p-4 border border-slate-200 rounded-sm">
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Deslocamento (km)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <Controller
                name="deslocamento"
                control={form.control}
                render={({ field }) => (
                  <InputPreco
                    value={field.value}
                    onChange={field.onChange}
                    className="h-9 pl-9 text-right font-mono"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
