import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SelectCidade } from "@/components/SelectCidade";
import type { Municipio } from "@/hooks/useBrasilAPI";

const municipios: Municipio[] = [
  { nome: "São Paulo", codigo_ibge: "3550308" },
  { nome: "Campinas", codigo_ibge: "3509502" },
  { nome: "Santos", codigo_ibge: "3548500" },
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

function StatefulSelectCidade(props: { disabled?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <SelectCidade
      municipios={municipios}
      value={value}
      onChange={setValue}
      disabled={props.disabled}
    />
  );
}

function ParentDrivesValue({ initial, next }: { initial: string; next: string }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <SelectCidade
        municipios={municipios}
        value={v}
        onChange={setV}
        placeholder="Cidade"
      />
      <button type="button" onClick={() => setV(next)}>
        trocar
      </button>
    </>
  );
}

describe("SelectCidade", () => {
  it("modo desabilitado: mostra placeholder ou nome (sem input no DOM)", () => {
    const { rerender } = render(
      <SelectCidade
        municipios={municipios}
        value=""
        onChange={vi.fn()}
        disabled
        placeholder="Cidade"
      />,
    );
    expect(screen.getByText("Cidade")).toBeInTheDocument();
    expect(document.querySelector("input")).toBeNull();

    rerender(
      <SelectCidade
        municipios={municipios}
        value="Campinas"
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByText("Campinas")).toBeInTheDocument();
  });

  it("value armazenado (ex.: API) ainda exibido quando fechado, mesmo fora da lista carregada", () => {
    render(
      <SelectCidade
        municipios={municipios}
        value="Cidade Fantasma (API)"
        onChange={vi.fn()}
        placeholder="C"
      />,
    );
    expect(
      screen.getByDisplayValue("Cidade Fantasma (API)"),
    ).toBeInTheDocument();
  });

  it("municípios vazios: abre e mostra mensagem; Enter não seleciona nada", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <SelectCidade
        municipios={[]}
        value=""
        onChange={onChange}
        placeholder="C"
      />,
    );

    await user.click(screen.getByPlaceholderText("C"));
    expect(
      screen.getByText("Nenhuma cidade encontrada"),
    ).toBeInTheDocument();
    const panel = getDropdownPanel(container);
    expect(panel).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("abre, filtra, seleciona: onChange com nome exato, uma chamada, lista some", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value=""
        onChange={onChange}
        placeholder="Cidade"
      />,
    );

    const input = screen.getByPlaceholderText("Cidade");
    await user.click(input);
    expect(screen.getByRole("button", { name: "São Paulo" })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Camp");
    expect(
      screen.getByRole("button", { name: "Campinas" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Santos" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Campinas" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("Campinas");
  });

  it("campo de busca é só por substring minúscula: “sao” NÃO bate em “São Paulo” (comportamento atual do filtro)", async () => {
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value=""
        onChange={vi.fn()}
        placeholder="C"
      />,
    );
    await user.click(screen.getByPlaceholderText("C"));
    await user.type(screen.getByDisplayValue(""), "sao");
    expect(
      screen.getByText("Nenhuma cidade encontrada"),
    ).toBeInTheDocument();
  });

  it("Enter com itens: primeira da lista; com filtro sem resultados: não chama onChange (pai controla valor)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    function CidadeControlada() {
      const [v, setV] = useState("");
      return (
        <SelectCidade
          municipios={municipios}
          value={v}
          onChange={(n) => {
            onChange(n);
            setV(n);
          }}
          placeholder="Cidade"
        />
      );
    }
    render(<CidadeControlada />);
    await user.click(screen.getByPlaceholderText("Cidade"));
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("São Paulo");

    onChange.mockClear();
    await user.click(screen.getByDisplayValue("São Paulo"));
    const q = screen.getByDisplayValue("São Paulo");
    await user.clear(q);
    await user.type(q, "nada");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Escape fecha e repõe o termo para o value atual; scroll no painel não fecha (portal no body", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value="Santos"
        onChange={onChange}
        placeholder="Cidade"
      />,
    );

    await user.click(screen.getByDisplayValue("Santos"));
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("button", { name: "Santos" }),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Santos")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    const campo = screen.getByDisplayValue("Santos");
    /* Após Escape o input segue focado: outro click não dispara focus; blur+focus simula reabrir o menu. */
    fireEvent.blur(campo);
    fireEvent.focus(campo);
    const panel = await waitFor(
      () => document.querySelector(".max-h-60") as HTMLElement,
    );
    expect(panel).toBeTruthy();
    dispatchScrollOn(panel);
    expect(
      screen.getByRole("button", { name: "Santos" }),
    ).toBeInTheDocument();
  });

  it("click fora: fecha e restaura o texto visível com o value prop", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value="Santos"
        onChange={onChange}
        placeholder="Cidade"
      />,
    );
    await user.click(screen.getByDisplayValue("Santos"));
    await user.clear(screen.getByDisplayValue("Santos"));
    await user.type(screen.getByPlaceholderText("Cidade"), "lixo");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(
        screen.queryByText("Nenhuma cidade encontrada"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Santos")).toBeInTheDocument();
  });

  it("pai altera value enquanto fechado: input reflete o novo nome", () => {
    const { rerender } = render(
      <SelectCidade
        municipios={municipios}
        value="Santos"
        onChange={vi.fn()}
        placeholder="C"
      />,
    );
    expect(screen.getByDisplayValue("Santos")).toBeInTheDocument();
    rerender(
      <SelectCidade
        municipios={municipios}
        value="Campinas"
        onChange={vi.fn()}
        placeholder="C"
      />,
    );
    expect(screen.getByDisplayValue("Campinas")).toBeInTheDocument();
  });

  it("portal dentro de dialog: position absolute (não vaza para o body com fixed errado)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div role="dialog" style={{ position: "relative" }}>
        <SelectCidade
          municipios={municipios}
          value=""
          onChange={vi.fn()}
          placeholder="C"
        />
      </div>,
    );
    await user.click(screen.getByPlaceholderText("C"));
    const list = container.querySelector(".z-\\[9999\\]") as HTMLElement;
    expect(list?.style.position).toBe("absolute");
  });

  it("cidade selecionada: item na lista fica com destaque (classe de seleção)", async () => {
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value="Campinas"
        onChange={vi.fn()}
        placeholder="C"
      />,
    );
    await user.click(screen.getByDisplayValue("Campinas"));
    const item = screen.getByRole("button", { name: "Campinas" });
    expect(item.className).toMatch(/bg-accent/);
  });

  it("fluxo com estado no pai: escolhe e o campo exibe a cidade", async () => {
    const user = userEvent.setup();
    render(<StatefulSelectCidade />);
    await user.click(screen.getByPlaceholderText("Selecione a cidade"));
    await user.click(screen.getByRole("button", { name: "Campinas" }));
    expect(screen.getByDisplayValue("Campinas")).toBeInTheDocument();
  });

  it("scroll fora (body) quando aberto: fecha o dropdown", async () => {
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value=""
        onChange={vi.fn()}
        placeholder="C"
      />,
    );
    await user.click(screen.getByPlaceholderText("C"));
    expect(screen.getByRole("button", { name: "São Paulo" })).toBeInTheDocument();
    dispatchScrollOn(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "São Paulo" }),
      ).not.toBeInTheDocument();
    });
  });

  it("trocar value via botão externo enquanto fechado permanece coerente ao abrir de novo", async () => {
    const user = userEvent.setup();
    render(
      <ParentDrivesValue initial="Santos" next="Campinas" />,
    );
    expect(screen.getByDisplayValue("Santos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "trocar" }));
    expect(screen.getByDisplayValue("Campinas")).toBeInTheDocument();
  });

  it("disabled: não abre menu (sem portal) mesmo com interação de clique", async () => {
    const user = userEvent.setup();
    render(
      <SelectCidade
        municipios={municipios}
        value=""
        onChange={vi.fn()}
        disabled
        placeholder="C"
      />,
    );
    const el = screen.getByText("C");
    expect(el).toBeInTheDocument();
    await user.click(el);
    expect(document.querySelector(".max-h-60")).toBeNull();
  });
});
