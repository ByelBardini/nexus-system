import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SelectUF } from "@/components/SelectUF";
import type { UF } from "@/hooks/useBrasilAPI";

const reg = { id: 1, sigla: "S", nome: "Sul" };
const ufs: UF[] = [
  { id: 1, sigla: "SP", nome: "São Paulo", regiao: reg },
  { id: 2, sigla: "RJ", nome: "Rio de Janeiro", regiao: reg },
];

function dispatchScrollOn(target: EventTarget) {
  const e = new Event("scroll", { bubbles: true });
  Object.defineProperty(e, "target", { value: target, configurable: true });
  act(() => {
    (target as Node).dispatchEvent(e);
  });
}

function getDropdownPanel(container: HTMLElement): HTMLElement {
  const el = container.querySelector(".max-h-60") ?? document.querySelector(".max-h-60");
  if (!el) throw new Error("dropdown não encontrado");
  return el as HTMLElement;
}

function StatefulSelectUF() {
  const [value, setValue] = useState("");
  return <SelectUF ufs={ufs} value={value} onChange={setValue} />;
}

describe("SelectUF", () => {
  it("sigla inexistente na lista: when closed, campo fica vazio (não mostra a sigla inválida)", () => {
    render(
      <SelectUF
        ufs={ufs}
        value="XX"
        onChange={vi.fn()}
        placeholder="Pesquise"
      />,
    );
    expect(
      screen.getByPlaceholderText("Pesquise"),
    ).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("modo desabilitado: placeholder ou rótulo “SIGLA - Nome”", () => {
    const { rerender } = render(
      <SelectUF ufs={ufs} value="" onChange={vi.fn()} disabled placeholder="UF" />,
    );
    expect(document.querySelector("input")).toBeNull();
    expect(screen.getByText("UF")).toBeInTheDocument();
    rerender(
      <SelectUF ufs={ufs} value="SP" onChange={vi.fn()} disabled />,
    );
    expect(
      screen.getByText("SP - São Paulo", { exact: false }),
    ).toBeInTheDocument();
  });

  it("filtra com termo mínusculo combina com nome e com sigla", async () => {
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="" onChange={vi.fn()} placeholder="Estado" />,
    );
    await user.click(screen.getByPlaceholderText("Estado"));
    const input = screen.getByDisplayValue("");
    await user.type(input, "rio de");
    expect(
      screen.getByRole("button", { name: /RJ - Rio de Janeiro/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /São Paulo/ })).toBeNull();

    await user.clear(input);
    await user.type(input, "rj");
    expect(
      screen.getByRole("button", { name: /RJ - Rio de Janeiro/ }),
    ).toBeInTheDocument();
  });

  it("nenhum UF combina: mensagem; Enter com lista vazia não chama onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="" onChange={onChange} placeholder="E" />,
    );
    await user.click(screen.getByPlaceholderText("E"));
    await user.type(screen.getByDisplayValue(""), "Zzz9");
    expect(
      screen.getByText("Nenhum estado encontrado"),
    ).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("seleciona, então onChange com sigla exata, uma chamada, lista desaparece", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="" onChange={onChange} placeholder="Estado" />,
    );
    await user.click(screen.getByPlaceholderText("Estado"));
    await user.click(screen.getByRole("button", { name: /SP - São Paulo/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("SP");
    expect(
      screen.queryByRole("button", { name: /SP - São Paulo/ }),
    ).not.toBeInTheDocument();
  });

  it("Enter escolhe SP (primeiro item); abrir de novo e Escape não gera onChange (pai com estado)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    function H() {
      const [v, setV] = useState("");
      return (
        <SelectUF
          ufs={ufs}
          value={v}
          onChange={(s) => {
            onChange(s);
            setV(s);
          }}
          placeholder="E"
        />
      );
    }
    render(<H />);
    await user.click(screen.getByPlaceholderText("E"));
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("SP");
    onChange.mockClear();
    await user.click(screen.getByDisplayValue("SP - São Paulo"));
    await user.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("scroll no painel mantém aberto; scroll fora (body) fecha", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectUF ufs={ufs} value="" onChange={vi.fn()} placeholder="E" />,
    );
    await user.click(screen.getByPlaceholderText("E"));
    const panel = getDropdownPanel(container);
    dispatchScrollOn(panel);
    expect(
      screen.getByRole("button", { name: /SP - São Paulo/ }),
    ).toBeInTheDocument();
    dispatchScrollOn(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /SP - São Paulo/ }),
      ).not.toBeInTheDocument();
    });
  });

  it("click fora: fecha sem onChange; não duplica efeito colateral", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="" onChange={onChange} placeholder="E" />,
    );
    await user.click(screen.getByPlaceholderText("E"));
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /SP/ }),
      ).not.toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("estado com valor “destaque” na lista: bg-accent no item da sigla ativa", async () => {
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="SP" onChange={vi.fn()} placeholder="E" />,
    );
    await user.click(screen.getByDisplayValue("SP - São Paulo"));
    const sp = screen.getByRole("button", { name: /SP - São Paulo/ });
    expect(sp.className).toMatch(/bg-accent/);
  });

  it("filho controlado: escolhe RJ e o campo bate o texto de exibição", async () => {
    const user = userEvent.setup();
    render(<StatefulSelectUF />);
    await user.click(screen.getByPlaceholderText("Pesquisar estado..."));
    await user.click(
      screen.getByRole("button", { name: /RJ - Rio de Janeiro/ }),
    );
    expect(
      screen.getByDisplayValue("RJ - Rio de Janeiro"),
    ).toBeInTheDocument();
  });

  it("em dialog: lista fica com position absolute (não vaza o modal)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div role="dialog" style={{ position: "relative" }}>
        <SelectUF ufs={ufs} value="" onChange={vi.fn()} placeholder="UF" />
      </div>,
    );
    await user.click(screen.getByPlaceholderText("UF"));
    const list = container.querySelector(".z-\\[9999\\]") as HTMLElement;
    expect(list?.style.position).toBe("absolute");
  });

  it("após fechar, novo open lista todos os UFs (não fica filtro 'Rio' colado", async () => {
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="" onChange={vi.fn()} placeholder="E" />,
    );
    await user.click(screen.getByPlaceholderText("E"));
    await user.type(screen.getByDisplayValue(""), "Rio");
    expect(
      screen.queryByRole("button", { name: /São Paulo/ }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    const fechado = screen.getByPlaceholderText("E");
    /* Idem SelectCidade: sem mudança de foco, segundo clique não chama onFocus de novo. */
    fireEvent.blur(fechado);
    fireEvent.focus(fechado);
    expect(
      await screen.findByRole("button", { name: /SP - São Paulo/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /RJ - Rio/ }),
    ).toBeInTheDocument();
  });

  it("disabled: não monta painel (dropdown inacessível)", async () => {
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="SP" onChange={vi.fn()} disabled />,
    );
    await user.click(
      screen.getByText("SP - São Paulo", { exact: false }),
    );
    expect(document.querySelector(".max-h-60")).toBeNull();
  });

  it("filtra por sigla com capitalização mista (são paths minúsculos no código", async () => {
    const user = userEvent.setup();
    render(
      <SelectUF ufs={ufs} value="" onChange={vi.fn()} placeholder="E" />,
    );
    await user.click(screen.getByPlaceholderText("E"));
    await user.type(screen.getByDisplayValue(""), "Rj");
    expect(
      screen.getByRole("button", { name: /RJ - Rio/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /São Paulo/ })).toBeNull();
  });
});
