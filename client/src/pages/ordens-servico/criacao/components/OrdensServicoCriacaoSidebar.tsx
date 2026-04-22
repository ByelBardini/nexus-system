import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { TIPO_OS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { Cliente, Tecnico } from "../ordens-servico-criacao.types";
import {
  computeDeslocamentoSidebar,
  computeValorTotalAproximado,
  formatBrl,
} from "../ordens-servico-criacao.resumo";
import type {
  CriacaoOsWatched,
  CriacaoOsDerivedFlags,
} from "../ordens-servico-criacao.derived";

type Props = {
  ordemInstalacao: "INFINITY" | "CLIENTE";
  clienteSelecionado: Cliente | null;
  tecnicoSelecionado: Tecnico | undefined;
  watched: CriacaoOsWatched;
  tipo: string | undefined;
  derived: CriacaoOsDerivedFlags;
  canCreate: boolean;
  isPending: boolean;
  onEmitir: () => void;
};

const CHECKLIST: { key: keyof CriacaoOsDerivedFlags; label: string }[] = [
  { key: "temCliente", label: "Dados do Cliente" },
  { key: "temTecnico", label: "Técnico Selecionado" },
  { key: "temVeiculo", label: "Dados do Veículo" },
  { key: "temTipo", label: "Tipo de Serviço" },
];

export function OrdensServicoCriacaoSidebar({
  ordemInstalacao,
  clienteSelecionado,
  tecnicoSelecionado,
  watched,
  tipo,
  derived,
  canCreate,
  isPending,
  onEmitir,
}: Props) {
  const [kmEstimado, setKmEstimado] = useState<number | "">("");

  const deslocamento = useMemo(
    () =>
      computeDeslocamentoSidebar({
        kmEstimado,
        precoDeslocamentoRaw: tecnicoSelecionado?.precos?.deslocamento,
      }),
    [kmEstimado, tecnicoSelecionado?.precos?.deslocamento],
  );

  const resumo = useMemo(
    () =>
      computeValorTotalAproximado({
        tipo: tipo ?? "",
        kmEstimado,
        tecnico: tecnicoSelecionado,
      }),
    [tipo, kmEstimado, tecnicoSelecionado],
  );

  return (
    <aside className="fixed top-20 right-0 z-10 h-[calc(100vh-5rem)] w-96 bg-white border-l border-slate-300 flex flex-col overflow-hidden shadow-lg">
      <div className="p-5 border-b border-slate-200 shrink-0">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-4 font-condensed uppercase">
          <MaterialIcon name="analytics" className="text-erp-blue" />
          Resumo da Ordem
        </h3>
        <div className="space-y-4">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
              Cliente Selecionado
            </span>
            <p className="text-xs font-black text-slate-800 truncate">
              {ordemInstalacao === "INFINITY"
                ? "Infinity"
                : ordemInstalacao === "CLIENTE" && clienteSelecionado
                  ? clienteSelecionado.nome
                  : "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
              Técnico Atribuído
            </span>
            <p className="text-xs font-black text-slate-800 uppercase">
              {tecnicoSelecionado?.nome ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
              Veículo
            </span>
            <p className="text-xs font-black text-slate-800 uppercase">
              {watched.veiculoPlaca
                ? [watched.veiculoPlaca, watched.veiculoMarca, watched.veiculoModelo]
                    .filter(Boolean)
                    .join(" • ") || "—"
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
              Tipo de Serviço
            </span>
            <p className="text-xs font-black text-erp-blue uppercase">
              {tipo ? (TIPO_OS_LABELS[tipo] ?? tipo) : "—"}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 flex-1 min-h-0 overflow-y-auto">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-4 font-condensed uppercase">
          <MaterialIcon name="fact_check" className="text-slate-400" />
          Checklist de Validação
        </h3>
        <div className="space-y-3">
          {CHECKLIST.map(({ key, label }) => {
            const ok = derived[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-bold text-slate-600">{label}</span>
                <MaterialIcon
                  name={ok ? "check_circle" : "radio_button_unchecked"}
                  className={cn(
                    "text-lg",
                    ok ? "text-erp-green" : "text-slate-300",
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-5 border-t border-slate-200 shrink-0 space-y-3">
        <div>
          <span className="text-[11px] text-slate-500 font-bold uppercase block mb-2">
            Deslocamento
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={kmEstimado}
              onChange={(e) => {
                const v = e.target.value;
                setKmEstimado(v === "" ? "" : Math.max(0, Number(v)));
              }}
              className="h-8 w-20 text-xs text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs font-bold text-slate-500">KM</span>
            {deslocamento.temPrecoKm && (
              <span className="text-xs text-slate-400">
                × {formatBrl(deslocamento.precoKm)}/KM
              </span>
            )}
            {deslocamento.totalDeslocamento !== null && (
              <span className="text-xs font-bold text-slate-700 ml-auto">
                = {formatBrl(deslocamento.totalDeslocamento)}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div>
          <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
            Valor total aproximado
          </span>
          <p className="text-2xl font-black text-slate-800">
            {resumo.valorTotal !== null
              ? formatBrl(resumo.valorTotal)
              : "—"}
          </p>
          {resumo.totalDeslocamento !== null && resumo.precoServico !== null && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              serviço {formatBrl(resumo.precoServico)} + deslocamento{" "}
              {formatBrl(resumo.totalDeslocamento)}
            </p>
          )}
        </div>
      </div>
      <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0">
        <Button
          type="button"
          className="w-full bg-erp-blue hover:bg-blue-700 text-white py-3 text-xs font-black uppercase gap-2"
          onClick={onEmitir}
          disabled={!canCreate || !derived.isFormValid || isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MaterialIcon name="send" className="text-sm" />
          )}
          Emitir Ordem
        </Button>
        <p className="text-[9px] text-slate-500 text-center mt-3 font-bold uppercase">
          {derived.isFormValid
            ? "Pronto para emitir"
            : "Preencha os campos obrigatórios"}
        </p>
      </div>
    </aside>
  );
}
