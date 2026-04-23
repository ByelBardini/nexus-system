import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfigFormModal } from "@/pages/equipamentos/config/components/ConfigFormModal";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} data-testid="material-icon" aria-hidden />
  ),
}));

function Harness({
  open: initial = true,
  savePending = false,
  saveDisabled = false,
  onSave = vi.fn(),
  onClose = vi.fn(),
}: {
  open?: boolean;
  savePending?: boolean;
  saveDisabled?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <div>
      <ConfigFormModal
        open={open}
        title="Título Teste"
        headerIcon="settings"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        onSave={onSave}
        savePending={savePending}
        saveDisabled={saveDisabled}
      >
        <div className="p-6">Conteúdo</div>
      </ConfigFormModal>
    </div>
  );
}

describe("ConfigFormModal", () => {
  it("exibe título, ícone no header, corpo (children) e ações padrão", async () => {
    const onSave = vi.fn();
    render(<Harness onSave={onSave} />);
    const dialog = await screen.findByRole("dialog", {}, { timeout: 10_000 });
    expect(
      within(dialog).getByRole("heading", { name: "Título Teste" }),
    ).toBeInTheDocument();
    const icons = within(dialog).getAllByTestId("material-icon");
    expect(icons[0]).toHaveAttribute("data-icon", "settings");
    expect(within(dialog).getByText("Conteúdo")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toBeEnabled();
    expect(
      within(dialog).getByRole("button", { name: "Salvar" }),
    ).toBeEnabled();
  });

  it("Salvar chama onSave uma vez; Cancelar e X do header propagam onClose", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfigFormModal
        open
        title="M"
        headerIcon="tune"
        onClose={onClose}
        onSave={onSave}
        savePending={false}
      >
        <div className="p-6" />
      </ConfigFormModal>,
    );
    const iconEls = screen.getAllByTestId("material-icon");
    expect(iconEls[0]).toHaveAttribute("data-icon", "tune");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    const xBtn = screen
      .getByRole("heading", { name: "M" })
      .closest("header")
      ?.querySelector("button");
    await user.click(xBtn!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("em salvando: rótulo 'Salvando...', salvar e cancelar desabilitados, onSave não dispara de novo se clicar", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ConfigFormModal
        open
        title="Pendente"
        headerIcon="x"
        onClose={vi.fn()}
        onSave={onSave}
        savePending
        saveLabel="Aplicar"
      >
        <div />
      </ConfigFormModal>,
    );
    const salvar = screen.getByRole("button", { name: "Salvando..." });
    expect(salvar).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
    await user.click(salvar);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saveDisabled: salvar desabilitado e clique não chama onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ConfigFormModal
        open
        title="Bloq"
        headerIcon="x"
        onClose={vi.fn()}
        onSave={onSave}
        savePending={false}
        saveDisabled
      >
        <div />
      </ConfigFormModal>,
    );
    const btn = screen.getByRole("button", { name: "Salvar" });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saveLabel customizado é o nome acessível do botão de envio", () => {
    render(
      <ConfigFormModal
        open
        title="T"
        headerIcon="t"
        onClose={vi.fn()}
        onSave={vi.fn()}
        savePending={false}
        saveLabel="Confirmar alteração"
      >
        <div />
      </ConfigFormModal>,
    );
    expect(
      screen.getByRole("button", { name: "Confirmar alteração" }),
    ).toBeInTheDocument();
  });

  it("com open=false, conteúdo do modal (título visível) não é apresentado", () => {
    render(
      <ConfigFormModal
        open={false}
        title="Oculto"
        headerIcon="x"
        onClose={vi.fn()}
        onSave={vi.fn()}
        savePending={false}
      >
        <div />
      </ConfigFormModal>,
    );
    expect(
      screen.queryByRole("heading", { name: "Oculto" }),
    ).not.toBeInTheDocument();
  });

  it("Escape (onOpenChange false) chama onClose e não onSave", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(
      <ConfigFormModal
        open
        title="Fecha"
        headerIcon="x"
        onClose={onClose}
        onSave={onSave}
        savePending={false}
      >
        <div>corpo</div>
      </ConfigFormModal>,
    );
    expect(screen.getByText("corpo")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
