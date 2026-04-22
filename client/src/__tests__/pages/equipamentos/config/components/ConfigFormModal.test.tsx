import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfigFormModal } from "@/pages/equipamentos/config/components/ConfigFormModal";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function Harness({
  open: initial = true,
  savePending = false,
  saveDisabled = false,
}: {
  open?: boolean;
  savePending?: boolean;
  saveDisabled?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <div>
      <ConfigFormModal
        open={open}
        title="Título Teste"
        headerIcon="settings"
        onClose={() => setOpen(false)}
        onSave={vi.fn()}
        savePending={savePending}
        saveDisabled={saveDisabled}
      >
        <div className="p-6">Conteúdo</div>
      </ConfigFormModal>
    </div>
  );
}

describe("ConfigFormModal", () => {
  it("exibe título, ícone no header, corpo e botões", () => {
    render(<Harness />);
    expect(
      screen.getByRole("heading", { name: "Título Teste" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("Salvar e Cancelar disparam ações: cancelar chama onClose", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    function F() {
      return (
        <ConfigFormModal
          open
          title="M"
          headerIcon="x"
          onClose={onClose}
          onSave={onSave}
          savePending={false}
        >
          <div className="p-6" />
        </ConfigFormModal>
      );
    }
    render(<F />);
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("em estado de salvando desabilita botões e muda rótulo", () => {
    render(<Harness savePending />);
    expect(
      screen.getByRole("button", { name: "Salvando..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("saveDisabled bloqueia salvar sem estar pending", () => {
    render(<Harness saveDisabled />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });
});
