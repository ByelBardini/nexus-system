import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RetiradaRealizadaDialog } from "@/pages/testes/components/RetiradaRealizadaDialog";

describe("RetiradaRealizadaDialog", () => {
  it("chama onConfirm(true) ao clicar Sim", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <RetiradaRealizadaDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^sim$/i }));
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it("chama onConfirm(false) ao clicar Não", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <RetiradaRealizadaDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^não$/i }));
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it("edge: desabilita botões quando isPending", () => {
    render(
      <RetiradaRealizadaDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    );
    expect(screen.getByRole("button", { name: /^sim$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^não$/i })).toBeDisabled();
  });

  it("edge: fechar header chama onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <RetiradaRealizadaDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /fechar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
