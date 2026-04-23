import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { formatarCPFCNPJ } from "@/lib/format";
import { InputCPFCNPJ } from "@/components/InputCPFCNPJ";

/** Espelha o padrão real: pai guarda só dígitos e repassa `value` + setState. */
function ControlledCPFCNPJField(props: {
  initial?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}): ReactNode {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <div>
      <InputCPFCNPJ
        value={value}
        onChange={setValue}
        disabled={props.disabled}
        placeholder={props.placeholder}
        className={props.className}
      />
      <output data-testid="stored-digits" hidden>
        {value}
      </output>
    </div>
  );
}

/** Permite forçar `value` de fora (ex.: limpar form / hidratação). */
function ControlledWithSetter(props: { initial: string }): ReactNode {
  const [value, setValue] = useState(props.initial);
  return (
    <div>
      <InputCPFCNPJ value={value} onChange={setValue} />
      <button type="button" onClick={() => setValue("")}>
        limpar
      </button>
    </div>
  );
}

function setupUser() {
  return userEvent.setup({ delay: null });
}

describe("InputCPFCNPJ", () => {
  describe("exibição a partir de value (dígitos no pai)", () => {
    it.each`
      value                | exibido
      ${"12345678901"}     | ${"123.456.789-01"}
      ${"12345678000195"}  | ${"12.345.678/0001-95"}
    `("formata CPF (11) ou CNPJ (14): exibe $exibido", ({ value, exibido }) => {
      const onChange = vi.fn();
      render(<InputCPFCNPJ value={value} onChange={onChange} />);
      expect(screen.getByRole("textbox")).toHaveValue(exibido);
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each`
      value          | exibido
      ${"123"}       | ${"123"}
      ${"1234567"}   | ${"123.456.7"}
      ${"1234567890"}| ${"123.456.789-0"}
    `("formata CPF em estágios parciais: $value → $exibido", ({ value, exibido }) => {
      render(<InputCPFCNPJ value={value} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue(exibido);
    });

    it("normaliza value quando o pai ainda tem pontuação (ex.: dado legado)", () => {
      render(
        <InputCPFCNPJ value="12.345.678/0001-95" onChange={vi.fn()} />,
      );
      expect(screen.getByRole("textbox")).toHaveValue("12.345.678/0001-95");
    });

    it("string só com separadores: formata para vazio (não pisca com lixo vindo de API mal tipada)", () => {
      render(<InputCPFCNPJ value="...-//" onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("value truthy só com espaços: tela vazia (dígitos 0; não usa trim no prop, mas a máscara zera)", () => {
      render(<InputCPFCNPJ value="  \t  " onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("value com 15+ dígitos: segue contrato de formatarCPFCNPJ (só os 14 do CNPJ entram no layout canônico)", () => {
      const long = "123456780001950";
      const expected = formatarCPFCNPJ(long);
      render(<InputCPFCNPJ value={long} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue(expected);
      expect(expected).toBe("12.345.678/0001-95");
    });
  });

  describe("comportamento controlado (estado no pai, como em formulário)", () => {
    it("onChange emite a string de dígitos a cada tecla, na ordem (contrato com React Hook Form / estado)", async () => {
      const onChange = vi.fn();
      function Wrapper() {
        const [v, setV] = useState("");
        return (
          <InputCPFCNPJ
            value={v}
            onChange={(next) => {
              onChange(next);
              setV(next);
            }}
          />
        );
      }
      const user = setupUser();
      render(<Wrapper />);
      const input = screen.getByRole("textbox");
      await user.type(input, "123");
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onChange.mock.calls.map((c) => c[0])).toEqual([
        "1",
        "12",
        "123",
      ]);
    });

    it("atualiza estado com dígitos puros; exibe CPF completo após 11 teclas", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="" />);
      const input = screen.getByRole("textbox");
      await user.type(input, "12345678901");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent(
        "12345678901",
      );
      expect(input).toHaveValue("123.456.789-01");
    });

    it("após 11º dígito, o 12º passa a máscara de CNPJ (transição 11 → 12 dígitos)", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="" />);
      const input = screen.getByRole("textbox");
      await user.type(input, "123456789012");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent(
        "123456789012",
      );
      expect(input).toHaveValue("12.345.678/9012");
    });

    it("completa CNPJ (14 dígitos) com a máscara canônica", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="" />);
      const input = screen.getByRole("textbox");
      await user.type(input, "12345678000195");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent(
        "12345678000195",
      );
      expect(input).toHaveValue("12.345.678/0001-95");
    });

    it("com CNPJ completo, maxLength=18 no DOM evita 15º dígito (não cresce o estado do pai)", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="12345678000195" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("12.345.678/0001-95");
      await user.type(input, "9");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent(
        "12345678000195",
      );
    });

    it("cola CNPJ com máscara: último onChange contém 14 dígitos", async () => {
      const user = setupUser();
      const onChange = vi.fn();
      render(<InputCPFCNPJ value="" onChange={onChange} />);
      const input = screen.getByRole("textbox");
      input.focus();
      await user.paste("12.345.678/0001-95");
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.at(-1)![0]).toBe("12345678000195");
    });

    it("cola CPF com máscara: último onChange contém 11 dígitos", async () => {
      const user = setupUser();
      const onChange = vi.fn();
      render(<InputCPFCNPJ value="" onChange={onChange} />);
      const input = screen.getByRole("textbox");
      input.focus();
      await user.paste("123.456.789-01");
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.at(-1)![0]).toBe("12345678901");
    });

    it("rejeita letras: só dígitos alimentam o pai", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="" />);
      const input = screen.getByRole("textbox");
      await user.type(input, "ab12c3d");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent("123");
    });

    it("esvazia o campo com Backspace após digitar (pai volta a string vazia)", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="" />);
      const input = screen.getByRole("textbox");
      await user.type(input, "123{Backspace}{Backspace}{Backspace}");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent("");
      expect(input).toHaveValue("");
    });

    it("após user.clear, novo dígito não concatena com CPF anterior (trocar documento)", async () => {
      const user = setupUser();
      render(<ControlledCPFCNPJField initial="12345678901" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("123.456.789-01");
      await user.clear(input);
      expect(screen.getByTestId("stored-digits")).toHaveTextContent("");
      await user.type(input, "4");
      expect(screen.getByTestId("stored-digits")).toHaveTextContent("4");
      expect(input).toHaveValue("4");
    });

    it("quando o pai zera o value (ex.: limpar modal), o input esvazia", async () => {
      const user = setupUser();
      render(<ControlledWithSetter initial="12345678901" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("123.456.789-01");
      await user.click(screen.getByRole("button", { name: "limpar" }));
      expect(input).toHaveValue("");
    });
  });

  describe("props e acessibilidade do DOM", () => {
    it("exige placeholder, tipo texto, teclado numérico, sem autocomplete e tamanho máximo da máscara", () => {
      render(<InputCPFCNPJ value="" onChange={vi.fn()} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("inputMode", "numeric");
      expect(input).toHaveAttribute("maxLength", "18");
      expect(input).toHaveAttribute("autoComplete", "off");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("placeholder", "000.000.000-00");
    });

    it("placeholder e className são repassados ao input", () => {
      render(
        <InputCPFCNPJ
          value=""
          onChange={vi.fn()}
          placeholder="Documento"
          className="h-9 w-full"
        />,
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "Documento");
      expect(input).toHaveClass("h-9", "w-full");
    });

    it("desabilitado: não chama onChange ao tentar digitar", async () => {
      const user = setupUser();
      const onChange = vi.fn();
      render(<InputCPFCNPJ value="" onChange={onChange} disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
      await user.type(input, "99");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("desabilitado: colar não chama onChange (campo inerte)", async () => {
      const user = setupUser();
      const onChange = vi.fn();
      render(<InputCPFCNPJ value="" onChange={onChange} disabled />);
      const input = screen.getByRole("textbox");
      input.focus();
      await user.paste("12.345.678/0001-95");
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
