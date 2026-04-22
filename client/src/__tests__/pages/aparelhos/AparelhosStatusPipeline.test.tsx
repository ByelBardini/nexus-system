import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AparelhosStatusPipeline } from "@/pages/aparelhos/lista/AparelhosStatusPipeline";

describe("AparelhosStatusPipeline", () => {
  const statusCounts = {
    EM_ESTOQUE: 3,
    CONFIGURADO: 1,
    DESPACHADO: 0,
    COM_TECNICO: 2,
    INSTALADO: 5,
  };

  it("renderiza pipeline e dispara onStatusClick ao clicar em Em Estoque", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();

    render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={statusCounts}
        totalCount={11}
        onStatusClick={onStatusClick}
      />,
    );

    expect(screen.getByTestId("aparelhos-status-pipeline")).toBeInTheDocument();
    expect(screen.getByTestId("aparelhos-status-total")).toHaveTextContent(
      "11",
    );

    await user.click(screen.getByTestId("aparelhos-status-em_estoque"));
    expect(onStatusClick).toHaveBeenCalledWith("EM_ESTOQUE");
  });

  it("destaque visual quando filtro ativo (Total)", () => {
    const { container } = render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={statusCounts}
        totalCount={11}
        onStatusClick={vi.fn()}
      />,
    );
    const totalBtn = screen.getByTestId("aparelhos-status-total");
    expect(totalBtn.className).toMatch(/border-t-blue-500/);
    expect(container.querySelectorAll("button")).toHaveLength(6);
  });

  it("edge: contagens zero ainda renderizam botões", () => {
    const zero = {
      EM_ESTOQUE: 0,
      CONFIGURADO: 0,
      DESPACHADO: 0,
      COM_TECNICO: 0,
      INSTALADO: 0,
    };
    render(
      <AparelhosStatusPipeline
        statusFilter="INSTALADO"
        statusCounts={zero}
        totalCount={0}
        onStatusClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId("aparelhos-status-instalado")).toHaveTextContent(
      "0",
    );
  });
});
