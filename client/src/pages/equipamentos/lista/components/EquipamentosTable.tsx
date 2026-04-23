import { ClientSideTableFooter } from "@/components/ClientSideTableFooter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EQUIPAMENTOS_LIST_PAGE_SIZE } from "../equipamentos-page.shared";
import type { EquipamentoListItem } from "../equipamentos-page.shared";
import { EquipamentoTableRow } from "./EquipamentoTableRow";

type Props = {
  paginated: EquipamentoListItem[];
  filtered: EquipamentoListItem[];
  page: number;
  totalPages: number;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
  kitsPorId: Map<number, string>;
  onPageChange: (page: number) => void;
};

export function EquipamentosTable({
  paginated,
  filtered,
  page,
  totalPages,
  expandedId,
  setExpandedId,
  kitsPorId,
  onPageChange,
}: Props) {
  return (
    <div
      className="bg-white border border-slate-300 shadow-sm overflow-hidden"
      data-testid="equipamentos-table"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-16 pl-4 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              ID
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              IMEI & ICCID
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Marca / Operadora
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Status
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Kit
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Técnico
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Proprietário
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Última Mov.
            </TableHead>
            <TableHead className="w-10 px-3 py-2.5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((equip) => {
            const isExpanded = expandedId === equip.id;
            return (
              <EquipamentoTableRow
                key={equip.id}
                equip={equip}
                expanded={isExpanded}
                kitsPorId={kitsPorId}
                onToggleExpand={() =>
                  setExpandedId(isExpanded ? null : equip.id)
                }
              />
            );
          })}
          {paginated.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="px-4 py-12 text-center text-sm text-slate-500"
                data-testid="equipamentos-empty"
              >
                Nenhum equipamento encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ClientSideTableFooter
        page={page}
        totalPages={totalPages}
        filteredLength={filtered.length}
        pageSize={EQUIPAMENTOS_LIST_PAGE_SIZE}
        paginatedLength={paginated.length}
        onPageChange={onPageChange}
        entityLabel="equipamentos"
        footerTestId="equipamentos-table-footer"
        paginationTestId="equipamentos-pagination"
        prevTestId="equipamentos-page-prev"
        nextTestId="equipamentos-page-next"
        pageButtonTestId={(p) => `equipamentos-page-${p}`}
      />
    </div>
  );
}
