import { Fragment } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatarDataHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EquipamentoListItem } from "../equipamentos-page.shared";
import {
  formatMarcaModeloEquipamento,
  getEquipamentoStatusPresentation,
  proprietarioLabelEquipamento,
  resolveKitNomeEquipamento,
} from "../equipamentos-page.helpers";
import { EquipamentoExpandedPanel } from "./EquipamentoExpandedPanel";

type Props = {
  equip: EquipamentoListItem;
  expanded: boolean;
  kitsPorId: Map<number, string>;
  onToggleExpand: () => void;
};

export function EquipamentoTableRow({
  equip,
  expanded,
  kitsPorId,
  onToggleExpand,
}: Props) {
  const presentation = getEquipamentoStatusPresentation(equip);
  const kitNome = resolveKitNomeEquipamento(equip, kitsPorId);
  const marcaModelo = formatMarcaModeloEquipamento(equip);
  const proprietario = proprietarioLabelEquipamento(equip);

  const simDetalheLinhas =
    equip.simVinculado?.marcaSimcard?.nome || equip.simVinculado?.planoSimcard
      ? [
          equip.simVinculado?.marcaSimcard?.nome,
          equip.simVinculado?.planoSimcard
            ? `${equip.simVinculado.planoSimcard.planoMb} MB`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <Fragment>
      <TableRow
        className={cn(
          "cursor-pointer border-b border-slate-100 hover:bg-blue-50/30 transition-colors bg-white",
          expanded && "border-l-4 border-l-blue-600 bg-blue-50/20",
        )}
        onClick={onToggleExpand}
        data-testid={`equipamento-row-${equip.id}`}
      >
        <TableCell className="pl-4 px-3 py-3">
          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
            #{equip.id}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <MaterialIcon
                name="sensors"
                className="text-[14px] text-slate-400"
              />
              <span className="text-xs font-bold text-slate-700">
                {equip.identificador || "-"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MaterialIcon
                name="sim_card"
                className="text-[14px] text-slate-400"
              />
              <span className="text-[10px] font-mono text-slate-500">
                {equip.simVinculado?.identificador || "-"}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-slate-700">
              {marcaModelo}
            </span>
            <span className="text-[10px] text-slate-400 uppercase">
              {equip.simVinculado?.operadora || "-"}
            </span>
            {simDetalheLinhas && (
              <span className="text-[10px] text-slate-500">
                {simDetalheLinhas}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          <div className="flex items-center gap-1.5">
            <div
              className={cn("w-2 h-2 rounded-full", presentation.dotClass)}
            />
            <span className="text-[10px] font-bold text-slate-600 uppercase">
              {presentation.label}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          {kitNome ? (
            <span className="text-[11px] text-violet-600 font-bold">
              {kitNome}
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell className="px-3 py-3">
          {equip.tecnico?.nome ? (
            <div className="text-[11px] font-medium text-slate-600">
              {equip.tecnico.nome}
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell className="px-3 py-3">
          <div className="text-[11px] font-medium text-slate-600">
            {proprietario}
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          <span className="text-[10px] font-mono text-slate-500">
            {formatarDataHora(equip.atualizadoEm)}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="text-slate-400 hover:text-slate-600"
            aria-label={expanded ? "Recolher detalhes" : "Expandir detalhes"}
            data-testid={`equipamento-row-toggle-${equip.id}`}
          >
            <MaterialIcon
              name={expanded ? "expand_less" : "more_vert"}
              className="text-xl"
            />
          </button>
        </TableCell>
      </TableRow>

      {expanded && (
        <EquipamentoExpandedPanel equip={equip} kitsPorId={kitsPorId} />
      )}
    </Fragment>
  );
}
