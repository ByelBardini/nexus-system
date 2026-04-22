import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Aparelho } from "./aparelhos-page.shared";
import { AparelhoTableRow } from "./AparelhoTableRow";
import { AparelhosTableFooter } from "./AparelhosTableFooter";

type Props = {
  paginated: Aparelho[];
  filteredLength: number;
  page: number;
  totalPages: number;
  kitsPorId: Map<number, string>;
  expandedId: number | null;
  onToggleRow: (id: number) => void;
  onPageChange: (page: number) => void;
};

export function AparelhosTable({
  paginated,
  filteredLength,
  page,
  totalPages,
  kitsPorId,
  expandedId,
  onToggleRow,
  onPageChange,
}: Props) {
  return (
    <div
      className="bg-white border border-slate-300 shadow-sm overflow-hidden"
      data-testid="aparelhos-table"
    >
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-10 px-4 py-2" />
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Identificação
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Tipo
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Marca / Operadora
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Proprietário
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Status
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                SIM/Rastreador Vinculado
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Kit
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Técnico
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Cliente
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Lote
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Data Entrada
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((aparelho) => (
              <AparelhoTableRow
                key={aparelho.id}
                aparelho={aparelho}
                kitsPorId={kitsPorId}
                isExpanded={expandedId === aparelho.id}
                onToggle={() => onToggleRow(aparelho.id)}
              />
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                  data-testid="aparelhos-empty"
                >
                  Nenhum aparelho encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AparelhosTableFooter
        page={page}
        totalPages={totalPages}
        filteredLength={filteredLength}
        paginatedLength={paginated.length}
        onPageChange={onPageChange}
      />
    </div>
  );
}
