import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AparelhosTableFooter } from "@/pages/aparelhos/lista/AparelhosTableFooter";
import { PAGE_SIZE } from "@/pages/aparelhos/lista/aparelhos-page.shared";

describe("AparelhosTableFooter", () => {
  it("mostra intervalo 0 quando lista vazia na página", () => {
    const onPageChange = vi.fn();
    render(
      <AparelhosTableFooter
        page={0}
        totalPages={1}
        filteredLength={0}
        paginatedLength={0}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByTestId("aparelhos-table-footer")).toHaveTextContent(
      "Exibindo 0-0 de 0",
    );
  });

  it("desabilita Anterior na primeira página", () => {
    render(
      <AparelhosTableFooter
        page={0}
        totalPages={3}
        filteredLength={40}
        paginatedLength={PAGE_SIZE}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("aparelhos-page-prev")).toBeDisabled();
    expect(screen.getByTestId("aparelhos-page-next")).not.toBeDisabled();
  });

  it("navega para página ao clicar no número", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <AparelhosTableFooter
        page={0}
        totalPages={3}
        filteredLength={40}
        paginatedLength={PAGE_SIZE}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByTestId("aparelhos-page-1"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("edge: muitas páginas mantém no máximo 5 botões numéricos", () => {
    render(
      <AparelhosTableFooter
        page={10}
        totalPages={20}
        filteredLength={300}
        paginatedLength={PAGE_SIZE}
        onPageChange={vi.fn()}
      />,
    );
    const bar = screen.getByTestId("aparelhos-pagination");
    expect(bar.querySelectorAll("button").length).toBe(7);
  });
});
