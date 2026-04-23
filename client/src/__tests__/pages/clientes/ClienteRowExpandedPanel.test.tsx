import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClienteRowExpandedPanel } from "@/pages/clientes/components/ClienteRowExpandedPanel";
import type { Cliente } from "@/pages/clientes/shared/clientes-page.shared";

function clienteBase(over: Partial<Cliente> = {}): Cliente {
  return {
    id: 1,
    nome: "A",
    nomeFantasia: null,
    cnpj: null,
    tipoContrato: "COMODATO",
    estoqueProprio: false,
    status: "ATIVO",
    cep: "01310100",
    logradouro: "Rua Teste",
    numero: "1",
    bairro: "B",
    cidade: "C",
    estado: "ST",
    contatos: [],
    ...over,
  };
}

describe("ClienteRowExpandedPanel", () => {
  it("mostra endereço formatado quando há cep/logradouro/cidade", () => {
    render(
      <ClienteRowExpandedPanel
        cliente={clienteBase()}
        canEdit={false}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/Rua Teste/)).toBeInTheDocument();
    expect(screen.getByText(/01310-100/)).toBeInTheDocument();
  });

  it("sem contatos: mensagem placeholder", () => {
    render(
      <ClienteRowExpandedPanel
        cliente={clienteBase({
          cep: null,
          logradouro: null,
          cidade: null,
        })}
        canEdit={false}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/nenhum contato cadastrado/i)).toBeInTheDocument();
  });

  it("com contatos: exibe nome e telefone formatado", () => {
    render(
      <ClienteRowExpandedPanel
        cliente={clienteBase({
          contatos: [
            {
              id: 9,
              nome: "Maria",
              celular: "11987654321",
              email: "m@x.com",
            },
          ],
        })}
        canEdit={false}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("(11) 98765-4321")).toBeInTheDocument();
  });

  it("canEdit: botão Editar chama onEdit e stopPropagation não quebra", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const c = clienteBase({ id: 3 });
    render(<ClienteRowExpandedPanel cliente={c} canEdit onEdit={onEdit} />);
    await user.click(screen.getByRole("button", { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(c);
  });

  it("canEdit false: sem botão editar", () => {
    render(
      <ClienteRowExpandedPanel
        cliente={clienteBase()}
        canEdit={false}
        onEdit={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /editar/i }),
    ).not.toBeInTheDocument();
  });
});
