import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientesTableFooter } from "@/pages/clientes/components/ClientesTableFooter";
import type { ClientesFooterStats } from "@/pages/clientes/shared/clientes-page.shared";

describe("ClientesTableFooter", () => {
  const stats: ClientesFooterStats = {
    exibindo: 3,
    totalCadastro: 10,
    ativosNaSelecao: 2,
  };

  it("mostra contagens e legenda", () => {
    render(
      <ClientesTableFooter
        footerStats={stats}
        page={0}
        totalPages={2}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );
    expect(screen.getByText(/exibindo 3 de 10/i)).toBeInTheDocument();
    expect(screen.getByText(/2 ativo\(s\) na seleção/i)).toBeInTheDocument();
    expect(screen.getByText(/página 1 de 2/i)).toBeInTheDocument();
  });

  it("botão anterior desabilitado na primeira página", () => {
    render(
      <ClientesTableFooter
        footerStats={stats}
        page={0}
        totalPages={3}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );
    const prev = screen.getAllByRole("button")[0];
    expect(prev).toBeDisabled();
  });

  it("botão próximo desabilitado na última página", () => {
    render(
      <ClientesTableFooter
        footerStats={stats}
        page={2}
        totalPages={3}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button");
    const next = buttons[buttons.length - 1];
    expect(next).toBeDisabled();
  });

  it("uma única página: anterior e próximo desabilitados", () => {
    render(
      <ClientesTableFooter
        footerStats={stats}
        page={0}
        totalPages={1}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });
});
