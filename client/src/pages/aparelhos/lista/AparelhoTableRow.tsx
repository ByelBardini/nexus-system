import { Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { STATUS_CONFIG_APARELHO } from "@/lib/aparelho-status";
import { parseDataLocal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Aparelho } from "./aparelhos-page.shared";
import { PROPRIETARIO_CONFIG, TIPO_CONFIG } from "./aparelhos-page.shared";
import {
  getClienteOuInfinityColunaTabela,
  getIdentificadorVinculado,
  getTecnicoNomeColunaTabela,
  resolveKitNome,
} from "./aparelhos-list.helpers";
import { AparelhoExpandedDetails } from "./AparelhoExpandedDetails";

type Props = {
  aparelho: Aparelho;
  kitsPorId: Map<number, string>;
  isExpanded: boolean;
  onToggle: () => void;
};

export function AparelhoTableRow({
  aparelho,
  kitsPorId,
  isExpanded,
  onToggle,
}: Props) {
  const statusConfig = STATUS_CONFIG_APARELHO[aparelho.status];
  const tipoConfig = TIPO_CONFIG[aparelho.tipo];
  const TipoIcon = tipoConfig.icon;
  const propConfig = PROPRIETARIO_CONFIG[aparelho.proprietario];
  const vinculado = getIdentificadorVinculado(aparelho);
  const kitNome = resolveKitNome(aparelho, kitsPorId);
  const tecnicoNome = getTecnicoNomeColunaTabela(aparelho);
  const clienteCol = getClienteOuInfinityColunaTabela(aparelho);

  return (
    <Fragment>
      <TableRow
        data-testid={`aparelho-row-${aparelho.id}`}
        className={cn(
          "cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors",
          isExpanded && "border-l-4 border-l-blue-600 bg-blue-50/30",
        )}
        onClick={onToggle}
      >
        <TableCell className="px-4 py-3 text-slate-400">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell className="px-4 py-3">
          <div className="flex items-center gap-2">
            <TipoIcon className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-sm font-medium text-slate-800">
              {aparelho.identificador || `#${aparelho.id}`}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase",
              aparelho.tipo === "RASTREADOR"
                ? "border-slate-200 bg-slate-100 text-slate-600"
                : "border-sky-200 bg-sky-50 text-sky-700",
            )}
          >
            {tipoConfig.label}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3 text-sm text-slate-600">
          {aparelho.tipo === "RASTREADOR"
            ? aparelho.marca || "-"
            : [aparelho.operadora, aparelho.marcaSimcard?.nome]
                .filter(Boolean)
                .join(" · ") || "-"}
        </TableCell>
        <TableCell className="px-4 py-3">
          {aparelho.proprietario === "CLIENTE" && aparelho.cliente ? (
            <span
              className={cn(
                "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold truncate max-w-[120px]",
                !aparelho.cliente.cor &&
                  "bg-amber-50 text-amber-700 border-amber-200",
              )}
              style={
                aparelho.cliente.cor
                  ? {
                      backgroundColor: `${aparelho.cliente.cor}22`,
                      color: aparelho.cliente.cor,
                      borderColor: `${aparelho.cliente.cor}55`,
                    }
                  : undefined
              }
            >
              {aparelho.cliente.nome}
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase",
                propConfig.className,
              )}
            >
              {propConfig.label}
            </span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase",
              statusConfig.bgColor,
              statusConfig.borderColor,
              statusConfig.color,
            )}
          >
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3">
          {vinculado ? (
            <span className="font-mono text-xs text-blue-600">{vinculado}</span>
          ) : (
            <span className="text-xs text-slate-400 italic">
              {aparelho.tipo === "RASTREADOR"
                ? "Não vinculado"
                : "Disponível"}
            </span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3">
          {kitNome ? (
            <span className="rounded-sm bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
              {kitNome}
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-sm text-slate-600">
          {tecnicoNome ? (
            <div className="text-xs font-medium">{tecnicoNome}</div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-sm text-slate-600">
          <div className="text-xs font-medium">{clienteCol}</div>
        </TableCell>
        <TableCell className="px-4 py-3">
          {aparelho.lote ? (
            <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
              {aparelho.lote.referencia}
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-xs text-slate-500">
          {parseDataLocal(aparelho.criadoEm).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-50">
          <TableCell
            colSpan={12}
            className="border-b border-slate-200 p-0"
          >
            <AparelhoExpandedDetails
              aparelho={aparelho}
              kitsPorId={kitsPorId}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
