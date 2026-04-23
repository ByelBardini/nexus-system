import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PareamentoLoteSimSelect } from "@/pages/equipamentos/pareamento/components/PareamentoLoteSimSelect";
import type { LotePareamentoListItem } from "@/pages/equipamentos/pareamento/domain/types";
import type { MarcaSimcardPareamentoCatalog } from "@/pages/equipamentos/pareamento/domain/types";

const marcas: MarcaSimcardPareamentoCatalog[] = [
  {
    id: 5,
    nome: "Getrak",
    operadoraId: 1,
    temPlanos: false,
    operadora: { id: 1, nome: "Vivo" },
  },
  {
    id: 6,
    nome: "Outra",
    operadoraId: 1,
    temPlanos: false,
    operadora: { id: 1, nome: "Vivo" },
  },
];

const loteBase = (o: Partial<LotePareamentoListItem> = {}): LotePareamentoListItem => ({
  id: 20,
  referencia: "SIM-1",
  quantidadeDisponivelSemId: 2,
  modelo: null,
  marca: null,
  operadora: "Vivo",
  marcaSimcardId: 5,
  ...o,
});

describe("PareamentoLoteSimSelect", () => {
  it("loteLabelClassName: label custom; showLoteLabel=false: sem rótulo Lote", () => {
    const { unmount, rerender } = render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
        marcasSimcard={marcas}
        loteLabelClassName="lbl-sim"
        showLoteLabel
      />,
    );
    expect(
      document.querySelector(".lbl-sim")?.textContent,
    ).toBe("Lote");
    unmount();

    render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
        marcasSimcard={marcas}
        showLoteLabel={false}
      />,
    );
    expect(
      screen.queryByText("Lote", { exact: true }),
    ).not.toBeInTheDocument();
  });

  it("resolve marca pelo id; se id inexistente no catálogo, sufixo mostra só operadora", async () => {
    const user = userEvent.setup();
    render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[
          loteBase({ id: 1, referencia: "A", marcaSimcardId: 999, operadora: "Claro" }),
        ]}
        marcasSimcard={marcas}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(
      document.body.textContent,
    ).toMatch(/\(Claro\)/);
    expect(
      document.body.textContent,
    ).not.toMatch(/Claro.*Getrak/);
  });

  it("com marcaSimcardId null: não tenta exibir nome de marca (apenas o que tiver de operadora)", async () => {
    const user = userEvent.setup();
    render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[
          loteBase({
            id: 2,
            referencia: "B",
            marcaSimcardId: null,
            operadora: "Tim",
          }),
        ]}
        marcasSimcard={marcas}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(
      document.body.textContent,
    ).toMatch(/\(Tim\)/);
  });

  it("onOpenChange: fechar o painel com Escape zera a busca", async () => {
    const onBuscaChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={vi.fn()}
        busca="q"
        onBuscaChange={onBuscaChange}
        lotesFiltrados={[]}
        marcasSimcard={[]}
      />,
    );
    onBuscaChange.mockClear();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Escape}");
    expect(onBuscaChange).toHaveBeenCalledWith("");
  });

  it("seleção bem-sucedida chama onValueChange; clique no item vazio (disabled) não seleciona", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={onValueChange}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
        marcasSimcard={[]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const vazio = screen.getByRole("option", { name: /Nenhum lote encontrado/i });
    await user.click(vazio);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("opção válida: onValueChange com id; input busca: keydown não quebra o teste (stopPropagation)", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoLoteSimSelect
        value=""
        onValueChange={onValueChange}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[loteBase()]}
        marcasSimcard={marcas}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText("Buscar lote...");
    expect(
      fireEvent.keyDown(input, new KeyboardEvent("keydown", { key: "b", bubbles: true })),
    ).toBe(true);
    await user.click(screen.getByRole("option", { name: /SIM-1/ }));
    expect(onValueChange).toHaveBeenCalledWith("20");
  });
});
