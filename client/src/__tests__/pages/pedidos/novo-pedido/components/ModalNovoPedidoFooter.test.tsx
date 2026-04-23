import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalNovoPedidoFooter } from "@/pages/pedidos/novo-pedido/components/ModalNovoPedidoFooter";

describe("ModalNovoPedidoFooter", () => {
  it("mostra Enviar Solicitação quando não está pending", () => {
    const onCancel = vi.fn();
    render(<ModalNovoPedidoFooter isPending={false} onCancel={onCancel} />);
    expect(screen.getByText("Enviar Solicitação")).toBeInTheDocument();
  });

  it("mostra Enviando... quando isPending (edge: bloqueia submit)", () => {
    const onCancel = vi.fn();
    render(<ModalNovoPedidoFooter isPending onCancel={onCancel} />);
    expect(screen.getByText("Enviando...")).toBeInTheDocument();
  });

  it("onCancel chama a prop", async () => {
    const u = userEvent.setup();
    const onCancel = vi.fn();
    render(<ModalNovoPedidoFooter isPending={false} onCancel={onCancel} />);
    await u.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
