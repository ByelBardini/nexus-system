import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PedidosRastreadoresListToolbar } from "@/pages/pedidos/lista/components/PedidosRastreadoresListToolbar";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span data-testid="search-icon" />,
}));

describe("PedidosRastreadoresListToolbar", () => {
  it("onValueChange: cada tecla chama a prop com o valor do input", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PedidosRastreadoresListToolbar
        value=""
        onValueChange={onValueChange}
        placeholder="ph"
        searchTestId="busca"
      />,
    );
    await user.type(screen.getByTestId("busca"), "a");
    expect(onValueChange).toHaveBeenLastCalledWith("a");
  });

  it("rightSlot: renderiza ações extras (ex. botão)", () => {
    render(
      <PedidosRastreadoresListToolbar
        value=""
        onValueChange={vi.fn()}
        placeholder="p"
        rightSlot={<button type="button">Ação</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Ação" }),
    ).toBeInTheDocument();
  });
});
