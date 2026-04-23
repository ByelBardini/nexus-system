import {
  STATUS_CONFIG_APARELHO,
  type StatusAparelho,
} from "@/lib/aparelho-status";
import { formatarDataHora, formatId } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EquipamentoListItem } from "../equipamentos-page.shared";
import {
  formatMarcaModeloEquipamento,
  getEquipamentoStatusPresentation,
  loteEquipamentoResumo,
  proprietarioLabelEquipamento,
  resolveKitNomeEquipamento,
  simLinhaDetalheOperadora,
} from "../equipamentos-page.helpers";
import { TableCell, TableRow } from "@/components/ui/table";

type Props = {
  equip: EquipamentoListItem;
  kitsPorId: Map<number, string>;
};

export function EquipamentoExpandedPanel({ equip, kitsPorId }: Props) {
  const presentation = getEquipamentoStatusPresentation(equip);
  const kitNome = resolveKitNomeEquipamento(equip, kitsPorId);
  const marcaModelo = formatMarcaModeloEquipamento(equip);
  const proprietario = proprietarioLabelEquipamento(equip);

  return (
    <TableRow className="bg-white border-b border-slate-200">
      <TableCell colSpan={9} className="p-0">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-5">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border font-bold text-sm shrink-0",
              presentation.badgeClass,
            )}
          >
            <span>{presentation.headerIcon}</span>
            <span className="uppercase tracking-wide text-xs">
              {presentation.label}
            </span>
          </div>
          <div>
            <div className="font-mono font-bold text-slate-800 text-sm leading-tight">
              {equip.identificador || "-"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{marcaModelo}</div>
          </div>
          <div className="ml-auto text-right space-y-0.5">
            <div className="text-[10px] text-slate-400">
              Kit:{" "}
              <span className="font-bold text-violet-600">
                {kitNome ?? "-"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Técnico:{" "}
              <span className="font-bold text-slate-700">
                {equip.tecnico?.nome ?? "-"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Proprietário:{" "}
              <span className="font-bold text-slate-700">{proprietario}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {formatarDataHora(equip.atualizadoEm)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="px-6 py-4 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
              Equipamento
            </h4>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                IMEI
              </div>
              <div className="text-xs font-bold text-slate-700 font-mono">
                {equip.identificador || "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Modelo
              </div>
              <div className="text-xs font-bold text-slate-700">
                {marcaModelo}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                ICCID
              </div>
              <div className="text-xs font-bold text-slate-700 font-mono">
                {equip.simVinculado?.identificador || "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Operadora
              </div>
              <div className="text-xs font-bold text-slate-700">
                {simLinhaDetalheOperadora(equip)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Lote
              </div>
              <div className="text-xs font-bold text-slate-700">
                {loteEquipamentoResumo(equip)}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
              Operação
            </h4>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Técnico
              </div>
              <div className="text-xs font-bold text-slate-700">
                {equip.tecnico?.nome ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Proprietário
              </div>
              <div className="text-xs font-bold text-slate-700">
                {proprietario}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Kit
              </div>
              <div className="text-xs font-bold text-violet-600">
                {kitNome ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Transporte
              </div>
              <div className="text-xs font-bold text-slate-700">-</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Ordem de Instalação
              </div>
              <div className="text-xs font-bold text-slate-700">
                {equip.ordemServicoVinculada?.numero != null
                  ? `#${formatId(equip.ordemServicoVinculada.numero)}`
                  : "-"}
              </div>
            </div>
            {(equip.ordemServicoVinculada?.subclienteNome ||
              equip.ordemServicoVinculada?.veiculoPlaca) && (
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">
                  Subcliente / Placa
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {[
                    equip.ordemServicoVinculada.subclienteNome,
                    equip.ordemServicoVinculada.veiculoPlaca,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mx-4 mb-4 rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 px-5 py-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">
            Histórico
          </div>
          {equip.historico && equip.historico.length > 0 ? (
            <div
              className="flex flex-wrap gap-6"
              data-testid="equipamento-historico"
            >
              {equip.historico.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 w-2 h-2 rounded-full shrink-0",
                      idx === 0
                        ? "bg-blue-500 ring-4 ring-blue-100"
                        : "bg-slate-300",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-800">
                      {STATUS_CONFIG_APARELHO[item.statusNovo as StatusAparelho]
                        ?.label ?? item.statusNovo}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {formatarDataHora(item.criadoEm)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-[11px] text-slate-400 italic"
              data-testid="equipamento-historico-vazio"
            >
              Sem histórico registrado
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
