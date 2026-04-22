import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ClientesPageHeader } from "@/pages/clientes/components/ClientesPageHeader";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

describe("ClientesPageHeader", () => {
  it("renderiza título e dispara busca ao digitar", async () => {
    const user = userEvent.setup();
    const onBuscaChange = vi.fn();
    render(
      <MemoryRouter>
        <ClientesPageHeader
          busca=""
          onBuscaChange={onBuscaChange}
          filtroTipoContrato="todos"
          onFiltroTipoContratoChange={vi.fn()}
          filtroEstoque="todos"
          onFiltroEstoqueChange={vi.fn()}
          canCreate={false}
          onNovoCliente={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /clientes/i })).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(/razão social ou cnpj/i),
      "acme",
    );
    expect(onBuscaChange).toHaveBeenCalled();
    const last = onBuscaChange.mock.calls.at(-1)?.[0] as string;
    expect(last).toBe("e");
  });

  it("exibe Novo Cliente quando canCreate e chama callback", async () => {
    const user = userEvent.setup();
    const onNovo = vi.fn();
    render(
      <MemoryRouter>
        <ClientesPageHeader
          busca=""
          onBuscaChange={vi.fn()}
          filtroTipoContrato="todos"
          onFiltroTipoContratoChange={vi.fn()}
          filtroEstoque="todos"
          onFiltroEstoqueChange={vi.fn()}
          canCreate
          onNovoCliente={onNovo}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /novo cliente/i }));
    expect(onNovo).toHaveBeenCalledTimes(1);
  });

  it("não exibe botão Novo Cliente quando canCreate é false", () => {
    render(
      <MemoryRouter>
        <ClientesPageHeader
          busca=""
          onBuscaChange={vi.fn()}
          filtroTipoContrato="todos"
          onFiltroTipoContratoChange={vi.fn()}
          filtroEstoque="todos"
          onFiltroEstoqueChange={vi.fn()}
          canCreate={false}
          onNovoCliente={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: /novo cliente/i }),
    ).not.toBeInTheDocument();
  });
});
