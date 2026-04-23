import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NovoPedidoResumosInformativos } from "@/pages/pedidos/novo-pedido/components/NovoPedidoResumosInformativos";

describe("NovoPedidoResumosInformativos", () => {
  it("MISTO: lista quantidades e labels (Infinity e cliente)", () => {
    const fields = [{ id: "a" }, { id: "b" }] as never;
    render(
      <NovoPedidoResumosInformativos
        tipoDestino="MISTO"
        itensMistoFields={fields}
        itensMisto={[
          { proprietario: "INFINITY", quantidade: 1 },
          { proprietario: "CLIENTE", quantidade: 2, clienteId: 1 },
        ]}
        clientes={[{ id: 1, nome: "Cli1" }]}
        nomeDestinatario={null}
        quantidade={1}
      />,
    );
    expect(screen.getByText(/Distribuição do pedido/)).toBeInTheDocument();
    expect(screen.getByText(/1× → Infinity/)).toBeInTheDocument();
    expect(screen.getByText(/2× → Cli1/)).toBeInTheDocument();
  });

  it("não MISTO: exibe resumo com nome ou ... quando sem nome (edge)", () => {
    const fields: never[] = [];
    const { container } = render(
      <NovoPedidoResumosInformativos
        tipoDestino="TECNICO"
        itensMistoFields={fields}
        itensMisto={[]}
        clientes={[]}
        nomeDestinatario={null}
        quantidade={5}
      />,
    );
    expect(container.textContent).toContain("5 unidades");
    expect(container.textContent).toContain("...");
  });
});
