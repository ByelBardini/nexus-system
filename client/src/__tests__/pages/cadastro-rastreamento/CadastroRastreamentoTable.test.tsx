import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadastroRastreamentoTable } from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoTable";
import type { OrdemCadastro } from "@/lib/cadastro-rastreamento.types";
import { ordemMinima } from "./cadastro-rastreamento.fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

function ordem(over: Partial<OrdemCadastro>): OrdemCadastro {
  return { ...ordemMinima, ...over };
}

describe("CadastroRastreamentoTable", () => {
  it("mostra carregando", () => {
    render(
      <CadastroRastreamentoTable
        isLoading
        ordensFiltradas={[]}
        selectedId={null}
        onToggleRow={vi.fn()}
      />,
    );
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("mostra vazio quando não há ordens", () => {
    render(
      <CadastroRastreamentoTable
        isLoading={false}
        ordensFiltradas={[]}
        selectedId={null}
        onToggleRow={vi.fn()}
      />,
    );
    expect(screen.getByText(/nenhuma ordem encontrada/i)).toBeInTheDocument();
  });

  it("alterna seleção ao clicar na linha", async () => {
    const user = userEvent.setup();
    const onToggleRow = vi.fn();
    const uma = ordem({ id: 99, cliente: "ClienteZ" });
    render(
      <CadastroRastreamentoTable
        isLoading={false}
        ordensFiltradas={[uma]}
        selectedId={null}
        onToggleRow={onToggleRow}
      />,
    );
    await user.click(screen.getByText("ClienteZ"));
    expect(onToggleRow).toHaveBeenCalledWith(99);
  });
});
