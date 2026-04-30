import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoriasFalhaTable } from "@/pages/tabelas-config/categorias-falha/CategoriasFalhaTable";
import type { CategoriaFalha } from "@/pages/tabelas-config/categorias-falha/useCategoriasFalhaConfig";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden="true" />
  ),
}));

const ativa: CategoriaFalha = {
  id: 1,
  nome: "Dano Físico / Carcaça",
  ativo: true,
  motivaTexto: false,
  criadoEm: "2026-01-01T00:00:00.000Z",
};

const comTexto: CategoriaFalha = {
  id: 2,
  nome: "Outro",
  ativo: true,
  motivaTexto: true,
  criadoEm: "2026-01-01T00:00:00.000Z",
};

const inativa: CategoriaFalha = {
  id: 3,
  nome: "Obsoleta",
  ativo: false,
  motivaTexto: false,
  criadoEm: "2026-01-01T00:00:00.000Z",
};

describe("CategoriasFalhaTable", () => {
  it("sem categorias exibe placeholder", () => {
    render(
      <CategoriasFalhaTable
        categorias={[]}
        canEdit={false}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );
    expect(screen.getByText(/nenhuma categoria cadastrada/i)).toBeInTheDocument();
  });

  it("renderiza o nome de cada categoria", () => {
    render(
      <CategoriasFalhaTable
        categorias={[ativa, comTexto]}
        canEdit={false}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );
    expect(screen.getByText("Dano Físico / Carcaça")).toBeInTheDocument();
    expect(screen.getByText("Outro")).toBeInTheDocument();
  });

  it("motivaTexto=true exibe badge 'Sim'; false exibe 'Não'", () => {
    render(
      <CategoriasFalhaTable
        categorias={[ativa, comTexto]}
        canEdit={false}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]!).getByText("Não")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Sim")).toBeInTheDocument();
  });

  it("categoria inativa exibe 'Inativo' e tem classe opacity-50", () => {
    render(
      <CategoriasFalhaTable
        categorias={[inativa]}
        canEdit={false}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    const row = screen.getAllByRole("row")[1]!;
    expect(row.className).toMatch(/opacity-50/);
  });

  it("canEdit=false: coluna Ações não aparece e não há botões", () => {
    render(
      <CategoriasFalhaTable
        categorias={[ativa]}
        canEdit={false}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );
    expect(screen.queryByText("Ações")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("canEdit=true: botão Editar chama onEditar com a categoria correta", async () => {
    const onEditar = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoriasFalhaTable
        categorias={[ativa]}
        canEdit={true}
        onEditar={onEditar}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /editar/i }));
    expect(onEditar).toHaveBeenCalledWith(ativa);
  });

  it("botão Desativar chama onDesativar com o id correto", async () => {
    const onDesativar = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoriasFalhaTable
        categorias={[ativa]}
        canEdit={true}
        onEditar={vi.fn()}
        onDesativar={onDesativar}
        isDesativando={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /desativar/i }));
    expect(onDesativar).toHaveBeenCalledWith(1);
  });

  it("categoria inativa não exibe botão Desativar", () => {
    render(
      <CategoriasFalhaTable
        categorias={[inativa]}
        canEdit={true}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={false}
      />,
    );
    expect(screen.queryByRole("button", { name: /desativar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("isDesativando=true: botão Desativar fica desabilitado", () => {
    render(
      <CategoriasFalhaTable
        categorias={[ativa]}
        canEdit={true}
        onEditar={vi.fn()}
        onDesativar={vi.fn()}
        isDesativando={true}
      />,
    );
    expect(screen.getByRole("button", { name: /desativar/i })).toBeDisabled();
  });
});
