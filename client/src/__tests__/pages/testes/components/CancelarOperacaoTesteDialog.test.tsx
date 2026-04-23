import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CancelarOperacaoTesteDialog } from "@/pages/testes/components/CancelarOperacaoTesteDialog";

describe("CancelarOperacaoTesteDialog", () => {
  it("Reagendar e Cancelar OS chamam handlers", async () => {
    const user = userEvent.setup();
    const onReagendar = vi.fn();
    const onCancelarOs = vi.fn();
    render(
      <CancelarOperacaoTesteDialog
        open
        onOpenChange={vi.fn()}
        onReagendar={onReagendar}
        onCancelarOs={onCancelarOs}
        canAct
        isPending={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /reagendar/i }));
    await user.click(screen.getByRole("button", { name: /cancelar os/i }));
    expect(onReagendar).toHaveBeenCalled();
    expect(onCancelarOs).toHaveBeenCalled();
  });

  it("edge: canAct false desabilita ações principais", () => {
    render(
      <CancelarOperacaoTesteDialog
        open
        onOpenChange={vi.fn()}
        onReagendar={vi.fn()}
        onCancelarOs={vi.fn()}
        canAct={false}
        isPending={false}
      />,
    );
    expect(screen.getByRole("button", { name: /reagendar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancelar os/i })).toBeDisabled();
  });

  it("edge: Voltar chama onOpenChange ao fechar via botão", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <CancelarOperacaoTesteDialog
        open
        onOpenChange={onOpenChange}
        onReagendar={vi.fn()}
        onCancelarOs={vi.fn()}
        canAct
        isPending={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^voltar$/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
