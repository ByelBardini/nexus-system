import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClientesTable } from "@/pages/clientes/components/ClientesTable";
import type { Cliente } from "@/pages/clientes/shared/clientes-page.shared";

function rowCliente(id: number, nome: string): Cliente {
  return {
    id,
    nome,
    nomeFantasia: null,
    cnpj: null,
    tipoContrato: "COMODATO",
    estoqueProprio: false,
    status: "ATIVO",
    contatos: [],
  };
}

describe("ClientesTable", () => {
  it("alterna expansão ao clicar na linha", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const list = [rowCliente(2, "Beta")];

    const { rerender } = render(
      <ClientesTable
        paginated={list}
        expandedId={null}
        onToggleExpand={onToggle}
        canEdit={false}
        onEditCliente={onEdit}
      />,
    );

    await user.click(screen.getByText("Beta"));
    expect(onToggle).toHaveBeenCalledWith(2);

    rerender(
      <ClientesTable
        paginated={list}
        expandedId={2}
        onToggleExpand={onToggle}
        canEdit={false}
        onEditCliente={onEdit}
      />,
    );
    expect(screen.getByText(/meios de contato/i)).toBeInTheDocument();
  });

  it("exibe CNPJ como traço quando ausente", () => {
    render(
      <ClientesTable
        paginated={[rowCliente(5, "Sem CNPJ")]}
        expandedId={null}
        onToggleExpand={vi.fn()}
        canEdit={false}
        onEditCliente={vi.fn()}
      />,
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
