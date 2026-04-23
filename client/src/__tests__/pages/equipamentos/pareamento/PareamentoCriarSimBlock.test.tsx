import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PareamentoCriarSimBlock } from "@/pages/equipamentos/pareamento/components/PareamentoCriarSimBlock";
import type { LotePareamentoListItem } from "@/pages/equipamentos/pareamento/domain/types";
import type { MarcaSimcardPareamentoCatalog } from "@/pages/equipamentos/pareamento/domain/types";

const operadorasAtivas = [
  { id: 1, nome: "Vivo", ativo: true as const },
  { id: 2, nome: "Claro", ativo: true as const },
];

const marcasSimcard: MarcaSimcardPareamentoCatalog[] = [
  {
    id: 100,
    nome: "ChipX",
    operadoraId: 1,
    temPlanos: false,
    operadora: { id: 1, nome: "Vivo" },
  },
];

const marcaComPlano: MarcaSimcardPareamentoCatalog = {
  id: 200,
  nome: "ComPlano",
  operadoraId: 1,
  temPlanos: true,
  operadora: { id: 1, nome: "Vivo" },
  planos: [
    { id: 1, planoMb: 5, ativo: true },
    { id: 2, planoMb: 10, ativo: false },
  ],
};

const loteSim = (n: number, ref: string, o: Partial<LotePareamentoListItem> = {}): LotePareamentoListItem => ({
  id: n,
  referencia: ref,
  quantidadeDisponivelSemId: 1,
  modelo: null,
  marca: null,
  operadora: "Vivo",
  marcaSimcardId: 100,
  ...o,
});

function simProps(
  o: {
    onOperadoraChange?: ReturnType<typeof vi.fn>;
    onMarcaSimcardChange?: ReturnType<typeof vi.fn>;
    onPlanoSimcardChange?: ReturnType<typeof vi.fn>;
    onCriarNovoChange?: ReturnType<typeof vi.fn>;
    onCriarNovoUnchecked?: ReturnType<typeof vi.fn>;
    onLoteSimIdChange?: ReturnType<typeof vi.fn>;
  } = {},
) {
  return {
    onCriarNovoChange: o.onCriarNovoChange ?? vi.fn(),
    onCriarNovoUnchecked: o.onCriarNovoUnchecked ?? vi.fn(),
    onPertenceLoteChange: vi.fn(),
    loteSimId: "",
    onLoteSimIdChange: o.onLoteSimIdChange ?? vi.fn(),
    loteBusca: "",
    onLoteBuscaChange: vi.fn(),
    lotesFiltrados: [] as LotePareamentoListItem[],
    marcasSimcard,
    operadoraSim: "",
    marcaSimcardId: "",
    planoSimcardId: "",
    onOperadoraChange: o.onOperadoraChange ?? vi.fn(),
    onMarcaSimcardChange: o.onMarcaSimcardChange ?? vi.fn(),
    onPlanoSimcardChange: o.onPlanoSimcardChange ?? vi.fn(),
    operadorasAtivas,
    marcasSimcardPorOperadora: [] as MarcaSimcardPareamentoCatalog[],
  };
}

describe("PareamentoCriarSimBlock", () => {
  it("fluxo Criar Novo: check chama onCriarNovoChange; uncheck chama onCriarNovoUnchecked", async () => {
    const onCriarNovoChange = vi.fn();
    const onCriarNovoUnchecked = vi.fn();
    const user = userEvent.setup();
    const p = simProps({ onCriarNovoChange, onCriarNovoUnchecked });
    const { rerender } = render(
      <PareamentoCriarSimBlock
        variant="massa"
        {...p}
        criarNovo={false}
        pertenceLote={false}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /criar novo/i }));
    expect(onCriarNovoChange).toHaveBeenLastCalledWith(true);
    rerender(
      <PareamentoCriarSimBlock
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

  it("trocar operadora via UI chama com argumentos corretos e reseta dependências (marca, plano)", async () => {
    const onOperadoraChange = vi.fn();
    const onMarcaSimcardChange = vi.fn();
    const onPlanoSimcardChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps({
          onOperadoraChange,
          onMarcaSimcardChange,
          onPlanoSimcardChange,
        })}
        criarNovo
        pertenceLote={false}
      />,
    );
    const [op] = screen.getAllByRole("combobox");
    await user.click(op!);
    await user.click(screen.getByRole("option", { name: "Vivo" }));
    expect(onOperadoraChange).toHaveBeenCalledWith("Vivo");
    expect(onMarcaSimcardChange).toHaveBeenCalledWith("");
    expect(onPlanoSimcardChange).toHaveBeenCalledWith("");
  });

  it("sem operadora: combobox de marca desabilitado; com operadora: placeholder muda (Getrak vs selecione operadora)", () => {
    const { rerender } = render(
      <PareamentoCriarSimBlock
        variant="massa"
        {...simProps()}
        criarNovo
        pertenceLote={false}
        operadoraSim=""
        marcasSimcardPorOperadora={[marcasSimcard[0]!]}
      />,
    );
    expect(screen.getAllByRole("combobox")[1]!).toBeDisabled();
    expect(
      document.body.textContent,
    ).toMatch(/selecione operadora/i);

    rerender(
      <PareamentoCriarSimBlock
        variant="massa"
        {...simProps()}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcasSimcardPorOperadora={[marcasSimcard[0]!]}
      />,
    );
    expect(screen.getAllByRole("combobox")[1]!).not.toBeDisabled();
    expect(
      document.body.textContent,
    ).toMatch(/getrak|1nce/i);
  });

  it("ao trocar marca do simcard chama onMarcaSimcardChange e reseta onPlanoSimcardChange('')", async () => {
    const onMarcaSimcardChange = vi.fn();
    const onPlanoSimcardChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoCriarSimBlock
        variant="massa"
        {...simProps({ onMarcaSimcardChange, onPlanoSimcardChange })}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcasSimcardPorOperadora={[marcasSimcard[0]!]}
      />,
    );
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]!);
    await user.click(screen.getByRole("option", { name: "ChipX" }));
    expect(onMarcaSimcardChange).toHaveBeenCalledWith("100");
    expect(onPlanoSimcardChange).toHaveBeenCalledWith("");
  });

  it("exibe bloco Plano somente com marca id válida, temPlanos e ao menos um plano ativo", () => {
    const { unmount } = render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps()}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcaSimcardId="200"
        marcasSimcardPorOperadora={[marcaComPlano]}
        planoSimcardId=""
      />,
    );
    expect(screen.getByText(/^plano$/i)).toBeInTheDocument();
    unmount();

    const semPlanosAtivos: MarcaSimcardPareamentoCatalog = {
      ...marcaComPlano,
      planos: [{ id: 1, planoMb: 5, ativo: false }],
    };
    render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps()}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcaSimcardId="200"
        marcasSimcardPorOperadora={[semPlanosAtivos]}
      />,
    );
    expect(
      screen.queryByText(/^plano$/i),
    ).not.toBeInTheDocument();
  });

  it("edge: marcaSimcardId desincronizado (id no estado, não listado) não exibe bloco Plano (evita UI órfã)", () => {
    render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps()}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcaSimcardId="999"
        marcasSimcardPorOperadora={[marcaComPlano]}
      />,
    );
    expect(
      screen.queryByText(/^plano$/i),
    ).not.toBeInTheDocument();
  });

  it("edge: temPlanos true mas planos inexistente no catálogo — não exibe bloco Plano", () => {
    const sPlanos: MarcaSimcardPareamentoCatalog = {
      ...marcaComPlano,
      planos: undefined,
    };
    render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps()}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcaSimcardId="200"
        marcasSimcardPorOperadora={[sPlanos]}
      />,
    );
    expect(
      screen.queryByText(/^plano$/i),
    ).not.toBeInTheDocument();
  });

  it("seleciona plano e chama onPlanoSimcardChange com o id (apenas planos ativos no DOM)", async () => {
    const onPlanoSimcardChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps({ onPlanoSimcardChange })}
        criarNovo
        pertenceLote={false}
        operadoraSim="Vivo"
        marcaSimcardId="200"
        marcasSimcardPorOperadora={[marcaComPlano]}
      />,
    );
    const planoBox = screen.getAllByRole("combobox").at(-1)!;
    await user.click(planoBox);
    expect(
      screen.queryByRole("option", { name: /10 MB/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /5 MB/ }));
    expect(onPlanoSimcardChange).toHaveBeenCalledWith("1");
  });

  it("pertenceLote: individual mostra rótulo Lote; seleciona lote", async () => {
    const onLoteSimIdChange = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <PareamentoCriarSimBlock
        variant="individual"
        {...simProps({ onLoteSimIdChange })}
        criarNovo
        pertenceLote
        lotesFiltrados={[loteSim(99, "L-SIM")]}
        marcasSimcard={marcasSimcard}
      />,
    );
    const labelLote = screen.getByText("Lote", { exact: true });
    expect(labelLote.tagName).toBe("LABEL");
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /L-SIM/ }));
    expect(onLoteSimIdChange).toHaveBeenCalledWith("99");
    unmount();

    render(
      <PareamentoCriarSimBlock
        variant="massa"
        {...simProps({ onLoteSimIdChange })}
        criarNovo
        pertenceLote
        lotesFiltrados={[]}
        marcasSimcard={marcasSimcard}
      />,
    );
    expect(
      screen.queryByText("Lote", { exact: true }),
    ).not.toBeInTheDocument();
  });
});
