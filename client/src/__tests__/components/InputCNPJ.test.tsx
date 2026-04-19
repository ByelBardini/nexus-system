import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InputCNPJ } from "@/components/InputCNPJ";

describe("InputCNPJ", () => {
  it("renderiza sem crash", () => {
    render(<InputCNPJ value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("exibe placeholder padrão", () => {
    render(<InputCNPJ value="" onChange={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("00.000.000/0001-00"),
    ).toBeInTheDocument();
  });

  it("exibe valor formatado", () => {
    render(<InputCNPJ value="12345678000195" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("12.345.678/0001-95")).toBeInTheDocument();
  });

  it("valor vazio exibe campo vazio", () => {
    render(<InputCNPJ value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("chama onChange com apenas dígitos ao digitar", async () => {
    const onChange = vi.fn();
    render(<InputCNPJ value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "12");
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[
      onChange.mock.calls.length - 1
    ][0] as string;
    expect(/^\d+$/.test(lastCall)).toBe(true);
  });

  it("disabled desabilita o input", () => {
    render(<InputCNPJ value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
