import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CancelarOperacaoTesteDialog } from "@/pages/testes/components/CancelarOperacaoTesteDialog";

const defaultHandlers = () => ({
  onOpenChange: vi.fn(),
  onReagendar: vi.fn(),
  onCancelarOs: vi.fn(),
});

type Handlers = ReturnType<typeof defaultHandlers>;

function renderOpen(
  overrides: Partial<
    ComponentProps<typeof CancelarOperacaoTesteDialog> & Handlers
  > = {},
) {
  const handlers = defaultHandlers();
  const {
    onOpenChange = handlers.onOpenChange,
    onReagendar = handlers.onReagendar,
    onCancelarOs = handlers.onCancelarOs,
    open = true,
    canAct = true,
    isPending = false,
    ...rest
  } = overrides;

  const result = render(
    <CancelarOperacaoTesteDialog
      open={open}
      onOpenChange={onOpenChange}
      onReagendar={onReagendar}
      onCancelarOs={onCancelarOs}
      canAct={canAct}
      isPending={isPending}
      {...rest}
    />,
  );

  return {
    ...result,
    onOpenChange,
    onReagendar,
    onCancelarOs,
  };
}

function getDialog() {
  return screen.getByRole("dialog", { name: /cancelar operação/i });
}

describe("CancelarOperacaoTesteDialog", () => {
  describe("visibilidade e conteúdo", () => {
    it("com open=true expõe dialog nomeado e texto explicativo", () => {
      renderOpen();
      const dialog = getDialog();
      expect(dialog).toBeVisible();
      expect(
        within(dialog).getByText(
          /o que deseja fazer com esta ordem de serviço/i,
        ),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText("help", {
          selector: ".material-symbols-outlined",
        }),
      ).toBeInTheDocument();
    });

    it("com open=false não deixa dialog no documento (modo controlado fechado)", () => {
      renderOpen({ open: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Reagendar e Cancelar OS", () => {
    it("chama cada handler exatamente uma vez ao clicar na respectiva ação", async () => {
      const user = userEvent.setup();
      const { onReagendar, onCancelarOs, onOpenChange } = renderOpen();

      await user.click(
        within(getDialog()).getByRole("button", { name: /^reagendar$/i }),
      );
      expect(onReagendar).toHaveBeenCalledTimes(1);
      expect(onCancelarOs).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();

      await user.click(
        within(getDialog()).getByRole("button", { name: /^cancelar os$/i }),
      );
      expect(onCancelarOs).toHaveBeenCalledTimes(1);
      expect(onReagendar).toHaveBeenCalledTimes(1);
    });

    it("não chama onReagendar nem onCancelarOs quando canAct é false", async () => {
      const user = userEvent.setup();
      const { onReagendar, onCancelarOs } = renderOpen({ canAct: false });
      const dialog = getDialog();

      const reagendar = within(dialog).getByRole("button", {
        name: /^reagendar$/i,
      });
      const cancelarOs = within(dialog).getByRole("button", {
        name: /^cancelar os$/i,
      });
      expect(reagendar).toBeDisabled();
      expect(cancelarOs).toBeDisabled();

      await user.click(reagendar);
      await user.click(cancelarOs);
      expect(onReagendar).not.toHaveBeenCalled();
      expect(onCancelarOs).not.toHaveBeenCalled();
    });

    it("não chama onReagendar nem onCancelarOs quando isPending é true", async () => {
      const user = userEvent.setup();
      const { onReagendar, onCancelarOs } = renderOpen({ isPending: true });
      const dialog = getDialog();

      const reagendar = within(dialog).getByRole("button", {
        name: /^reagendar$/i,
      });
      const cancelarOs = within(dialog).getByRole("button", {
        name: /^cancelar os$/i,
      });
      expect(reagendar).toBeDisabled();
      expect(cancelarOs).toBeDisabled();

      await user.click(reagendar);
      await user.click(cancelarOs);
      expect(onReagendar).not.toHaveBeenCalled();
      expect(onCancelarOs).not.toHaveBeenCalled();
    });

    it("mantém ações desabilitadas quando canAct e isPending são ambos restritivos", () => {
      renderOpen({ canAct: false, isPending: true });
      const dialog = getDialog();
      expect(
        within(dialog).getByRole("button", { name: /^reagendar$/i }),
      ).toBeDisabled();
      expect(
        within(dialog).getByRole("button", { name: /^cancelar os$/i }),
      ).toBeDisabled();
    });
  });

  describe("fechamento (deve sempre poder sair do fluxo)", () => {
    it.each([
      ["Voltar", /^voltar$/i],
      ["Fechar (header)", /^fechar$/i],
    ] as const)(
      "via %s chama onOpenChange(false) uma vez",
      async (_label, name) => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        renderOpen({ onOpenChange });

        await user.click(within(getDialog()).getByRole("button", { name }));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      },
    );

    it("via Escape propaga fechamento pelo handler do Radix Dialog", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderOpen({ onOpenChange });

      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("via clique no overlay (irmão anterior ao painel) fecha como interação do Radix", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderOpen({ onOpenChange });
      const dialog = getDialog();
      const overlay = dialog.previousElementSibling;
      expect(overlay).not.toBeNull();
      expect(overlay).toBeInstanceOf(HTMLElement);

      await user.click(overlay as HTMLElement);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("permite Voltar e Fechar mesmo com canAct false (ordem sem OS selecionada)", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderOpen({ onOpenChange, canAct: false });
      const dialog = getDialog();

      await user.click(
        within(dialog).getByRole("button", { name: /^voltar$/i }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);

      onOpenChange.mockClear();
      await user.click(
        within(dialog).getByRole("button", { name: /^fechar$/i }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("permite fechar com Voltar enquanto isPending (mutation em andamento)", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { onReagendar, onCancelarOs } = renderOpen({
        onOpenChange,
        isPending: true,
      });

      await user.click(
        within(getDialog()).getByRole("button", { name: /^voltar$/i }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onReagendar).not.toHaveBeenCalled();
      expect(onCancelarOs).not.toHaveBeenCalled();
    });

    it("Escape ainda fecha quando canAct é false", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderOpen({ onOpenChange, canAct: false });

      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
