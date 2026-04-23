import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadastroRastreamentoToolbar } from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoToolbar";
import { CADASTRO_RAST_STATUS_TABS } from "@/lib/cadastro-rastreamento-ui";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

type ToolbarField = "Técnico" | "Tipo de Registro" | "Período";

function comboboxNoCampo(nome: ToolbarField) {
  const label = screen.getByText(nome, { selector: "label" });
  const col = label.closest("div.flex.flex-col");
  if (!col) {
    throw new Error(`envoltório do campo «${nome}» não encontrado`);
  }
  return within(col).getByRole("combobox");
}

function renderToolbar(
  override: Partial<Parameters<typeof CadastroRastreamentoToolbar>[0]> = {},
) {
  const onLimparFiltrosTecnicoETipo = vi.fn();
  const setFiltroTecnico = vi.fn();
  const setFiltroTipo = vi.fn();
  const setFiltroStatus = vi.fn();
  const setPeriodo = vi.fn();
  const r = render(
    <CadastroRastreamentoToolbar
      tecnicos={[]}
      filtroTecnico=""
      setFiltroTecnico={setFiltroTecnico}
      filtroTipo=""
      setFiltroTipo={setFiltroTipo}
      periodo="hoje"
      setPeriodo={setPeriodo}
      filtroStatus="TODOS"
      setFiltroStatus={setFiltroStatus}
      temFiltroAtivo={false}
      onLimparFiltrosTecnicoETipo={onLimparFiltrosTecnicoETipo}
      {...override}
    />,
  );
  return {
    ...r,
    onLimparFiltrosTecnicoETipo,
    setFiltroTecnico,
    setFiltroTipo,
    setFiltroStatus,
    setPeriodo,
  };
}

describe("CadastroRastreamentoToolbar", () => {
  it("não exibe o botão Limpar enquanto temFiltroAtivo é falso, mesmo com técnico preenchido no estado (pai decide o flag)", () => {
    renderToolbar({
      tecnicos: [],
      filtroTecnico: "João",
      temFiltroAtivo: false,
    });
    expect(
      screen.queryByRole("button", { name: /limpar/i }),
    ).not.toBeInTheDocument();
  });

  it("cada aba de status chama setFiltroStatus exatamente uma vez com o valor de domínio correto", async () => {
    const user = userEvent.setup();
    const { setFiltroStatus } = renderToolbar();
    for (const tab of CADASTRO_RAST_STATUS_TABS) {
      setFiltroStatus.mockClear();
      await user.click(screen.getByRole("button", { name: tab.label }));
      expect(setFiltroStatus).toHaveBeenCalledTimes(1);
      expect(setFiltroStatus).toHaveBeenCalledWith(tab.value);
    }
  });

  it("destaca a aba correspondente ao filtro de status ativo (estado 'selecionado')", () => {
    const { unmount } = renderToolbar({ filtroStatus: "EM_CADASTRO" });
    const ativa = screen.getByRole("button", { name: "Em Cadastro" });
    const outra = screen.getByRole("button", { name: "Aguardando" });
    expect(ativa).toHaveClass("bg-erp-blue", "text-white", "border-erp-blue");
    expect(outra).not.toHaveClass("bg-erp-blue");
    unmount();
  });

  it("muda o período e chama setPeriodo com o valor canônico da API (hoje / semana / mês)", async () => {
    const user = userEvent.setup();
    const { setPeriodo } = renderToolbar();
    await user.click(comboboxNoCampo("Período"));
    await user.click(screen.getByRole("option", { name: "Esta semana" }));
    expect(setPeriodo).toHaveBeenLastCalledWith("semana");
    setPeriodo.mockClear();
    await user.click(comboboxNoCampo("Período"));
    await user.click(screen.getByRole("option", { name: "Este mês" }));
    expect(setPeriodo).toHaveBeenLastCalledWith("mes");
  });

  it("Limpar: visível com filtro ativo, chama só onLimpar; não dispara setters de filtro", async () => {
    const user = userEvent.setup();
    const {
      onLimparFiltrosTecnicoETipo: onLimpar,
      setFiltroTecnico,
      setFiltroTipo,
    } = renderToolbar({
      filtroTecnico: "A",
      temFiltroAtivo: true,
    });
    const limpar = screen.getByRole("button", { name: /limpar/i });
    expect(within(limpar).getByTestId("icon-close")).toBeInTheDocument();
    setFiltroTecnico.mockClear();
    setFiltroTipo.mockClear();
    await user.click(limpar);
    expect(onLimpar).toHaveBeenCalledTimes(1);
    expect(setFiltroTecnico).not.toHaveBeenCalled();
    expect(setFiltroTipo).not.toHaveBeenCalled();
  });

  it("Técnico: escolhe um nome, depois Todos aplica string vazia (reservado internamente como «Todos»)", async () => {
    const user = userEvent.setup();
    const { setFiltroTecnico, rerender } = renderToolbar({
      tecnicos: ["Maria (matriz)"],
    });
    await user.click(comboboxNoCampo("Técnico"));
    await user.click(
      screen.getByRole("option", { name: "Maria (matriz)" }),
    );
    expect(setFiltroTecnico).toHaveBeenLastCalledWith("Maria (matriz)");

    rerender(
      <CadastroRastreamentoToolbar
        tecnicos={["Maria (matriz)"]}
        filtroTecnico="Maria (matriz)"
        setFiltroTecnico={setFiltroTecnico}
        filtroTipo=""
        setFiltroTipo={vi.fn()}
        periodo="hoje"
        setPeriodo={vi.fn()}
        filtroStatus="TODOS"
        setFiltroStatus={vi.fn()}
        temFiltroAtivo
        onLimparFiltrosTecnicoETipo={vi.fn()}
      />,
    );
    await user.click(comboboxNoCampo("Técnico"));
    await user.click(screen.getByRole("option", { name: "Todos" }));
    expect(setFiltroTecnico).toHaveBeenLastCalledWith("");
  });

  it("Tipo de registro: Instalação e Retirada mapeiam para códigos da API; Todos reseta o filtro", async () => {
    const user = userEvent.setup();
    const { setFiltroTipo, rerender } = renderToolbar();
    await user.click(comboboxNoCampo("Tipo de Registro"));
    await user.click(screen.getByRole("option", { name: "Instalação" }));
    expect(setFiltroTipo).toHaveBeenLastCalledWith("CADASTRO");
    setFiltroTipo.mockClear();

    await user.click(comboboxNoCampo("Tipo de Registro"));
    await user.click(screen.getByRole("option", { name: "Retirada" }));
    expect(setFiltroTipo).toHaveBeenLastCalledWith("RETIRADA");

    rerender(
      <CadastroRastreamentoToolbar
        tecnicos={[]}
        filtroTecnico=""
        setFiltroTecnico={vi.fn()}
        filtroTipo="RETIRADA"
        setFiltroTipo={setFiltroTipo}
        periodo="hoje"
        setPeriodo={vi.fn()}
        filtroStatus="TODOS"
        setFiltroStatus={vi.fn()}
        temFiltroAtivo
        onLimparFiltrosTecnicoETipo={vi.fn()}
      />,
    );
    await user.click(comboboxNoCampo("Tipo de Registro"));
    await user.click(screen.getByRole("option", { name: "Todos" }));
    expect(setFiltroTipo).toHaveBeenLastCalledWith("");
  });
});
