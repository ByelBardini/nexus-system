import { ClientSideTableFooter } from "@/components/ClientSideTableFooter";
import { PAGE_SIZE } from "./aparelhos-page.shared";

type Props = {
  page: number;
  totalPages: number;
  filteredLength: number;
  pageSize?: number;
  paginatedLength: number;
  onPageChange: (page: number) => void;
};

export function AparelhosTableFooter({
  page,
  totalPages,
  filteredLength,
  pageSize = PAGE_SIZE,
  paginatedLength,
  onPageChange,
}: Props) {
  return (
    <ClientSideTableFooter
      page={page}
      totalPages={totalPages}
      filteredLength={filteredLength}
      pageSize={pageSize}
      paginatedLength={paginatedLength}
      onPageChange={onPageChange}
      entityLabel="aparelhos"
      footerTestId="aparelhos-table-footer"
      paginationTestId="aparelhos-pagination"
      prevTestId="aparelhos-page-prev"
      nextTestId="aparelhos-page-next"
      pageButtonTestId={(p) => `aparelhos-page-${p}`}
    />
  );
}
