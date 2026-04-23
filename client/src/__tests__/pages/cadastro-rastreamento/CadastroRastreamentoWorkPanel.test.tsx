import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadastroRastreamentoWorkPanel } from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoWorkPanel";
import type { OrdemCadastro } from "@/types/cadastro-rastreamento";
import { mapCadastroRastreamentoOS } from "@/lib/cadastro-rastreamento-mapper";
import { osRespostaBase } from "./cadastro-rastreamento.fixtures";
import { getAuxilioCopiaItens } from "@/lib/cadastro-rastreamento-copy";

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

describe("CadastroRastreamentoWorkPanel", () => {
  it("mostra empty state sem ordem", () => {
    render(
      <CadastroRastreamentoWorkPanel
        selectedOrdem={null}
        plataforma="GETRAK"
        setPlataforma={vi.fn()}
        isMutating={false}
        handleAvancarStatus={vi.fn()}
        copiar={vi.fn()}
        copiarTodos={vi.fn()}
        auxilioCopiaItens={[]}
      />,
    );
    expect(screen.getByText(/selecione uma os/i)).toBeInTheDocument();
  });

  it("AGUARDANDO exibe botão iniciar e chama ação", async () => {
    const user = userEvent.setup();
    const onAvancar = vi.fn();
    const o = mapCadastroRastreamentoOS({
      ...osRespostaBase,
      statusCadastro: "AGUARDANDO",
    });
    render(
      <CadastroRastreamentoWorkPanel
        selectedOrdem={o}
        plataforma="GETRAK"
        setPlataforma={vi.fn()}
        isMutating={false}
        handleAvancarStatus={onAvancar}
        copiar={vi.fn()}
        copiarTodos={vi.fn()}
        auxilioCopiaItens={getAuxilioCopiaItens(o)}
      />,
    );
    const btn = screen.getByRole("button", { name: /iniciar revisão/i });
    await user.click(btn);
    expect(onAvancar).toHaveBeenCalled();
  });

  it("CONCLUIDO mostra botão desabilitado de concluído", () => {
    const o: OrdemCadastro = {
      ...mapCadastroRastreamentoOS({
        ...osRespostaBase,
        statusCadastro: "CONCLUIDO",
        plataforma: "GETRAK",
        concluidoEm: "2024-01-01T10:00:00.000Z",
      }),
    };
    render(
      <CadastroRastreamentoWorkPanel
        selectedOrdem={o}
        plataforma="GETRAK"
        setPlataforma={vi.fn()}
        isMutating={false}
        handleAvancarStatus={vi.fn()}
        copiar={vi.fn()}
        copiarTodos={vi.fn()}
        auxilioCopiaItens={getAuxilioCopiaItens(o)}
      />,
    );
    const btn = screen.getByRole("button", { name: /revisão concluída/i });
    expect(btn).toBeDisabled();
  });
});
