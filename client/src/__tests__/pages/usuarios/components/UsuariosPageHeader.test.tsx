import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { UsuariosPageHeader } from "@/pages/usuarios/components/UsuariosPageHeader";

function renderH(props: {
  canCreate?: boolean;
  search?: string;
} = {}) {
  const onSearch = vi.fn();
  const onStatus = vi.fn();
  const onCreate = vi.fn();
  return {
    onSearch,
    onStatus,
    onCreate,
    ...render(
      <MemoryRouter>
        <UsuariosPageHeader
          search={props.search ?? ""}
          onSearchChange={onSearch}
          statusFilter="TODOS"
          onStatusFilterChange={onStatus}
          canCreate={props.canCreate ?? true}
          onOpenCreate={onCreate}
        />
      </MemoryRouter>,
    ),
  };
}

describe("UsuariosPageHeader", () => {
  it("Novo Usuário ausente sem permissão de criar", () => {
    renderH({ canCreate: false });
    expect(
      screen.queryByRole("button", { name: /novo usuário/i }),
    ).not.toBeInTheDocument();
  });

  it("dispara onSearch e onOpenCreate", async () => {
    const user = userEvent.setup();
    const { onSearch, onCreate } = renderH();
    await user.type(
      screen.getByPlaceholderText(/buscar por nome ou email/i),
      "a",
    );
    expect(onSearch).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /novo usuário/i }));
    expect(onCreate).toHaveBeenCalled();
  });
});
