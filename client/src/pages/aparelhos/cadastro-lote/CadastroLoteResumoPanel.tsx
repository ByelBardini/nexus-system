import { CheckCircle } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatarMoeda, formatarMoedaDeCentavos } from "@/lib/format";
import type {
  ClienteLista,
  MarcaCatalog,
  MarcaModeloCatalog,
  OperadoraCatalog,
} from "@/pages/aparelhos/shared/catalog.types";
import type { LoteIdValidation } from "./validate-lote-ids";
import type { LoteFormValues } from "./schema";

type CadastroLoteResumoPanelProps = {
  watchReferencia: string;
  watchNotaFiscal: string | undefined;
  watchTipo: LoteFormValues["tipo"];
  watchProprietario: LoteFormValues["proprietarioTipo"];
  watchMarca: string;
  watchModelo: string;
  watchOperadora: string;
  watchValorUnitario: number;
  watchDefinirIds: boolean;
  clienteSelecionado: ClienteLista | undefined;
  marcasAtivas: MarcaCatalog[];
  modelosDisponiveis: MarcaModeloCatalog[];
  operadorasAtivas: OperadoraCatalog[];
  quantidadeFinal: number;
  valorTotal: number;
  idValidation: LoteIdValidation;
};

export function CadastroLoteResumoPanel({
  watchReferencia,
  watchNotaFiscal,
  watchTipo,
  watchProprietario,
  watchMarca,
  watchModelo,
  watchOperadora,
  watchValorUnitario,
  watchDefinirIds,
  clienteSelecionado,
  marcasAtivas,
  modelosDisponiveis,
  operadorasAtivas,
  quantidadeFinal,
  valorTotal,
  idValidation,
}: CadastroLoteResumoPanelProps) {
  return (
    <div className="w-80 shrink-0 sticky top-[calc(50vh-300px)] h-fit">
      <div className="bg-slate-800 text-white rounded-lg overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest">
            Resumo do Lote
          </h3>
          <MaterialIcon name="info" className="text-slate-500" />
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Referência
              </label>
              <p className="text-lg font-bold">{watchReferencia || "—"}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Nota Fiscal
              </label>
              <p className="text-lg font-bold">
                {watchNotaFiscal?.trim() || "—"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Tipo
              </label>
              <p className="text-sm font-medium">
                {watchTipo === "RASTREADOR" ? "📡 Rastreador" : "📶 Simcard"}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Proprietário
              </label>
              <p className="text-sm font-medium">
                {watchProprietario === "INFINITY"
                  ? "Infinity"
                  : (clienteSelecionado?.nome ?? "—")}
              </p>
            </div>
          </div>
          {watchTipo === "RASTREADOR" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Marca
                </label>
                <p className="text-sm font-medium">
                  {marcasAtivas.find((m) => m.id === Number(watchMarca))
                    ?.nome || "—"}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Modelo
                </label>
                <p className="text-sm font-medium">
                  {modelosDisponiveis.find((m) => m.id === Number(watchModelo))
                    ?.nome || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Operadora
              </label>
              <p className="text-sm font-medium">
                {operadorasAtivas.find((o) => o.id === Number(watchOperadora))
                  ?.nome || "—"}
              </p>
            </div>
          )}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Qtd. Itens
              </label>
              <span className="text-sm font-bold">
                {quantidadeFinal} Unidades
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Valor Unitário
              </label>
              <span className="text-sm font-medium">
                {formatarMoedaDeCentavos(watchValorUnitario)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Valor Total
              </label>
              <span className="text-xl font-bold text-blue-400">
                {formatarMoeda(valorTotal)}
              </span>
            </div>
          </div>
          {watchDefinirIds && idValidation.validos.length > 0 && (
            <div className="pt-4 border-t border-slate-700">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                IDs Válidos
              </label>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">
                  {idValidation.validos.length} identificadores
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-700/30">
          <div className="flex items-start gap-3">
            <MaterialIcon
              name="warning"
              className="text-yellow-500 text-lg shrink-0"
            />
            <p className="text-[10px] text-slate-300 leading-relaxed uppercase">
              Confira os dados antes de registrar o lote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
