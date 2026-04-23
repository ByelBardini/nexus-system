import { Button } from "@/components/ui/button";

export type ClientSideTableFooterProps = {
  page: number;
  totalPages: number;
  filteredLength: number;
  pageSize: number;
  paginatedLength: number;
  onPageChange: (page: number) => void;
  /** Texto após o total, ex.: "aparelhos" → "de 10 aparelhos" */
  entityLabel: string;
  footerTestId?: string;
  paginationTestId?: string;
  prevTestId?: string;
  nextTestId?: string;
  pageButtonTestId?: (pageIndex: number) => string;
};

export function ClientSideTableFooter({
  page,
  totalPages,
  filteredLength,
  pageSize,
  paginatedLength,
  onPageChange,
  entityLabel,
  footerTestId,
  paginationTestId,
  prevTestId,
  nextTestId,
  pageButtonTestId,
}: ClientSideTableFooterProps) {
  return (
    <div
      className="px-4 py-2 border-t border-slate-300 flex justify-between items-center bg-slate-50"
      data-testid={footerTestId}
    >
      <div className="text-[10px] font-bold text-slate-500 uppercase">
        Exibindo {paginatedLength === 0 ? 0 : page * pageSize + 1}-
        {Math.min((page + 1) * pageSize, filteredLength)} de {filteredLength}{" "}
        {entityLabel}
      </div>
      <div className="flex gap-1" data-testid={paginationTestId}>
        <Button
          variant="outline"
          size="sm"
          className="text-[10px] font-bold h-7"
          disabled={page <= 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          data-testid={prevTestId}
        >
          Anterior
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i;
          if (totalPages > 5) {
            const half = Math.floor(5 / 2);
            let start = Math.max(0, page - half);
            if (start + 5 > totalPages) start = totalPages - 5;
            p = start + i;
          }
          return (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              className={`text-[10px] font-bold h-7 ${page === p ? "bg-slate-900" : ""}`}
              onClick={() => onPageChange(p)}
              data-testid={pageButtonTestId?.(p)}
            >
              {p + 1}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="text-[10px] font-bold h-7"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          data-testid={nextTestId}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
