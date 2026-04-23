import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { UsuariosDataTable } from "@/pages/usuarios/components/UsuariosDataTable";
import { usuarioListItemFixture } from "../fixtures";

describe("UsuariosDataTable", () => {
  it("linha, expansão e ações (mock)", async () => {
    const u = usuarioListItemFixture({ id: 2, nome: "Beta" });
    const onToggle = vi.fn();
    const onReset = vi.fn();
    const onEdit = vi.fn();
    const onToggleSt = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <UsuariosDataTable
        users={[u]}
        expandedId={null}
        onToggleExpand={onToggle}
        totalPermissions={3}
        canEdit
        currentUserId={1}
        onResetPassword={onReset}
        onEdit={onEdit}
        onToggleStatus={onToggleSt}
        resetPasswordPending={false}
      />,
    );
    await user.click(screen.getByText("Beta"));
    expect(onToggle).toHaveBeenCalledWith(2);
    rerender(
      <UsuariosDataTable
        users={[u]}
        expandedId={2}
        onToggleExpand={onToggle}
        totalPermissions={3}
        canEdit
        currentUserId={1}
        onResetPassword={onReset}
        onEdit={onEdit}
        onToggleStatus={onToggleSt}
        resetPasswordPending={false}
      />,
    );
    expect(
      await screen.findByText(/audit trail & segurança/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /editar usuário/i }));
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, nome: "Beta" }),
    );
  });
});
