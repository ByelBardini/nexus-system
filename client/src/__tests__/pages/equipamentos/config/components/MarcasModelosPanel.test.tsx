import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { MarcasModelosPanel } from "@/pages/equipamentos/config/components/MarcasModelosPanel";
import type {
  MarcaRastreador,
  ModeloRastreador,
} from "@/pages/equipamentos/config/domain/equipamentos-config.types";
import { buildModelosByMarca } from "@/pages/equipamentos/config/domain/equipamentos-config.helpers";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const m1: MarcaRastreador = {
  id: 1,
  nome: "MarcaX",
  ativo: true,
  _count: { modelos: 1 },
};

const mod: ModeloRastreador = {
  id: 99,
  nome: "ModY",
  ativo: true,
  marca: { id: 1, nome: "MarcaX", ativo: true },
};

function createMutation(over: { isPending?: boolean } = {}) {
  return { isPending: false, mutate: vi.fn(), ...over } as UseMutationResult<
    unknown,
    Error,
    number,
    unknown
  >;
}

function baseProps(
  over: Partial<Parameters<typeof MarcasModelosPanel>[0]> = {},
) {
  const {
    deleteMarcaMutation = createMutation(),
    deleteModeloMutation = createMutation(),
    ...rest
  } = over;
  return {
    canEdit: true,
    searchMarcas: "",
    onSearchMarcas: vi.fn(),
    expandedMarcaIds: new Set<number>([1]),
    filteredMarcas: [m1],
    modelosByMarca: buildModelosByMarca([mod]),
    totalModelos: 1,
    onToggleMarca: vi.fn(),
    onOpenCreateMarca: vi.fn(),
    onOpenEditMarca: vi.fn(),
    onToggleAtivoMarca: vi.fn(),
    onDeleteMarca: vi.fn(),
    onOpenCreateModelo: vi.fn(),
    onOpenEditModelo: vi.fn(),
    onToggleAtivoModelo: vi.fn(),
    onDeleteModelo: vi.fn(),
    deleteMarcaMutation,
    deleteModeloMutation,
    ...rest,
  };
}

function marcaRowHeader(marcaNome: string) {
  const el = screen.getByText(marcaNome).closest("div.cursor-pointer");
  expect(el).toBeTruthy();
  return el as HTMLElement;
}

describe("MarcasModelosPanel", () => {
  it("exibe busca controlada, modelo e totais do rodapé (filtrado vs total global)", () => {
    render(
      <MarcasModelosPanel
        {...baseProps({
          searchMarcas: "filtro",
          filteredMarcas: [m1],
          totalModelos: 99,
        })}
      />,
    );
    const search = screen.getByPlaceholderText(
      "Pesquisar marca ou modelo...",
    ) as HTMLInputElement;
    expect(search.value).toBe("filtro");
    expect(screen.getByText("ModY")).toBeInTheDocument();
    expect(screen.getByText(/1 Marcas \/ 99 Modelos/)).toBeInTheDocument();
  });

  it("sem canEdit: sem Nova Marca e sem menu no cabeçalho da marca", () => {
    render(<MarcasModelosPanel {...baseProps({ canEdit: false })} />);
    expect(screen.queryByRole("button", { name: /nova marca/i })).toBeNull();
    expect(within(marcaRowHeader("MarcaX")).queryByRole("button")).toBeNull();
  });

  it("sem canEdit: menu por modelo (⋯) ainda é exibido — ações de modelo não dependem de canEdit", () => {
    render(<MarcasModelosPanel {...baseProps({ canEdit: false })} />);
    const modeloRow = screen.getByText("ModY").parentElement as HTMLElement;
    expect(within(modeloRow).getByRole("button")).toBeInTheDocument();
  });

  it("lista filtrada vazia mostra mensagem e totais zerados no rodapé", () => {
    render(
      <MarcasModelosPanel
        {...baseProps({ filteredMarcas: [], totalModelos: 0 })}
      />,
    );
    expect(screen.getByText("Nenhuma marca encontrada")).toBeInTheDocument();
    expect(screen.getByText(/0 Marcas \/ 0 Modelos/)).toBeInTheDocument();
  });

  it("busca repassa cada valor acumulado quando o valor controlado acompanha o estado (comportamento real)", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    const stable = baseProps();
    function Harness() {
      const [q, setQ] = useState("");
      return (
        <MarcasModelosPanel
          {...stable}
          searchMarcas={q}
          onSearchMarcas={(v) => {
            setQ(v);
            onSearch(v);
          }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByPlaceholderText("Pesquisar marca ou modelo...");
    await user.type(input, "ab");
    expect(onSearch.mock.calls.map((c) => c[0])).toEqual(["a", "ab"]);
    expect((input as HTMLInputElement).value).toBe("ab");
  });

  it("clicar no nome da marca chama onToggleMarca com o id correto", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const m2: MarcaRastreador = {
      id: 42,
      nome: "Outra",
      ativo: true,
      _count: { modelos: 0 },
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          filteredMarcas: [m1, m2],
          expandedMarcaIds: new Set(),
          onToggleMarca: onToggle,
        })}
      />,
    );
    await user.click(screen.getByText("Outra"));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(42);
  });

  it("abrir menu da marca não dispara onToggleMarca (stopPropagation)", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasModelosPanel
        {...baseProps({
          expandedMarcaIds: new Set(),
          onToggleMarca: onToggle,
        })}
      />,
    );
    await user.click(within(marcaRowHeader("MarcaX")).getByRole("button"));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("ícone reflete expandido vs colapsado", () => {
    const { rerender } = render(
      <MarcasModelosPanel {...baseProps({ expandedMarcaIds: new Set() })} />,
    );
    const header = marcaRowHeader("MarcaX");
    expect(header.querySelector('[data-icon="chevron_right"]')).toBeTruthy();

    rerender(
      <MarcasModelosPanel {...baseProps({ expandedMarcaIds: new Set([1]) })} />,
    );
    const headerExp = marcaRowHeader("MarcaX");
    expect(headerExp.querySelector('[data-icon="expand_more"]')).toBeTruthy();
    expect(headerExp.querySelector('[data-icon="chevron_right"]')).toBeNull();
  });

  it("Nova Marca chama onOpenCreateMarca exatamente uma vez, sem argumentos", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasModelosPanel {...baseProps({ onOpenCreateMarca: onOpen })} />,
    );
    await user.click(screen.getByRole("button", { name: /nova marca/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith();
  });

  it("marca inativa usa badge de contagem esmaecido (não azul)", () => {
    const inativa: MarcaRastreador = {
      ...m1,
      ativo: false,
      _count: { modelos: 3 },
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          filteredMarcas: [inativa],
          expandedMarcaIds: new Set(),
        })}
      />,
    );
    const badge = screen.getByText("03 MODELOS");
    expect(badge).toHaveClass("bg-slate-100", "text-slate-500");
    expect(badge).not.toHaveClass("bg-blue-100");
  });

  it("com modelos vinculados, menu da marca não oferece Excluir", async () => {
    const user = userEvent.setup();
    render(<MarcasModelosPanel {...baseProps()} />);
    await user.click(within(marcaRowHeader("MarcaX")).getByRole("button"));
    expect(
      await screen.findByRole("menuitem", { name: /^editar$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /^excluir$/i })).toBeNull();
  });

  it("Excluir marca fica desabilitado enquanto deleteMarcaMutation.isPending", async () => {
    const user = userEvent.setup();
    const marcaZero: MarcaRastreador = {
      id: 2,
      nome: "SóMarca",
      ativo: true,
      _count: { modelos: 0 },
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          filteredMarcas: [marcaZero],
          expandedMarcaIds: new Set(),
          modelosByMarca: new Map(),
          totalModelos: 0,
          deleteMarcaMutation: createMutation({ isPending: true }),
        })}
      />,
    );
    await user.click(within(marcaRowHeader("SóMarca")).getByRole("button"));
    const excluir = await screen.findByRole("menuitem", { name: /^excluir$/i });
    expect(excluir).toHaveAttribute("data-disabled");
  });

  it("menu da marca: editar, desativar e excluir quando sem modelos", async () => {
    const onEdit = vi.fn();
    const onToggleAtivo = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const marcaZero: MarcaRastreador = {
      id: 2,
      nome: "SóMarca",
      ativo: true,
      _count: { modelos: 0 },
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          filteredMarcas: [marcaZero],
          expandedMarcaIds: new Set(),
          modelosByMarca: new Map(),
          totalModelos: 0,
          onOpenEditMarca: onEdit,
          onToggleAtivoMarca: onToggleAtivo,
          onDeleteMarca: onDelete,
        })}
      />,
    );
    const trigger = within(marcaRowHeader("SóMarca")).getByRole("button");
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^editar$/i }));
    expect(onEdit).toHaveBeenLastCalledWith(marcaZero);

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^desativar$/i }));
    expect(onToggleAtivo).toHaveBeenLastCalledWith(marcaZero);

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^excluir$/i }));
    expect(onDelete).toHaveBeenLastCalledWith(2);
  });

  it("marca expandida sem modelos na lista nem no map exibe vazio", () => {
    const marcaZero: MarcaRastreador = {
      id: 3,
      nome: "Vazia",
      ativo: true,
      _count: { modelos: 0 },
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          filteredMarcas: [marcaZero],
          expandedMarcaIds: new Set([3]),
          modelosByMarca: new Map(),
          totalModelos: 0,
        })}
      />,
    );
    expect(screen.getByText("Nenhum modelo cadastrado")).toBeInTheDocument();
  });

  it("Novo Modelo no estado vazio passa o id da marca ao callback", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    const marcaZero: MarcaRastreador = {
      id: 3,
      nome: "Vazia",
      ativo: true,
      _count: { modelos: 0 },
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          filteredMarcas: [marcaZero],
          expandedMarcaIds: new Set([3]),
          modelosByMarca: new Map([[3, []]]),
          totalModelos: 0,
          onOpenCreateModelo: onCreate,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: /novo modelo/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(3);
  });

  it("modelo inativo: estilo, badge Desativado e menu com Ativar", async () => {
    const onEdit = vi.fn();
    const onToggle = vi.fn();
    const onDel = vi.fn();
    const user = userEvent.setup();
    const modInativo: ModeloRastreador = {
      ...mod,
      ativo: false,
      nome: "ModOff",
    };
    render(
      <MarcasModelosPanel
        {...baseProps({
          modelosByMarca: buildModelosByMarca([modInativo]),
          onOpenEditModelo: onEdit,
          onToggleAtivoModelo: onToggle,
          onDeleteModelo: onDel,
        })}
      />,
    );
    const nome = screen.getByText("ModOff");
    expect(nome).toHaveClass("line-through");
    expect(screen.getByText("Desativado")).toBeInTheDocument();

    const modeloRow = nome.parentElement as HTMLElement;
    const modeloMenuTrigger = within(modeloRow).getByRole("button");
    await user.click(modeloMenuTrigger);
    await user.click(screen.getByRole("menuitem", { name: /^editar$/i }));
    expect(onEdit).toHaveBeenLastCalledWith(modInativo);

    await user.click(modeloMenuTrigger);
    await user.click(screen.getByRole("menuitem", { name: /^ativar$/i }));
    expect(onToggle).toHaveBeenLastCalledWith(modInativo);

    await user.click(modeloMenuTrigger);
    await user.click(screen.getByRole("menuitem", { name: /^excluir$/i }));
    expect(onDel).toHaveBeenLastCalledWith(99);
  });

  it("Excluir modelo desabilitado quando deleteModeloMutation.isPending", async () => {
    const user = userEvent.setup();
    render(
      <MarcasModelosPanel
        {...baseProps({
          deleteModeloMutation: createMutation({ isPending: true }),
        })}
      />,
    );
    const modeloRow = screen.getByText("ModY").parentElement as HTMLElement;
    await user.click(within(modeloRow).getByRole("button"));
    const excluir = await screen.findByRole("menuitem", { name: /^excluir$/i });
    expect(excluir).toHaveAttribute("data-disabled");
  });

  it("com modelos, apenas o botão inferior Novo Modelo aparece (não o estado vazio)", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasModelosPanel {...baseProps({ onOpenCreateModelo: onCreate })} />,
    );
    expect(screen.queryByText("Nenhum modelo cadastrado")).toBeNull();
    const novos = screen.getAllByRole("button", { name: /novo modelo/i });
    expect(novos).toHaveLength(1);
    await user.click(novos[0]);
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(1);
  });
});
