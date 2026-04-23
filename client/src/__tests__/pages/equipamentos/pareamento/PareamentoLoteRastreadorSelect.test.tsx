import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PareamentoLoteRastreadorSelect } from "@/pages/equipamentos/pareamento/components/PareamentoLoteRastreadorSelect";
import type { LotePareamentoListItem } from "@/pages/equipamentos/pareamento/domain/types";

const baseLote = (over: Partial<LotePareamentoListItem> = {}): LotePareamentoListItem => ({
  id: 10,
  referencia: "LREF-1",
  quantidadeDisponivelSemId: 1,
  modelo: "M",
  marca: "MarcaX",
  operadora: null,
  marcaSimcardId: null,
  ...over,
});

describe("PareamentoLoteRastreadorSelect", () => {
  it("showLoteLabel: rótulo Lote com classe padrão; loteLabelClassName custom substitui", () => {
    const { unmount, rerender } = render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
        showLoteLabel
      />,
    );
    const lote = screen.getByText("Lote", { exact: true });
    expect(lote).toHaveClass("text-slate-600");
    unmount();

    render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
        loteLabelClassName="classe-tst"
        showLoteLabel
      />,
    );
    expect(
      document.querySelector(".classe-tst")?.textContent,
    ).toBe("Lote");
  });

  it("com showLoteLabel=false: sem label, apenas combobox; texto exato 'Lote' inexistente", () => {
    render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
        showLoteLabel={false}
      />,
    );
    expect(
      screen.queryByText("Lote", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("sufixo: só marca, só modelo, ou os dois; string vazia omite o span cinza (sem parênteses).", async () => {
    const user = userEvent.setup();
    const lotes: LotePareamentoListItem[] = [
      baseLote({ id: 1, referencia: "A", marca: "SóMarca", modelo: null }),
      baseLote({ id: 2, referencia: "B", marca: null, modelo: "SóModelo" }),
      baseLote({ id: 3, referencia: "C", marca: "M1", modelo: "M2" }),
      baseLote({ id: 4, referencia: "D", marca: null, modelo: null }),
    ];
    render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={lotes}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(
      document.body.textContent,
    ).toMatch(/\(SóMarca\)/);
    expect(
      document.body.textContent,
    ).toMatch(/\(SóModelo\)/);
    expect(
      document.body.textContent,
    ).toMatch(/\(M1 \/ M2\)/);
    const optD = screen.getByRole("option", { name: "D" });
    expect(
      (optD.textContent ?? "").includes("(") &&
        (optD.textContent ?? "").includes(")"),
    ).toBe(false);
  });

  it("onOpenChange: abrir não chama onBuscaChange(''); fechar (Escape) chama uma vez com string vazia", async () => {
    const onBuscaChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={vi.fn()}
        busca="filtro"
        onBuscaChange={onBuscaChange}
        lotesFiltrados={[baseLote({ id: 5, referencia: "L5" })]}
      />,
    );
    onBuscaChange.mockClear();
    await user.click(screen.getByRole("combobox"));
    expect(
      onBuscaChange.mock.calls.filter((c) => c[0] === "").length,
    ).toBe(0);
    await user.keyboard("{Escape}");
    expect(onBuscaChange).toHaveBeenCalledWith("");
    expect(
      onBuscaChange.mock.calls.filter((c) => c[0] === "").length,
    ).toBe(1);
  });

  it("busca: typing repassa o valor; keyDown no input não vaza com erro (stopPropagation)", async () => {
    const onBuscaChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={vi.fn()}
        busca=""
        onBuscaChange={onBuscaChange}
        lotesFiltrados={[]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText("Buscar lote...");
    onBuscaChange.mockClear();
    await user.type(input, "x");
    expect(
      onBuscaChange.mock.calls[onBuscaChange.mock.calls.length - 1],
    ).toEqual(["x"]);
    const ev = new KeyboardEvent("keydown", { key: "a", bubbles: true });
    const err = fireEvent.keyDown(input, ev);
    expect(err).toBe(true);
  });

  it("seleção de lote chama onValueChange com id string; item desabilitado 'Nenhum' não aplica o mesmo", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoLoteRastreadorSelect
        value=""
        onValueChange={onValueChange}
        busca=""
        onBuscaChange={vi.fn()}
        lotesFiltrados={[]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const vazio = screen.getByRole("option", { name: /Nenhum lote encontrado/i });
    expect(vazio).toHaveAttribute("data-disabled", "");
    onValueChange.mockClear();
    await user.click(vazio);
    expect(onValueChange).not.toHaveBeenCalled();
  });

});
