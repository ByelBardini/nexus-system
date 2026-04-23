import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InputPreco } from "@/components/InputPreco";
import {
  centavosParaReais,
  reaisParaCentavos,
} from "@/lib/format";

/** Rótulos só para leitura do relatório; o valor esperado vem sempre de `reaisParaCentavos`. */
const ENTRADAS_MOEDA: Array<[string, string]> = [
  ["só vírgula/ponto", ",."],
  ["pt-BR com milhar (pontos são ignorados como não-dígitos)", "1.234,56"],
  ["valor simples", "10,00"],
  ["prefixo R$ e espaços", "R$ 99,90"],
  ["apenas dígitos (digitação acumulada)", "150"],
];

function InputPrecoComEstadoInicial({ inicial = 0 }: { inicial?: number }) {
  const [centavos, setCentavos] = useState(inicial);
  return <InputPreco value={centavos} onChange={setCentavos} />;
}

describe("InputPreco", () => {
  describe("modo controlado (exibição a partir de centavos)", () => {
    it("mostra campo vazio quando o valor é 0 (0 é tratado como ausência)", () => {
      render(<InputPreco value={0} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("mostra 0,01 quando há exatamente 1 centavo (valor truthy)", () => {
      render(<InputPreco value={1} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue(centavosParaReais(1));
    });

    it("atualiza o texto quando o pai muda `value` (re-render)", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <InputPreco value={100} onChange={onChange} />,
      );
      expect(screen.getByRole("textbox")).toHaveValue(centavosParaReais(100));

      rerender(<InputPreco value={12_345} onChange={onChange} />);
      expect(screen.getByRole("textbox")).toHaveValue(
        centavosParaReais(12_345),
      );
    });

    it("exibe centavos negativos sem normalizar (comportamento atual de centavosParaReais)", () => {
      render(<InputPreco value={-250} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue(
        centavosParaReais(-250),
      );
    });
  });

  describe("handleChange: string do input → onChange(centavos)", () => {
    it.each(ENTRADAS_MOEDA)(
      "%s",
      (_label, raw) => {
        const esperado = reaisParaCentavos(raw);
        const onChange = vi.fn();
        render(<InputPreco value={0} onChange={onChange} />);
        fireEvent.change(screen.getByRole("textbox"), {
          target: { value: raw },
        });
        expect(onChange).toHaveBeenCalledWith(esperado);
      },
    );

    it("limpar o campo dispara onChange(0) quando antes havia valor (reais → vazio)", () => {
      const onChange = vi.fn();
      render(<InputPreco value={1000} onChange={onChange} />);
      expect(screen.getByRole("textbox")).toHaveValue(centavosParaReais(1000));
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("com pai atualizando estado, digitação incremental acumula dígitos como centavos inteiros", async () => {
      const user = userEvent.setup();
      render(<InputPrecoComEstadoInicial />);
      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("1");
      expect(input).toHaveValue(centavosParaReais(1));
      await user.keyboard("50");
      expect(input).toHaveValue(centavosParaReais(150));
    });

    it("sem o pai atualizar `value`, o campo continua vazio ao digitar (controlado só com onChange)", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<InputPreco value={0} onChange={onChange} />);
      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("99");
      expect(onChange).toHaveBeenCalled();
      expect(input).toHaveValue("");
    });
  });

  describe("atributos e props do campo", () => {
    it("usa type=text e inputMode=decimal (teclado numérico em mobile)", () => {
      render(<InputPreco value={0} onChange={vi.fn()} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("inputMode", "decimal");
    });

    it("repassa className ao input subjacente", () => {
      render(
        <InputPreco
          value={0}
          onChange={vi.fn()}
          className="preco-teste-xyz"
        />,
      );
      expect(screen.getByRole("textbox")).toHaveClass("preco-teste-xyz");
    });

    it("placeholder padrão e customizado", () => {
      const { rerender } = render(
        <InputPreco value={0} onChange={vi.fn()} />,
      );
      expect(screen.getByPlaceholderText("0,00")).toBeInTheDocument();

      rerender(
        <InputPreco value={0} onChange={vi.fn()} placeholder="Valor R$" />,
      );
      expect(screen.getByPlaceholderText("Valor R$")).toBeInTheDocument();
    });

    it("disabled bloqueia edição", () => {
      render(<InputPreco value={0} onChange={vi.fn()} disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });
});
