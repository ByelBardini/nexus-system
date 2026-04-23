import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MarcasSimcardPanel } from "@/pages/equipamentos/config/components/MarcasSimcardPanel";
import type { MarcaSimcard } from "@/pages/equipamentos/config/domain/equipamentos-config.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const m: MarcaSimcard = {
  id: 1,
  nome: "SimM",
  operadoraId: 1,
  temPlanos: true,
  ativo: true,
  operadora: { id: 1, nome: "Vivo" },
  planos: [{ id: 1, marcaSimcardId: 1, planoMb: 500, ativo: true }],
};

function createMutation(over: { isPending?: boolean } = {}) {
  return { isPending: false, mutate: vi.fn(), ...over } as any;
}

function baseProps(
  over: Partial<Parameters<typeof MarcasSimcardPanel>[0]> = {},
) {
  const {
    deleteMarcaSimcardMutation = createMutation(),
    deletePlanoSimcardMutation = createMutation(),
    ...rest
  } = over;
  return {
    canEdit: true,
    searchMarcasSimcard: "",
    onSearchMarcasSimcard: vi.fn(),
    expandedMarcasSimcardIds: new Set([1]),
    filteredMarcasSimcard: [m],
    onToggleMarca: vi.fn(),
    onOpenCreateMarca: vi.fn(),
    onOpenEditMarca: vi.fn(),
    onToggleAtivo: vi.fn(),
    onDeleteMarca: vi.fn(),
    onOpenCreatePlano: vi.fn(),
    onOpenEditPlano: vi.fn(),
    onDeletePlano: vi.fn(),
    deleteMarcaSimcardMutation,
    deletePlanoSimcardMutation,
    ...rest,
  };
}

function marcaRowHeader(marcaNome: string) {
  const el = screen.getByText(marcaNome).closest("div.cursor-pointer");
  expect(el).toBeTruthy();
  return el as HTMLElement;
}

describe("MarcasSimcardPanel", () => {
  it("exibe marca, operadora, selos Tem planos/Ativo e plano ativo em MB", () => {
    render(<MarcasSimcardPanel {...baseProps()} />);
    expect(screen.getByText("SimM")).toBeInTheDocument();
    expect(screen.getByText("Vivo")).toBeInTheDocument();
    expect(screen.getByText("Tem planos")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("500 MB")).toBeInTheDocument();
  });

  it("temPlanos false: painel expandido mostra instrução em vez de lista", () => {
    const m2: MarcaSimcard = { ...m, temPlanos: false, planos: [] };
    render(
      <MarcasSimcardPanel
        {...baseProps({ filteredMarcasSimcard: [m2] })}
      />,
    );
    expect(
      screen.getByText(/Marca sem planos cadastrados/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/MB/)).toBeNull();
  });

  it("filtrar acumula caracteres quando o pai mantém searchMarcas sincronizado", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    const stable = baseProps();
    function Harness() {
      const [q, setQ] = useState("");
      return (
        <MarcasSimcardPanel
          {...stable}
          searchMarcasSimcard={q}
          onSearchMarcasSimcard={(v) => {
            setQ(v);
            onSearch(v);
          }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByPlaceholderText(
      "Filtrar por marca ou operadora...",
    );
    await user.type(input, "xy");
    expect(onSearch.mock.calls.map((c) => c[0])).toEqual(["x", "xy"]);
  });

  it("clicar no nome da marca dispara onToggleMarca com id correto (várias marcas)", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const mB: MarcaSimcard = {
      id: 7,
      nome: "MarcaB",
      operadoraId: 2,
      temPlanos: false,
      ativo: true,
      operadora: { id: 2, nome: "Claro" },
      planos: [],
    };
    render(
      <MarcasSimcardPanel
        {...baseProps({
          filteredMarcasSimcard: [m, mB],
          expandedMarcasSimcardIds: new Set(),
          onToggleMarca: onToggle,
        })}
      />,
    );
    await user.click(screen.getByText("MarcaB"));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(7);
  });

  it("abrir menu de configurações da marca não dispara onToggleMarca", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasSimcardPanel
        {...baseProps({
          expandedMarcasSimcardIds: new Set(),
          onToggleMarca: onToggle,
        })}
      />,
    );
    await user.click(within(marcaRowHeader("SimM")).getByRole("button"));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("marca inativa: nome esmaecido, selo Inativo e ícone chevron vs expand ao expandir", () => {
    const { rerender } = render(
      <MarcasSimcardPanel
        {...baseProps({
          filteredMarcasSimcard: [{ ...m, ativo: false }],
          expandedMarcasSimcardIds: new Set(),
        })}
      />,
    );
    const nome = screen.getByText("SimM");
    expect(nome).toHaveClass("text-slate-500");
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    const h = marcaRowHeader("SimM");
    expect(h.querySelector('[data-icon="chevron_right"]')).toBeTruthy();

    rerender(
      <MarcasSimcardPanel
        {...baseProps({
          filteredMarcasSimcard: [{ ...m, ativo: false }],
          expandedMarcasSimcardIds: new Set([1]),
        })}
      />,
    );
    const h2 = marcaRowHeader("SimM");
    expect(h2.querySelector('[data-icon="expand_more"]')).toBeTruthy();
  });

  it("lista só planos ativos: inativos não aparecem na UI", () => {
    const mp: MarcaSimcard = {
      ...m,
      planos: [
        { id: 1, marcaSimcardId: 1, planoMb: 500, ativo: true },
        { id: 2, marcaSimcardId: 1, planoMb: 999, ativo: false },
      ],
    };
    render(<MarcasSimcardPanel {...baseProps({ filteredMarcasSimcard: [mp] })} />);
    expect(screen.getByText("500 MB")).toBeInTheDocument();
    expect(screen.queryByText("999 MB")).toBeNull();
  });

  it("temPlanos true e nenhum plano ativo: estado vazio + Adicionar Plano", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    const mp: MarcaSimcard = {
      ...m,
      planos: [{ id: 9, marcaSimcardId: 1, planoMb: 100, ativo: false }],
    };
    render(
      <MarcasSimcardPanel
        {...baseProps({
          filteredMarcasSimcard: [mp],
          onOpenCreatePlano: onCreate,
        })}
      />,
    );
    expect(screen.getByText("Nenhum plano cadastrado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /adicionar plano/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(1);
  });

  it("planos undefined com temPlanos: mesmo estado vazio", () => {
    const mSemPlanosKey = { ...m, planos: undefined } as MarcaSimcard;
    render(
      <MarcasSimcardPanel
        {...baseProps({ filteredMarcasSimcard: [mSemPlanosKey] })}
      />,
    );
    expect(screen.getByText("Nenhum plano cadastrado")).toBeInTheDocument();
  });

  it("vários planos ativos: todos aparecem; rodapé Adicionar Plano chama id da marca", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    const mp: MarcaSimcard = {
      ...m,
      planos: [
        { id: 1, marcaSimcardId: 1, planoMb: 100, ativo: true },
        { id: 2, marcaSimcardId: 1, planoMb: 200, ativo: true },
      ],
    };
    render(
      <MarcasSimcardPanel
        {...baseProps({
          filteredMarcasSimcard: [mp],
          onOpenCreatePlano: onCreate,
        })}
      />,
    );
    expect(screen.getByText("100 MB")).toBeInTheDocument();
    expect(screen.getByText("200 MB")).toBeInTheDocument();
    const addBtns = screen.getAllByRole("button", { name: /adicionar plano/i });
    await user.click(addBtns[addBtns.length - 1]);
    expect(onCreate).toHaveBeenCalledWith(1);
  });

  it("menu da marca: editar, desativar e excluir na ordem esperada", async () => {
    const onEdit = vi.fn();
    const onToggle = vi.fn();
    const onDel = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasSimcardPanel
        {...baseProps({
          expandedMarcasSimcardIds: new Set(),
          onOpenEditMarca: onEdit,
          onToggleAtivo: onToggle,
          onDeleteMarca: onDel,
        })}
      />,
    );
    const trigger = within(marcaRowHeader("SimM")).getByRole("button");
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^editar$/i }));
    expect(onEdit).toHaveBeenLastCalledWith(m);

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^desativar$/i }));
    expect(onToggle).toHaveBeenLastCalledWith(m);

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: /^excluir$/i }));
    expect(onDel).toHaveBeenLastCalledWith(1);
  });

  it("marca inativa: item de menu é Ativar", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const mi: MarcaSimcard = { ...m, ativo: false };
    render(
      <MarcasSimcardPanel
        {...baseProps({
          filteredMarcasSimcard: [mi],
          expandedMarcasSimcardIds: new Set(),
          onToggleAtivo: onToggle,
        })}
      />,
    );
    await user.click(within(marcaRowHeader("SimM")).getByRole("button"));
    expect(
      screen.queryByRole("menuitem", { name: /^desativar$/i }),
    ).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: /^ativar$/i }));
    expect(onToggle).toHaveBeenCalledWith(mi);
  });

  it("menu do plano: editar e excluir; Excluir desabilitado se mutation pendente", async () => {
    const onEdit = vi.fn();
    const onDel = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasSimcardPanel
        {...baseProps({
          onOpenEditPlano: onEdit,
          onDeletePlano: onDel,
          deletePlanoSimcardMutation: createMutation({ isPending: true }),
        })}
      />,
    );
    const planoRow = screen.getByText("500 MB").parentElement as HTMLElement;
    const planoTrigger = within(planoRow).getByRole("button");
    await user.click(planoTrigger);
    await user.click(screen.getByRole("menuitem", { name: /^editar$/i }));
    expect(onEdit).toHaveBeenCalledWith(m.planos![0]);

    await user.click(planoTrigger);
    const excluir = screen.getByRole("menuitem", { name: /^excluir$/i });
    expect(excluir).toHaveAttribute("data-disabled");
    expect(onDel).not.toHaveBeenCalled();
  });

  it("sem canEdit: sem Nova Marca, sem Adicionar Plano e sem menu nos planos", () => {
    render(<MarcasSimcardPanel {...baseProps({ canEdit: false })} />);
    expect(screen.queryByRole("button", { name: /nova marca/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /adicionar plano/i }),
    ).toBeNull();
    const planoRow = screen.getByText("500 MB").parentElement as HTMLElement;
    expect(within(planoRow).queryByRole("button")).toBeNull();
  });

  it("lista vazia: mensagem e total zero", () => {
    render(
      <MarcasSimcardPanel
        {...baseProps({ filteredMarcasSimcard: [] })}
      />,
    );
    expect(
      screen.getByText("Nenhuma marca de simcard encontrada"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total: 0 Marcas de Simcard/)).toBeInTheDocument();
  });

  it("Nova Marca dispara callback uma vez com o evento de clique (handler passado direto ao Button)", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasSimcardPanel {...baseProps({ onOpenCreateMarca: onOpen })} />,
    );
    await user.click(screen.getByRole("button", { name: /nova marca/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0]).toEqual(
      expect.objectContaining({ type: "click" }),
    );
  });

  it("Selo Sem planos quando temPlanos é false", () => {
    const m2: MarcaSimcard = { ...m, temPlanos: false, planos: [] };
    render(
      <MarcasSimcardPanel
        {...baseProps({ filteredMarcasSimcard: [m2] })}
      />,
    );
    expect(screen.getByText("Sem planos")).toBeInTheDocument();
  });
});
