import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "@/components/SearchableSelect";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

function defaultRect(): DOMRect {
  return {
    width: 200,
    height: 36,
    top: 100,
    left: 20,
    bottom: 400,
    right: 220,
    x: 20,
    y: 100,
    toJSON: () => ({}),
  } as DOMRect;
}

function getDropdownPanel(): HTMLElement {
  const el = document.body.querySelector(".max-h-60");
  if (!el) throw new Error("painel do dropdown não renderizado (portal)");
  return el as HTMLElement;
}

/**
 * O listener de scroll usa e.target. Disparamos o evento a partir de um
 * elemento cujo "target" no evento de scroll seja o node esperado.
 */
function dispatchScrollOn(target: EventTarget) {
  const e = new Event("scroll", { bubbles: true });
  Object.defineProperty(e, "target", { value: target, configurable: true });
  act(() => {
    (target as Node).dispatchEvent(e);
  });
}

describe("SearchableSelect", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      defaultRect(),
    );
  });

  it("documenta valor controlado inexistente na lista: mostra placeholder, não a string opaca", () => {
    render(
      <SearchableSelect
        options={options}
        value="inexistente"
        onChange={vi.fn()}
        placeholder="Selecione"
      />,
    );
    expect(
      screen.getByRole("button", { name: /selecione/i }),
    ).toBeInTheDocument();
  });

  it("lista vazia: abre e mostra estado vazio (sem crash)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={[]} value="" onChange={onChange} />);

    await user.click(
      screen.getByRole("button", { name: /selecionar|Selecione/i }),
    );
    expect(screen.getByText("Nenhuma opção encontrada")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("filtra com case-insensibilidade (rótulo em maiúsculas)", async () => {
    const user = userEvent.setup();
    render(
      <SearchableSelect
        options={[{ value: "x", label: "São José" }]}
        value=""
        onChange={vi.fn()}
        placeholder="P"
      />,
    );

    await user.click(screen.getByRole("button", { name: /p/i }));
    await user.type(screen.getByPlaceholderText("Filtrar..."), "são jos");
    expect(
      screen.getByRole("button", { name: "São José" }),
    ).toBeInTheDocument();
  });

  it("abre, filtra, seleciona: onChange com valor certo, uma única chamada, dropdown fecha", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    await user.type(screen.getByPlaceholderText("Filtrar..."), "bet");
    await user.click(screen.getByRole("button", { name: "Beta" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.queryByPlaceholderText("Filtrar...")).not.toBeInTheDocument();
  });

  it("Enter com lista filtrada vazia não seleciona nem chama onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    await user.type(screen.getByPlaceholderText("Filtrar..."), "nada");
    expect(screen.getByText("Nenhuma opção encontrada")).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("após selecionar (controle com estado), reabre com filtro limpo e lista completa de novo", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    function Harness() {
      const [v, setV] = useState("");
      return (
        <SearchableSelect
          options={options}
          value={v}
          onChange={(x) => {
            onChange(x);
            setV(x);
          }}
          placeholder="P"
        />
      );
    }
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /p|selecionar/i }));
    await user.type(screen.getByPlaceholderText("Filtrar..."), "g");
    await user.click(screen.getByRole("button", { name: "Gamma" }));
    expect(onChange).toHaveBeenCalledWith("c");
    onChange.mockClear();

    expect(screen.getByRole("button", { name: /gamma/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /gamma/i }));
    const input = screen.getByPlaceholderText("Filtrar...");
    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
  });

  it("foca o input de filtro ao abrir (regressão: setTimeout + inputRef)", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    const input = screen.getByPlaceholderText("Filtrar...");
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("Escape fecha sem onChange; Enter seleciona o primeiro filtrado (Alpha, não outro match)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    await user.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText("Filtrar...")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    await user.type(screen.getByPlaceholderText("Filtrar..."), "a");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("click fora: mousedown no documento fecha; scroll dentro do painel NÃO fecha", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    const panel = getDropdownPanel();
    expect(screen.getByPlaceholderText("Filtrar...")).toBeInTheDocument();

    dispatchScrollOn(panel);
    expect(screen.getByPlaceholderText("Filtrar...")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Filtrar..."),
      ).not.toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("scroll fora do painel (target body) fecha o menu", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    expect(getDropdownPanel()).toBeInTheDocument();

    dispatchScrollOn(document.body);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Filtrar..."),
      ).not.toBeInTheDocument();
    });
  });

  it("onMouseDown no item previne fechar antes do click: seleção conclui", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    await user.click(screen.getByRole("button", { name: "Alpha" }));
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("posiciona para cima quando pouco espaço abaixo (openUpward)", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 36,
      top: 800,
      left: 20,
      bottom: 1200,
      right: 220,
      x: 20,
      y: 800,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });

    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    expect(getDropdownPanel().style.transform).toBe("translateY(-100%)");
  });

  it("garante left mínimo de 4px alinhado ao trigger (evita corte em borda esquerda)", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 50,
      height: 36,
      top: 100,
      left: 0,
      bottom: 136,
      right: 50,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    expect(Number.parseFloat(getDropdownPanel().style.left)).toBe(4);
  });

  it("opção cujo value coincide com a seleção: destaque visual (regressão de classe)", async () => {
    const user = userEvent.setup();
    render(
      <SearchableSelect
        options={options}
        value="b"
        onChange={vi.fn()}
        placeholder="P"
      />,
    );
    await user.click(screen.getByRole("button", { name: /beta/i }));
    const item = screen.getByRole("button", { name: "Beta" });
    expect(item.className).toMatch(/font-semibold|bg-accent/);
  });

  it("aplica className no wrapper (integração com layout / grid do formulário)", () => {
    const { container } = render(
      <SearchableSelect
        className="max-w-sm border-red-500"
        options={options}
        value=""
        onChange={vi.fn()}
        placeholder="P"
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/max-w-sm/);
    expect(root.className).toMatch(/border-red-500/);
  });

  it("filtro com só espaços é tratado como vazio: mostra lista completa (trim)", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /selecionar/i }));
    const input = screen.getByPlaceholderText("Filtrar...");
    await user.type(input, "   ");
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument();
  });

  it("pai altera o value com menu aberto: rótulo selecionado e destaque na lista batem o novo value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    function PaiMuda() {
      const [v, setV] = useState("");
      return (
        <div>
          <button
            type="button"
            onClick={() => setV("a")}
            aria-label="definir-alpha"
          >
            sync
          </button>
          <SearchableSelect
            options={options}
            value={v}
            onChange={(x) => {
              onChange(x);
              setV(x);
            }}
            placeholder="P"
          />
        </div>
      );
    }
    render(<PaiMuda />);
    await user.click(screen.getByRole("button", { name: "P" }));
    expect(screen.getByPlaceholderText("Filtrar...")).toBeInTheDocument();
    await user.click(screen.getByLabelText("definir-alpha"));
    expect(screen.getByRole("button", { name: "Alpha" }).className).toMatch(
      /bg-accent|font-semibold/,
    );
  });
});
