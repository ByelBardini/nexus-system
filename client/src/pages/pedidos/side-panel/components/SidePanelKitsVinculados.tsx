import { Fragment } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type {
  KitComAparelhos,
  KitVinculado,
} from "../../shared/pedidos-config-types";
import { SidePanelKitResumoAparelhos } from "./SidePanelKitResumoAparelhos";

type Props = {
  kitsVinculados: KitVinculado[];
  estaConcluido: boolean;
  kitExpandidoId: number | null;
  detalhesKitId: number | null;
  kitDetalhes: KitComAparelhos | undefined;
  carregandoDetalhes: boolean;
  onAddKit: () => void;
  onToggleExpandir: (kitId: number) => void;
  onRemoverKit: (kitId: number) => void;
  onEditarKit: (kit: KitVinculado) => void;
};

export function SidePanelKitsVinculados({
  kitsVinculados,
  estaConcluido,
  kitExpandidoId,
  detalhesKitId,
  kitDetalhes,
  carregandoDetalhes,
  onAddKit,
  onToggleExpandir,
  onRemoverKit,
  onEditarKit,
}: Props) {
  return (
    <div
      className={cn(
        "p-6 border-b border-slate-100",
        estaConcluido && "opacity-90",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase">
          Kits Vinculados
        </h3>
        {!estaConcluido && kitsVinculados.length > 0 && (
          <button
            type="button"
            onClick={onAddKit}
            className="text-[10px] font-bold text-erp-blue flex items-center gap-1 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <MaterialIcon name="add" className="text-sm" /> ADICIONAR KIT
          </button>
        )}
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="pb-2 font-semibold">KIT</th>
            <th className="pb-2 font-semibold text-center">QTD</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {kitsVinculados.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-8">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                  <p className="text-[11px]">Nenhum kit vinculado.</p>
                  {!estaConcluido && (
                    <button
                      type="button"
                      onClick={onAddKit}
                      className="text-[10px] font-bold text-erp-blue flex items-center gap-1 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <MaterialIcon name="add" className="text-sm" /> ADICIONAR
                      KIT
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            kitsVinculados.map((k) => (
              <Fragment key={k.id}>
                <tr
                  className={cn(
                    "hover:bg-slate-50 group",
                    kitExpandidoId === k.id && "bg-blue-50/50",
                  )}
                >
                  <td className="py-2.5 font-bold text-slate-700">{k.nome}</td>
                  <td className="py-2.5 text-center">{k.quantidade}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleExpandir(k.id)}
                        className="text-slate-400 hover:text-erp-blue"
                      >
                        <MaterialIcon
                          name={
                            kitExpandidoId === k.id
                              ? "expand_less"
                              : "expand_more"
                          }
                          className="text-base"
                        />
                      </button>
                      {!estaConcluido && (
                        <button
                          type="button"
                          onClick={() => onRemoverKit(k.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                          aria-label="Remover kit"
                        >
                          <MaterialIcon name="delete" className="text-base" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {kitExpandidoId === k.id && (
                  <tr className="bg-slate-50/80">
                    <td colSpan={3} className="px-4 pb-4 pt-1 align-top">
                      <div className="pl-2 border-l-2 border-slate-200">
                        {carregandoDetalhes ? (
                          <div className="flex items-center py-4 text-slate-500 text-[11px]">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Carregando...
                          </div>
                        ) : kitDetalhes && detalhesKitId === k.id ? (
                          <div className="space-y-3 pt-1">
                            {!estaConcluido && (
                              <div className="flex gap-2 flex-wrap items-center mb-2">
                                <Button
                                  size="sm"
                                  onClick={() => onEditarKit(k)}
                                  className="text-[10px] font-bold h-7 bg-erp-blue hover:bg-blue-700"
                                >
                                  <MaterialIcon
                                    name="edit"
                                    className="text-sm mr-2"
                                  />
                                  Editar
                                </Button>
                              </div>
                            )}
                            <SidePanelKitResumoAparelhos
                              aparelhos={kitDetalhes.aparelhos}
                            />
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
