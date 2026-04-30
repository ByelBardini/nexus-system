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

function defaultProps(overrides: Partial<Parameters<typeof CategoriasFalhaTable>[0]> = {}) {
  return {
    categorias: [] as CategoriaFalha[],
    canEdit: false,
    onEditar: vi.fn(),
    onToggleAtivo: vi.fn(),
    isDesativando: false,
    search: "",
    onSearch: vi.fn(),
    ...overrides,
  };
}

describe("CategoriasFalhaTable", () => {
  it("sem categorias exibe placeholder", () => {
    render(<CategoriasFalhaTable {...defaultProps()} />);
    expect(
      screen.getByText(/nenhuma categoria cadastrada/i),
    ).toBeInTheDocument();
  });

  it("renderiza o nome de cada categoria", () => {
    render(
      <CategoriasFalhaTable
        {...defaultProps({ categorias: [ativa, comTexto] })}
      />,
    );
    expect(screen.getByText("Dano Físico / Carcaça")).toBeInTheDocument();
    expect(screen.getByText("Outro")).toBeInTheDocument();
  });

  it("motivaTexto=true exibe badge 'Sim'; false exibe 'Não'", () => {
    render(
      <CategoriasFalhaTable
        {...defaultProps({ categorias: [ativa, comTexto] })}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]!).getByText("Não")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Sim")).toBeInTheDocument();
  });

  it("categoria inativa exibe 'Inativo'", () => {
    render(
      <CategoriasFalhaTable {...defaultProps({ categorias: [inativa] })} />,
    );
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("categoria inativa tem classe opacity-60 na linha", () => {
    render(
      <CategoriasFalhaTable {...defaultProps({ categorias: [inativa] })} />,
    );
    const row = screen.getAllByRole("row")[1]!;
    expect(row.className).toMatch(/opacity-60/);
  });

  it("canEdit=false: não exibe botão de ações (dropdown trigger)", () => {
    render(
      <CategoriasFalhaTable {...defaultProps({ categorias: [ativa] })} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("canEdit=true: abre dropdown e clica Editar → chama onEditar com a categoria", async () => {
    const onEditar = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoriasFalhaTable
        {...defaultProps({ categorias: [ativa], canEdit: true, onEditar })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ações/i }));
    await user.click(screen.getByRole("menuitem", { name: /editar/i }));
    expect(onEditar).toHaveBeenCalledWith(ativa);
  });

  it("dropdown Desativar → chama onToggleAtivo com a categoria correta", async () => {
    const onToggleAtivo = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoriasFalhaTable
        {...defaultProps({
          categorias: [ativa],
          canEdit: true,
          onToggleAtivo,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ações/i }));
    await user.click(screen.getByRole("menuitem", { name: /desativar/i }));
    expect(onToggleAtivo).toHaveBeenCalledWith(ativa);
  });

  it("categoria inativa não exibe item Desativar no dropdown", async () => {
    const user = userEvent.setup();
    render(
      <CategoriasFalhaTable
        {...defaultProps({ categorias: [inativa], canEdit: true })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ações/i }));
    expect(
      screen.queryByRole("menuitem", { name: /desativar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /editar/i }),
    ).toBeInTheDocument();
  });

  it("isDesativando=true: item Desativar está desabilitado no dropdown", async () => {
    const user = userEvent.setup();
    render(
      <CategoriasFalhaTable
        {...defaultProps({
          categorias: [ativa],
          canEdit: true,
          isDesativando: true,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ações/i }));
    const item = screen.getByRole("menuitem", { name: /desativar/i });
    expect(item).toHaveAttribute("aria-disabled", "true");
  });

  it("exibe campo de busca e chama onSearch ao digitar", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<CategoriasFalhaTable {...defaultProps({ onSearch })} />);

    const input = screen.getByPlaceholderText(/filtrar categorias/i);
    await user.type(input, "dan");
    expect(onSearch).toHaveBeenCalled();
  });

  it("footer exibe total de categorias", () => {
    render(
      <CategoriasFalhaTable
        {...defaultProps({ categorias: [ativa, comTexto] })}
      />,
    );
    expect(screen.getByText(/total.*2.*categori/i)).toBeInTheDocument();
  });
});
