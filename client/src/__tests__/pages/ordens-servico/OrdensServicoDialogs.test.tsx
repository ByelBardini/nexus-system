import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmIniciarTestesDialog } from "@/pages/ordens-servico/lista/components/ConfirmIniciarTestesDialog";
import { RetiradaRealizadaDialog } from "@/pages/ordens-servico/lista/components/RetiradaRealizadaDialog";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

describe("ConfirmIniciarTestesDialog", () => {
  it("fluxo confirmar e cancelar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmIniciarTestesDialog
        open
        onOpenChange={vi.fn()}
        onCancel={onCancel}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-dialog-iniciar-testes"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByTestId("ordens-servico-dialog-iniciar-confirmar"),
    );
    expect(onConfirm).toHaveBeenCalled();
    await user.click(
      screen.getByTestId("ordens-servico-dialog-iniciar-cancelar"),
    );
    expect(onCancel).toHaveBeenCalled();
  });

  it("edge: desabilita ações quando pendente", () => {
    render(
      <ConfirmIniciarTestesDialog
        open
        onOpenChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-dialog-iniciar-confirmar"),
    ).toBeDisabled();
    expect(
      screen.getByTestId("ordens-servico-dialog-iniciar-cancelar"),
    ).toBeDisabled();
  });
});

describe("RetiradaRealizadaDialog", () => {
  it("Sim e Não disparam callbacks", async () => {
    const user = userEvent.setup();
    const onSim = vi.fn();
    const onNao = vi.fn();
    render(
      <RetiradaRealizadaDialog
        open
        onOpenChange={vi.fn()}
        onClose={vi.fn()}
        onConfirmSim={onSim}
        onConfirmNao={onNao}
        isPending={false}
      />,
    );
    await user.click(screen.getByTestId("ordens-servico-dialog-retirada-sim"));
    expect(onSim).toHaveBeenCalled();
    await user.click(screen.getByTestId("ordens-servico-dialog-retirada-nao"));
    expect(onNao).toHaveBeenCalled();
  });

  it("edge: fechar header", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <RetiradaRealizadaDialog
        open
        onOpenChange={vi.fn()}
        onClose={onClose}
        onConfirmSim={vi.fn()}
        onConfirmNao={vi.fn()}
        isPending={false}
      />,
    );
    await user.click(
      screen.getByTestId("ordens-servico-dialog-retirada-fechar"),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
