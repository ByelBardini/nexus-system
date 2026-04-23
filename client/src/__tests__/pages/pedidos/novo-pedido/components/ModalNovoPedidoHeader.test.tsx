import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalNovoPedidoHeader } from "@/pages/pedidos/novo-pedido/components/ModalNovoPedidoHeader";

describe("ModalNovoPedidoHeader", () => {
  it("chama onClose ao clicar no X", async () => {
    const u = userEvent.setup();
    const onClose = vi.fn();
    render(<ModalNovoPedidoHeader onClose={onClose} />);
    await u.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
