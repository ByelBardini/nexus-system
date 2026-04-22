import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadastroRastreamentoToolbar } from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoToolbar";

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

describe("CadastroRastreamentoToolbar", () => {
  it("aciona abas de status", async () => {
    const user = userEvent.setup();
    const setFiltroStatus = vi.fn();
    render(
      <CadastroRastreamentoToolbar
        tecnicos={["A"]}
        filtroTecnico=""
        setFiltroTecnico={vi.fn()}
        filtroTipo=""
        setFiltroTipo={vi.fn()}
        periodo="hoje"
        setPeriodo={vi.fn()}
        filtroStatus="TODOS"
        setFiltroStatus={setFiltroStatus}
        temFiltroAtivo={false}
        onLimparFiltrosTecnicoETipo={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Concluído" }));
    expect(setFiltroStatus).toHaveBeenCalledWith("CONCLUIDO");
  });

  it("mostra Limpar quando há filtro ativo e limpa", async () => {
    const user = userEvent.setup();
    const limpar = vi.fn();
    render(
      <CadastroRastreamentoToolbar
        tecnicos={[]}
        filtroTecnico="A"
        setFiltroTecnico={vi.fn()}
        filtroTipo=""
        setFiltroTipo={vi.fn()}
        periodo="hoje"
        setPeriodo={vi.fn()}
        filtroStatus="TODOS"
        setFiltroStatus={vi.fn()}
        temFiltroAtivo
        onLimparFiltrosTecnicoETipo={limpar}
      />,
    );
    await user.click(screen.getByRole("button", { name: /limpar/i }));
    expect(limpar).toHaveBeenCalledTimes(1);
  });
});
