import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExcluirPedidoConfirmDialog } from "@/pages/pedidos/lista/components/ExcluirPedidoConfirmDialog";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span data-testid="icon" />,
}));

describe("ExcluirPedidoConfirmDialog", () => {
  it("mostra o código, Cancelar chama onCancel, Excluir chama onConfirm, X chama onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ExcluirPedidoConfirmDialog
        open
        onOpenChange={vi.fn()}
        pedidoCodigo="PED-99"
        isPending={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText("PED-99", { exact: false })).toBeInTheDocument();
    await user.click(screen.getByLabelText("Fechar"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    onCancel.mockClear();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /^excluir$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("isPending: botão excluir continua acessível (estado de loading)", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ExcluirPedidoConfirmDialog
        open
        onOpenChange={vi.fn()}
        pedidoCodigo="P"
        isPending
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    const ex = screen.getByRole("button", { name: /excluir/i });
    expect(ex).toBeDisabled();
  });
});
