import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DebitoEquipamento } from "../domain/types";
import { DebitoEquipamentoRowGroup } from "./DebitoEquipamentoRowGroup";

export interface DebitosEquipamentosTableProps {
  filtered: DebitoEquipamento[];
  expandedId: number | null;
  onExpandedChange: (id: number | null) => void;
}

export function DebitosEquipamentosTable({
  filtered,
  expandedId,
  onExpandedChange,
}: DebitosEquipamentosTableProps) {
  return (
    <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-16 pl-4 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              ID
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Devedor
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Credor
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Equip.
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Status
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Últ. Mov.
            </TableHead>
            <TableHead className="w-10 px-3 py-2.5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-slate-400"
              >
                Nenhum débito encontrado.
              </TableCell>
            </TableRow>
          )}
          {filtered.map((debito) => {
            const isExpanded = expandedId === debito.id;
            return (
              <DebitoEquipamentoRowGroup
                key={debito.id}
                debito={debito}
                isExpanded={isExpanded}
                onToggle={() => onExpandedChange(isExpanded ? null : debito.id)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
