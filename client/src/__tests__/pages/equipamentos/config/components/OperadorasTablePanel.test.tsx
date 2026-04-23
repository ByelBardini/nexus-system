import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { OperadorasTablePanel } from "@/pages/equipamentos/config/components/OperadorasTablePanel";
import type { Operadora } from "@/pages/equipamentos/config/domain/equipamentos-config.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const op: Operadora = { id: 1, nome: "Vivo", ativo: true };

function createMutation(over: { isPending?: boolean } = {}) {
  return { isPending: false, mutate: vi.fn(), ...over } as UseMutationResult<
    unknown,
    Error,
    number,
    unknown
  >;
}

function baseProps(
  over: Partial<Parameters<typeof OperadorasTablePanel>[0]> = {},
) {
  const { deleteOperadoraMutation = createMutation(), ...rest } = over;
  return {
    canEdit: true,
    searchOperadoras: "",
    onSearchOperadoras: vi.fn(),
    filteredOperadoras: [op],
    onOpenCreateOperadora: vi.fn(),
    onOpenEditOperadora: vi.fn(),
    onToggleAtivo: vi.fn(),
    onDelete: vi.fn(),
    deleteOperadoraMutation,
    ...rest,
  };
}

describe("OperadorasTablePanel", () => {
  it("mostra linha ativa, selo Ativo e total coerente com lista filtrada", () => {
    render(<OperadorasTablePanel {...baseProps()} />);
    const nome = screen.getByText("Vivo");
    expect(nome).toHaveClass("text-slate-800");
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(
      screen.getByText(/Total: 1 Operadoras Registradas/),
    ).toBeInTheDocument();
  });

  it("busca acumula texto quando searchOperadoras e valor controlado estão sincronizados", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    const stable = baseProps();
    function Harness() {
      const [q, setQ] = useState("");
      return (
        <OperadorasTablePanel
          {...stable}
          searchOperadoras={q}
          onSearchOperadoras={(v) => {
            setQ(v);
            onSearch(v);
          }}
        />
      );
    }
    render(<Harness />);
    await user.type(screen.getByPlaceholderText("Filtrar operadoras..."), "oi");
    expect(onSearch.mock.calls.map((c) => c[0])).toEqual(["o", "oi"]);
  });

  it("sem canEdit: esconde botão Nova, coluna de ações e botões por linha", () => {
    const { container } = render(
      <OperadorasTablePanel
        {...baseProps({ canEdit: false, filteredOperadoras: [op] })}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /nova operadora/i }),
    ).toBeNull();
    expect(container.querySelectorAll("thead th")).toHaveLength(2);
    const row = screen.getByText("Vivo").closest("tr");
    expect(within(row as HTMLElement).queryByRole("button")).toBeNull();
  });

  it("Nova Operadora: um disparo com evento de clique (handler direto no Button)", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <OperadorasTablePanel
        {...baseProps({ onOpenCreateOperadora: onOpen })}
      />,
    );
    await user.click(screen.getByRole("button", { name: /nova operadora/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0]).toEqual(
      expect.objectContaining({ type: "click" }),
    );
  });

  it("menu na linha correta: editar segunda operadora passa o objeto dela", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const op2: Operadora = { id: 2, nome: "Claro", ativo: true };
    render(
      <OperadorasTablePanel
        {...baseProps({
          filteredOperadoras: [op, op2],
          onOpenEditOperadora: onEdit,
        })}
      />,
    );
    const row2 = screen.getByText("Claro").closest("tr") as HTMLElement;
    await user.click(within(row2).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /^editar$/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(op2);
  });

  it("menu: desativar operadora ativa e excluir com id numérico", async () => {
    const onToggle = vi.fn();
    const onDel = vi.fn();
    const user = userEvent.setup();
    render(
      <OperadorasTablePanel
        {...baseProps({
          onToggleAtivo: onToggle,
          onDelete: onDel,
        })}
      />,
    );
    const row = screen.getByText("Vivo").closest("tr") as HTMLElement;
    const trigger = within(row).getByRole("button");
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^desativar$/i }));
    expect(onToggle).toHaveBeenLastCalledWith(op);

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^excluir$/i }));
    expect(onDel).toHaveBeenLastCalledWith(1);
  });

  it("Excluir fica desabilitado enquanto deleteOperadoraMutation.isPending", async () => {
    const user = userEvent.setup();
    render(
      <OperadorasTablePanel
        {...baseProps({
          deleteOperadoraMutation: createMutation({ isPending: true }),
        })}
      />,
    );
    const row = screen.getByText("Vivo").closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button"));
    const excluir = await screen.findByRole("menuitem", { name: /^excluir$/i });
    expect(excluir).toHaveAttribute("data-disabled");
  });

  it("operadora inativa: texto esmaecido, status Inativo e menu oferece Ativar", async () => {
    const inativa: Operadora = { id: 2, nome: "Oi", ativo: false };
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <OperadorasTablePanel
        {...baseProps({
          filteredOperadoras: [inativa],
          onToggleAtivo: onToggle,
        })}
      />,
    );
    expect(screen.getByText("Oi")).toHaveClass("text-slate-500");
    const row = screen.getByText("Oi").closest("tr") as HTMLElement;
    expect(row.className).toMatch(/opacity-60/);
    await user.click(within(row).getByRole("button"));
    expect(screen.queryByRole("menuitem", { name: /^desativar$/i })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: /^ativar$/i }));
    expect(onToggle).toHaveBeenCalledWith(inativa);
  });

  it("lista vazia: mensagem com colspan 3 quando canEdit", () => {
    const { container } = render(
      <OperadorasTablePanel {...baseProps({ filteredOperadoras: [] })} />,
    );
    const emptyCell = container.querySelector("td[colspan='3']");
    expect(emptyCell?.textContent).toMatch(/Nenhuma operadora encontrada/);
  });

  it("lista vazia sem canEdit: colspan 2", () => {
    const { container } = render(
      <OperadorasTablePanel
        {...baseProps({ canEdit: false, filteredOperadoras: [] })}
      />,
    );
    const emptyCell = container.querySelector("td[colspan='2']");
    expect(emptyCell?.textContent).toMatch(/Nenhuma operadora encontrada/);
  });
});
