import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DebitosEquipamentosFilters } from "@/pages/debitos-equipamentos/components/DebitosEquipamentosFilters";

describe("DebitosEquipamentosFilters", () => {
  const opcoes = [
    { value: "", label: "Todos" },
    { value: "A", label: "Pessoa A" },
  ];

  it("dispara onBuscaChange ao digitar", async () => {
    const user = userEvent.setup();
    const onBusca = vi.fn();
    render(
      <DebitosEquipamentosFilters
        busca=""
        onBuscaChange={onBusca}
        filtroDevedor=""
        onFiltroDevedorChange={vi.fn()}
        filtroModelo=""
        onFiltroModeloChange={vi.fn()}
        filtroStatus="todos"
        onFiltroStatusChange={vi.fn()}
        opcoesDevedor={opcoes}
        opcoesModelo={opcoes}
        onClearFilters={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText("Devedor ou credor..."), "x");
    expect(onBusca).toHaveBeenCalled();
  });

  it("aba Aberto chama onFiltroStatusChange", async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn();
    render(
      <DebitosEquipamentosFilters
        busca=""
        onBuscaChange={vi.fn()}
        filtroDevedor=""
        onFiltroDevedorChange={vi.fn()}
        filtroModelo=""
        onFiltroModeloChange={vi.fn()}
        filtroStatus="todos"
        onFiltroStatusChange={onStatus}
        opcoesDevedor={opcoes}
        opcoesModelo={opcoes}
        onClearFilters={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Aberto" }));
    expect(onStatus).toHaveBeenCalledWith("aberto");
  });

  it("mostra Limpar quando há filtro ativo e dispara onClearFilters", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <DebitosEquipamentosFilters
        busca="foo"
        onBuscaChange={vi.fn()}
        filtroDevedor=""
        onFiltroDevedorChange={vi.fn()}
        filtroModelo=""
        onFiltroModeloChange={vi.fn()}
        filtroStatus="todos"
        onFiltroStatusChange={vi.fn()}
        opcoesDevedor={opcoes}
        opcoesModelo={opcoes}
        onClearFilters={onClear}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Limpar/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("não mostra Limpar sem filtros ativos", () => {
    render(
      <DebitosEquipamentosFilters
        busca=""
        onBuscaChange={vi.fn()}
        filtroDevedor=""
        onFiltroDevedorChange={vi.fn()}
        filtroModelo=""
        onFiltroModeloChange={vi.fn()}
        filtroStatus="todos"
        onFiltroStatusChange={vi.fn()}
        opcoesDevedor={opcoes}
        opcoesModelo={opcoes}
        onClearFilters={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Limpar/i }),
    ).not.toBeInTheDocument();
  });
});
