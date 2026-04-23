import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClientSideTableFooter } from "@/components/ClientSideTableFooter";

describe("ClientSideTableFooter", () => {
  it("mostra rótulo da entidade e intervalo 0 quando lista vazia na página", () => {
    const onPageChange = vi.fn();
    render(
      <ClientSideTableFooter
        page={0}
        totalPages={1}
        filteredLength={0}
        pageSize={12}
        paginatedLength={0}
        onPageChange={onPageChange}
        entityLabel="equipamentos"
        footerTestId="t-footer"
      />,
    );
    expect(screen.getByTestId("t-footer")).toHaveTextContent(
      "Exibindo 0-0 de 0 equipamentos",
    );
  });

  it("desabilita Anterior na primeira página e Próximo na última", () => {
    const { rerender } = render(
      <ClientSideTableFooter
        page={0}
        totalPages={3}
        filteredLength={36}
        pageSize={12}
        paginatedLength={12}
        onPageChange={vi.fn()}
        entityLabel="itens"
        prevTestId="prev"
        nextTestId="next"
      />,
    );
    expect(screen.getByTestId("prev")).toBeDisabled();
    expect(screen.getByTestId("next")).not.toBeDisabled();

    rerender(
      <ClientSideTableFooter
        page={2}
        totalPages={3}
        filteredLength={36}
        pageSize={12}
        paginatedLength={12}
        onPageChange={vi.fn()}
        entityLabel="itens"
        prevTestId="prev"
        nextTestId="next"
      />,
    );
    expect(screen.getByTestId("prev")).not.toBeDisabled();
    expect(screen.getByTestId("next")).toBeDisabled();
  });

  it("edge: uma única página — Próximo desabilitado", () => {
    render(
      <ClientSideTableFooter
        page={0}
        totalPages={1}
        filteredLength={5}
        pageSize={12}
        paginatedLength={5}
        onPageChange={vi.fn()}
        entityLabel="x"
        prevTestId="p"
        nextTestId="n"
      />,
    );
    expect(screen.getByTestId("n")).toBeDisabled();
  });

  it("chama onPageChange ao clicar no número da página", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <ClientSideTableFooter
        page={0}
        totalPages={4}
        filteredLength={48}
        pageSize={12}
        paginatedLength={12}
        onPageChange={onPageChange}
        entityLabel="z"
        pageButtonTestId={(p) => `pg-${p}`}
      />,
    );
    await user.click(screen.getByTestId("pg-2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("edge: muitas páginas mantém no máximo 5 botões numéricos + anterior + próximo", () => {
    render(
      <ClientSideTableFooter
        page={10}
        totalPages={25}
        filteredLength={300}
        pageSize={12}
        paginatedLength={12}
        onPageChange={vi.fn()}
        entityLabel="z"
        paginationTestId="pag"
      />,
    );
    const bar = screen.getByTestId("pag");
    expect(bar.querySelectorAll("button").length).toBe(7);
  });
});
