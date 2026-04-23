import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PareamentoCriarRastreadorBlock } from "@/pages/equipamentos/pareamento/components/PareamentoCriarRastreadorBlock";
import type { LotePareamentoListItem } from "@/pages/equipamentos/pareamento/domain/types";

const marcasAtivas = [
  { id: 1, nome: "MarcaA", ativo: true as const },
  { id: 2, nome: "MarcaB", ativo: true as const },
];
const modelosMarcaA = [
  { id: 10, nome: "Mod1", marca: { id: 1 } },
  { id: 11, nome: "Mod2", marca: { id: 1 } },
];

const loteRast = (n: number, ref: string): LotePareamentoListItem => ({
  id: n,
  referencia: ref,
  quantidadeDisponivelSemId: 1,
  modelo: null,
  marca: null,
  operadora: null,
  marcaSimcardId: null,
});

function rastreadorProps(
  o: {
    onCriarNovoChange?: ReturnType<typeof vi.fn>;
    onCriarNovoUnchecked?: ReturnType<typeof vi.fn>;
    onPertenceLoteChange?: ReturnType<typeof vi.fn>;
    onLoteRastreadorIdChange?: ReturnType<typeof vi.fn>;
    onLoteBuscaChange?: ReturnType<typeof vi.fn>;
    onMarcaChange?: ReturnType<typeof vi.fn>;
    onModeloChange?: ReturnType<typeof vi.fn>;
  } = {},
) {
  return {
    onCriarNovoChange: o.onCriarNovoChange ?? vi.fn(),
    onCriarNovoUnchecked: o.onCriarNovoUnchecked ?? vi.fn(),
    onPertenceLoteChange: o.onPertenceLoteChange ?? vi.fn(),
    loteRastreadorId: "",
    onLoteRastreadorIdChange: o.onLoteRastreadorIdChange ?? vi.fn(),
    loteBusca: "",
    onLoteBuscaChange: o.onLoteBuscaChange ?? vi.fn(),
    lotesFiltrados: [] as LotePareamentoListItem[],
    marca: "",
    modelo: "",
    onMarcaChange: o.onMarcaChange ?? vi.fn(),
    onModeloChange: o.onModeloChange ?? vi.fn(),
    marcasAtivas,
    modelosPorMarca: modelosMarcaA,
  };
}


describe("PareamentoCriarRastreadorBlock", () => {
  it("com criarNovo false não renderiza o bloco interno; após ativar, passa a existir o fluxo lote/marca", () => {
    const { unmount, rerender } = render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps()}
        criarNovo={false}
        pertenceLote={false}
      />,
    );
    expect(
      screen.queryByRole("checkbox", { name: /pertence a um lote/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/marca \(se criar novo\)/i),
    ).not.toBeInTheDocument();

    rerender(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps()}
        criarNovo
        pertenceLote={false}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    ).toBeInTheDocument();
    unmount();
  });

  it("ao marcar Criar Novo chama onCriarNovoChange(true); ao desmarcar chama false e onCriarNovoUnchecked", async () => {
    const onCriarNovoChange = vi.fn();
    const onCriarNovoUnchecked = vi.fn();
    const user = userEvent.setup();
    const p = rastreadorProps({ onCriarNovoChange, onCriarNovoUnchecked });
    const { rerender } = render(
      <PareamentoCriarRastreadorBlock
        variant="massa"
        {...p}
        criarNovo={false}
        pertenceLote={false}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /criar novo/i }));
    expect(onCriarNovoChange).toHaveBeenLastCalledWith(true);
    expect(onCriarNovoUnchecked).not.toHaveBeenCalled();

    rerender(
      <PareamentoCriarRastreadorBlock
        variant="massa"
        {...p}
        criarNovo
        pertenceLote={false}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /criar novo/i }));
    expect(onCriarNovoChange).toHaveBeenLastCalledWith(false);
    expect(onCriarNovoUnchecked).toHaveBeenCalledTimes(1);
  });

  it("variant individual: labels e tons distintos (mb-1.5, slate-600); massa: compacto (mb-1, slate-500)", () => {
    const { unmount } = render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps()}
        criarNovo
        pertenceLote={false}
      />,
    );
    const marcaInd = screen.getByText(/marca \(se criar novo\)/i);
    const modeloInd = screen.getByText(/modelo \(se criar novo\)/i);
    expect(marcaInd).toHaveClass("mb-1.5", "text-slate-600");
    expect(modeloInd).toHaveClass("mb-1.5", "text-slate-600");
    unmount();

    render(
      <PareamentoCriarRastreadorBlock
        variant="massa"
        {...rastreadorProps()}
        criarNovo
        pertenceLote={false}
      />,
    );
    expect(screen.getByText(/^marca$/i)).toHaveClass("mb-1", "text-slate-500");
    expect(screen.getByText(/^modelo$/i)).toHaveClass("mb-1", "text-slate-500");
  });

  it("com pertenceLote, o checkbox chama onPertenceLoteChange com true e depois com false (simulando prop do pai)", async () => {
    const onPertenceLoteChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps({ onPertenceLoteChange })}
        criarNovo
        pertenceLote={false}
      />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    );
    expect(onPertenceLoteChange).toHaveBeenLastCalledWith(true);

    rerender(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps({ onPertenceLoteChange })}
        criarNovo
        pertenceLote
        lotesFiltrados={[loteRast(1, "L1")]}
      />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    );
    expect(onPertenceLoteChange).toHaveBeenLastCalledWith(false);
  });

  it("sem marca: combobox de modelo desabilitado e com placeholder Marca primeiro; com marca, habilita", () => {
    const { rerender } = render(
      <PareamentoCriarRastreadorBlock
        variant="massa"
        {...rastreadorProps()}
        criarNovo
        pertenceLote={false}
        marca=""
        modelosPorMarca={modelosMarcaA}
      />,
    );
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes[1]).toBeDisabled();
    expect(
      document.body.textContent,
    ).toMatch(/marca primeiro/i);

    rerender(
      <PareamentoCriarRastreadorBlock
        variant="massa"
        {...rastreadorProps()}
        criarNovo
        pertenceLote={false}
        marca="MarcaA"
        modelosPorMarca={modelosMarcaA}
      />,
    );
    expect(screen.getAllByRole("combobox")[1]).not.toBeDisabled();
  });

  it("trocar MarcaA por MarcaB com modelo selecionado: dispara onMarcaChange e em seguida onModeloChange('')", async () => {
    const onMarcaChange = vi.fn();
    const onModeloChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps({ onMarcaChange, onModeloChange })}
        criarNovo
        pertenceLote={false}
        marca="MarcaA"
        modelo="Mod1"
        modelosPorMarca={modelosMarcaA}
      />,
    );
    const [marcaSelect] = screen.getAllByRole("combobox");
    await user.click(marcaSelect!);
    await user.click(screen.getByRole("option", { name: "MarcaB" }));
    expect(onMarcaChange).toHaveBeenCalledWith("MarcaB");
    expect(onModeloChange).toHaveBeenLastCalledWith("");
  });

  it("pertenceLote + individual: rótulo Lote visível; em massa: sem label Lote (não exige workaround de placeholder)", () => {
    const common = {
      ...rastreadorProps(),
      criarNovo: true as const,
      pertenceLote: true as const,
      lotesFiltrados: [loteRast(1, "X")],
    };
    const { unmount } = render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...common}
      />,
    );
    const labelLote = screen.getByText("Lote", { exact: true });
    expect(labelLote.tagName).toBe("LABEL");
    unmount();

    render(
      <PareamentoCriarRastreadorBlock
        variant="massa"
        {...common}
      />,
    );
    expect(
      screen.queryByText("Lote", { exact: true }),
    ).not.toBeInTheDocument();
  });

  it("pertenceLote: seleciona lote, reabre e Escape chama onBuscaChange('')", async () => {
    const user = userEvent.setup();
    const onLoteRastreadorIdChange = vi.fn();
    const onLoteBuscaChange = vi.fn();
    render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...rastreadorProps({ onLoteRastreadorIdChange, onLoteBuscaChange })}
        criarNovo
        pertenceLote
        loteBusca="lote-xyz"
        lotesFiltrados={[loteRast(99, "REF-99")]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByPlaceholderText("Buscar lote...")).toHaveValue(
      "lote-xyz",
    );
    onLoteRastreadorIdChange.mockClear();
    await user.click(screen.getByRole("option", { name: /REF-99/ }));
    expect(onLoteRastreadorIdChange).toHaveBeenCalledWith("99");

    const callsAntesDeFechar = onLoteBuscaChange.mock.calls.length;
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Escape}");
    expect(onLoteBuscaChange).toHaveBeenCalledWith("");
    expect(onLoteBuscaChange.mock.calls.length).toBeGreaterThan(
      callsAntesDeFechar,
    );
  });

  it("pertenceLote: com pai com estado, input de busca reflete o valor (fluxo real controlado)", async () => {
    const onLoteRastreadorIdChange = vi.fn();
    const user = userEvent.setup();

    function BuscaComEstado() {
      const [busca, setBusca] = useState("lote-xyz");
      return (
        <PareamentoCriarRastreadorBlock
          variant="individual"
          {...rastreadorProps({ onLoteRastreadorIdChange, onLoteBuscaChange: setBusca })}
          criarNovo
          pertenceLote
          loteBusca={busca}
          lotesFiltrados={[loteRast(99, "REF-99")]}
        />
      );
    }
    render(<BuscaComEstado />);
    await user.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText("Buscar lote...");
    expect(input).toHaveValue("lote-xyz");
    /* user.type em input controlado costuma ser lento; input sintético basta p/ contrato onChange + estado */
    fireEvent.input(input, { target: { value: "abc" } });
    expect(input).toHaveValue("abc");
  });
});
