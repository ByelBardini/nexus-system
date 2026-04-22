import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IdAparelhoSearch } from "@/components/IdAparelhoSearch";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { tipoServicoConfig } from "../ordens-servico-criacao.constants";
import type { AparelhoRastreadorList } from "../ordens-servico-criacao.types";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";

type Props = {
  form: UseFormReturn<CriacaoOsFormData>;
  tipo: string | undefined;
  showDetalhesRevisaoRetirada: boolean;
  rastreadoresInstalados: AparelhoRastreadorList[];
};

export function OrdensServicoCriacaoServicoSection({
  form,
  tipo,
  showDetalhesRevisaoRetirada,
  rastreadoresInstalados,
}: Props) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon name="build" className="text-slate-400 text-lg" />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          Detalhes do Serviço
        </h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
            Tipo de Serviço
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {(["INSTALACAO", "REVISAO", "RETIRADA"] as const).map((cat) => {
              const isActive =
                cat === "INSTALACAO"
                  ? tipo?.startsWith("INSTALACAO_")
                  : tipo === cat;
              return (
                <Button
                  key={cat}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-14 w-full text-sm font-bold uppercase gap-2",
                    isActive && "bg-erp-blue hover:bg-blue-700",
                  )}
                  onClick={() => {
                    if (cat === "INSTALACAO") {
                      form.setValue("tipo", "INSTALACAO_COM_BLOQUEIO");
                    } else {
                      form.setValue("tipo", cat);
                    }
                  }}
                >
                  <MaterialIcon
                    name={tipoServicoConfig[cat].icon}
                    className="text-xl"
                  />
                  {tipoServicoConfig[cat].label}
                </Button>
              );
            })}
          </div>
          {tipo?.startsWith("INSTALACAO_") && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  tipo === "INSTALACAO_COM_BLOQUEIO" ? "default" : "outline"
                }
                size="sm"
                className={cn(
                  "h-9 w-full text-[11px] font-bold uppercase",
                  tipo === "INSTALACAO_COM_BLOQUEIO" &&
                    "bg-erp-blue hover:bg-blue-700",
                )}
                onClick={() => form.setValue("tipo", "INSTALACAO_COM_BLOQUEIO")}
              >
                Com bloqueio
              </Button>
              <Button
                type="button"
                variant={
                  tipo === "INSTALACAO_SEM_BLOQUEIO" ? "default" : "outline"
                }
                size="sm"
                className={cn(
                  "h-9 w-full text-[11px] font-bold uppercase",
                  tipo === "INSTALACAO_SEM_BLOQUEIO" &&
                    "bg-erp-blue hover:bg-blue-700",
                )}
                onClick={() =>
                  form.setValue("tipo", "INSTALACAO_SEM_BLOQUEIO")
                }
              >
                Sem bloqueio
              </Button>
            </div>
          )}
          {form.formState.errors.tipo && (
            <p className="text-xs text-destructive mt-1">
              {form.formState.errors.tipo.message}
            </p>
          )}
        </div>

        {showDetalhesRevisaoRetirada && (
          <div className="grid grid-cols-12 gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded">
            <div className="col-span-4">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                ID Instalado
              </Label>
              <IdAparelhoSearch
                rastreadores={rastreadoresInstalados}
                value={form.watch("idAparelho") ?? ""}
                onChange={(v) => form.setValue("idAparelho", v)}
                placeholder="Buscar ou digitar ID..."
              />
            </div>
            <div className="col-span-4">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Local de Instalação
              </Label>
              <Input
                {...form.register("localInstalacao")}
                placeholder="Ex: PAINEL FRONTAL"
                className="h-9"
                autoComplete="off"
              />
            </div>
            <div className="col-span-4">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Pós Chave
              </Label>
              <Controller
                name="posChave"
                control={form.control}
                render={({ field }) => {
                  const isSim = field.value === "SIM";
                  return (
                    <Button
                      type="button"
                      variant={isSim ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-9 w-full text-[11px] font-bold uppercase",
                        isSim && "bg-erp-blue hover:bg-blue-700",
                      )}
                      onClick={() => field.onChange(isSim ? "NAO" : "SIM")}
                    >
                      {isSim ? "Sim" : "Não"}
                    </Button>
                  );
                }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
