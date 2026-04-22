import { Fragment } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarCNPJ } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ClienteRowExpandedPanel } from "./ClienteRowExpandedPanel";
import {
  STATUS_CLIENTE_LABEL,
  STATUS_INDICATOR_DOT_CLASS,
  TIPO_CONTRATO_BADGE_CLASS,
  TIPO_CONTRATO_LABEL,
  type Cliente,
} from "../shared/clientes-page.shared";

type Props = {
  paginated: Cliente[];
  expandedId: number | null;
  onToggleExpand: (id: number) => void;
  canEdit: boolean;
  onEditCliente: (c: Cliente) => void;
};

export function ClientesTable({
  paginated,
  expandedId,
  onToggleExpand,
  canEdit,
  onEditCliente,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-100 hover:bg-slate-100">
            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-16">
              ID
            </TableHead>
            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Razão Social / Nome Fantasia
            </TableHead>
            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              CNPJ
            </TableHead>
            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
              Tipo Contrato
            </TableHead>
            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
              Estoque Próprio
            </TableHead>
            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
              Status
            </TableHead>
            <TableHead className="w-10 px-4 py-3" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <Fragment key={c.id}>
                <TableRow
                  className={cn(
                    "cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors",
                    isExpanded && "bg-slate-50",
                  )}
                  onClick={() => onToggleExpand(c.id)}
                >
                  <TableCell className="px-4 py-4 text-xs font-bold text-slate-400 text-center">
                    {String(c.id - 1).padStart(4, "0")}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">
                        {c.nome}
                      </span>
                      {c.nomeFantasia && (
                        <span className="text-[11px] text-slate-500">
                          {c.nomeFantasia}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-slate-600 font-mono">
                    {c.cnpj ? formatarCNPJ(c.cnpj) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                        TIPO_CONTRATO_BADGE_CLASS[c.tipoContrato],
                      )}
                    >
                      {TIPO_CONTRATO_LABEL[c.tipoContrato]}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center">
                    {c.estoqueProprio ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          STATUS_INDICATOR_DOT_CLASS[c.status],
                        )}
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-600">
                        {STATUS_CLIENTE_LABEL[c.status]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-slate-50">
                    <TableCell
                      colSpan={7}
                      className="border-b border-slate-200 p-0"
                    >
                      <ClienteRowExpandedPanel
                        cliente={c}
                        canEdit={canEdit}
                        onEdit={onEditCliente}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
