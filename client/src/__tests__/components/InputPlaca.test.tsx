import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InputPlaca } from "@/components/InputPlaca";

describe("InputPlaca", () => {
  it("renderiza sem crash", () => {
    render(<InputPlaca value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("exibe placeholder padrão", () => {
    render(<InputPlaca value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("ABC-1D23")).toBeInTheDocument();
  });

  it("exibe o valor como passado (formatação via prop)", () => {
    render(<InputPlaca value="ABC-1234" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("ABC-1234")).toBeInTheDocument();
  });

  it("chama onChange com valor formatado ao digitar", async () => {
    const onChange = vi.fn();
    render(<InputPlaca value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "abc");
    expect(onChange).toHaveBeenCalled();
    // formatarPlaca converte para uppercase
    const lastCall = onChange.mock.calls[
      onChange.mock.calls.length - 1
    ][0] as string;
    expect(lastCall).toBe(lastCall.toUpperCase());
  });

  it("disabled desabilita o input", () => {
    render(<InputPlaca value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("valor vazio exibe campo vazio", () => {
    render(<InputPlaca value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
