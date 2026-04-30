import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoriaFalhaModal } from "@/pages/tabelas-config/categorias-falha/CategoriaFalhaModal";
import type { CategoriaFalha } from "@/pages/tabelas-config/categorias-falha/useCategoriasFalhaConfig";

const catExistente: CategoriaFalha = {
  id: 1,
  nome: "Dano Físico",
  ativo: true,
  motivaTexto: true,
  criadoEm: "2026-01-01T00:00:00.000Z",
};

describe("CategoriaFalhaModal", () => {
  describe("modo criar", () => {
    it("exibe título 'Nova Categoria de Falha'", () => {
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={false}
        />,
      );
      expect(screen.getByText(/nova categoria de falha/i)).toBeInTheDocument();
    });

    it("começa com nome vazio e switch desmarcado", () => {
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={false}
        />,
      );
      expect(screen.getByLabelText(/nome/i)).toHaveValue("");
      const sw = screen.getByRole("switch");
      expect(sw).not.toBeChecked();
    });

    it("botão Salvar fica desabilitado enquanto nome é vazio", () => {
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={false}
        />,
      );
      expect(screen.getByRole("button", { name: /^salvar$/i })).toBeDisabled();
    });

    it("preencher nome habilita o botão Salvar", async () => {
      const user = userEvent.setup();
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={false}
        />,
      );
      await user.type(screen.getByLabelText(/nome/i), "Falha Elétrica");
      expect(screen.getByRole("button", { name: /^salvar$/i })).toBeEnabled();
    });

    it("clicar Salvar chama onSalvar com nome trimado e motivaTexto=false por padrão", async () => {
      const onSalvar = vi.fn();
      const user = userEvent.setup();
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={vi.fn()}
          onSalvar={onSalvar}
          isPending={false}
        />,
      );
      await user.type(screen.getByLabelText(/nome/i), "  Nova Cat  ");
      await user.click(screen.getByRole("button", { name: /^salvar$/i }));
      expect(onSalvar).toHaveBeenCalledWith({ nome: "Nova Cat", motivaTexto: false });
    });

    it("ativar switch e salvar envia motivaTexto=true", async () => {
      const onSalvar = vi.fn();
      const user = userEvent.setup();
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={vi.fn()}
          onSalvar={onSalvar}
          isPending={false}
        />,
      );
      await user.type(screen.getByLabelText(/nome/i), "Outro");
      await user.click(screen.getByRole("switch"));
      await user.click(screen.getByRole("button", { name: /^salvar$/i }));
      expect(onSalvar).toHaveBeenCalledWith({ nome: "Outro", motivaTexto: true });
    });

    it("clicar Cancelar chama onFechar sem chamar onSalvar", async () => {
      const onFechar = vi.fn();
      const onSalvar = vi.fn();
      const user = userEvent.setup();
      render(
        <CategoriaFalhaModal
          open={true}
          modo="criar"
          onFechar={onFechar}
          onSalvar={onSalvar}
          isPending={false}
        />,
      );
      await user.click(screen.getByRole("button", { name: /cancelar/i }));
      expect(onFechar).toHaveBeenCalled();
      expect(onSalvar).not.toHaveBeenCalled();
    });
  });

  describe("modo editar", () => {
    it("exibe título 'Editar Categoria' e preenche campos com os dados do item", () => {
      render(
        <CategoriaFalhaModal
          open={true}
          modo="editar"
          item={catExistente}
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={false}
        />,
      );
      expect(screen.getByText(/editar categoria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome/i)).toHaveValue("Dano Físico");
      expect(screen.getByRole("switch")).toBeChecked();
    });

    it("editar nome e salvar envia valor atualizado", async () => {
      const onSalvar = vi.fn();
      const user = userEvent.setup();
      render(
        <CategoriaFalhaModal
          open={true}
          modo="editar"
          item={catExistente}
          onFechar={vi.fn()}
          onSalvar={onSalvar}
          isPending={false}
        />,
      );
      const input = screen.getByLabelText(/nome/i);
      await user.clear(input);
      await user.type(input, "Dano Físico Atualizado");
      await user.click(screen.getByRole("button", { name: /^salvar$/i }));
      expect(onSalvar).toHaveBeenCalledWith({
        nome: "Dano Físico Atualizado",
        motivaTexto: true,
      });
    });
  });

  describe("estado isPending", () => {
    it("botões ficam desabilitados enquanto isPending=true", () => {
      render(
        <CategoriaFalhaModal
          open={true}
          modo="editar"
          item={catExistente}
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={true}
        />,
      );
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
    });

    it("texto do botão Salvar muda para 'Salvando...' quando isPending=true", () => {
      render(
        <CategoriaFalhaModal
          open={true}
          modo="editar"
          item={catExistente}
          onFechar={vi.fn()}
          onSalvar={vi.fn()}
          isPending={true}
        />,
      );
      expect(screen.getByText(/salvando\.\.\./i)).toBeInTheDocument();
    });
  });
});
