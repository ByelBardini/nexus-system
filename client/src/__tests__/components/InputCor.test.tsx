import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InputCor } from "@/components/InputCor";

vi.mock("react-colorful", () => ({
  HexColorPicker: ({
    color,
    onChange,
  }: {
    color: string;
    onChange: (hex: string) => void;
  }) => (
    <div
      data-testid="hex-color-picker"
      data-color={color}
      onClick={() => onChange("#ff0000")}
    />
  ),
}));

function Controlled({ initial = "" }: { initial?: string }) {
  const [cor, setCor] = useState<string | undefined>(initial || undefined);
  return (
    <div>
      <InputCor value={cor} onChange={(v) => setCor(v)} />
      <span data-testid="current-value">{cor ?? "none"}</span>
    </div>
  );
}

describe("InputCor — renderização sem valor", () => {
  it('exibe "Escolher cor" quando sem valor', () => {
    render(<InputCor value={undefined} onChange={vi.fn()} />);
    expect(screen.getByText("Escolher cor")).toBeInTheDocument();
  });

  it("não exibe botão remover quando sem valor", () => {
    render(<InputCor value={undefined} onChange={vi.fn()} />);
    expect(screen.queryByText("Remover cor")).not.toBeInTheDocument();
  });

  it("picker começa fechado", () => {
    render(<InputCor value={undefined} onChange={vi.fn()} />);
    expect(screen.queryByTestId("hex-color-picker")).not.toBeInTheDocument();
  });
});

describe("InputCor — renderização com valor", () => {
  it("exibe o hex value quando preenchido", () => {
    render(<InputCor value="#3b82f6" onChange={vi.fn()} />);
    expect(screen.getByText("#3b82f6")).toBeInTheDocument();
  });

  it("exibe botão remover quando há valor", async () => {
    render(<InputCor value="#3b82f6" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /#3b82f6/i }));
    expect(screen.getByText("Remover cor")).toBeInTheDocument();
  });

  it("passa a cor correta para o HexColorPicker", async () => {
    render(<InputCor value="#10b981" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /#10b981/i }));
    expect(screen.getByTestId("hex-color-picker")).toHaveAttribute(
      "data-color",
      "#10b981",
    );
  });
});

describe("InputCor — abrir/fechar picker", () => {
  it("abre picker ao clicar no botão", async () => {
    render(<InputCor value={undefined} onChange={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );
    expect(screen.getByTestId("hex-color-picker")).toBeInTheDocument();
  });

  it("fecha picker ao clicar novamente no botão", async () => {
    render(<InputCor value={undefined} onChange={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /escolher cor/i });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.queryByTestId("hex-color-picker")).not.toBeInTheDocument();
  });

  it("fecha picker ao clicar fora do componente", async () => {
    render(
      <div>
        <InputCor value={undefined} onChange={vi.fn()} />
        <button>Fora</button>
      </div>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );
    expect(screen.getByTestId("hex-color-picker")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Fora" }));
    await waitFor(() => {
      expect(screen.queryByTestId("hex-color-picker")).not.toBeInTheDocument();
    });
  });
});

describe("InputCor — seleção via HexColorPicker", () => {
  it("chama onChange ao interagir com o picker", async () => {
    render(<Controlled />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );
    await userEvent.click(screen.getByTestId("hex-color-picker"));
    expect(screen.getByTestId("current-value").textContent).toBe("#ff0000");
  });

  it("atualiza o hex input ao selecionar cor no picker", async () => {
    render(<Controlled />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );
    await userEvent.click(screen.getByTestId("hex-color-picker"));
    const hexInput = screen.getByPlaceholderText("3b82f6");
    expect((hexInput as HTMLInputElement).value).toBe("ff0000");
  });
});

describe("InputCor — paleta rápida", () => {
  it("chama onChange com a cor clicada na paleta", async () => {
    const onChange = vi.fn();
    render(<InputCor value={undefined} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const paletteBtn = screen.getByTitle("#ef4444");
    await userEvent.click(paletteBtn);

    expect(onChange).toHaveBeenCalledWith("#ef4444");
  });

  it("destaca a cor selecionada na paleta", async () => {
    render(<InputCor value="#ef4444" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /#ef4444/i }));

    const paletteBtn = screen.getByTitle("#ef4444");
    expect(paletteBtn).toHaveClass("border-slate-700");
  });

  it("exibe os doze swatches da paleta", async () => {
    render(<InputCor value={undefined} onChange={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const paletteButtons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("title")?.startsWith("#"));
    expect(paletteButtons).toHaveLength(12);
  });
});

describe("InputCor — remover cor", () => {
  it("chama onChange(undefined) ao clicar Remover cor", async () => {
    const onChange = vi.fn();
    render(<InputCor value="#3b82f6" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /#3b82f6/i }));
    await userEvent.click(screen.getByText("Remover cor"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("limpa o valor no estado controlado ao remover", async () => {
    render(<Controlled initial="#3b82f6" />);
    await userEvent.click(screen.getByRole("button", { name: /#3b82f6/i }));
    await userEvent.click(screen.getByText("Remover cor"));
    expect(screen.getByTestId("current-value").textContent).toBe("none");
  });
});

describe("InputCor — input hex manual", () => {
  it("aceita hex de 6 chars sem # e chama onChange com # prefixado", async () => {
    const onChange = vi.fn();
    render(<InputCor value={undefined} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const hexInput = screen.getByPlaceholderText("3b82f6");
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "aabbcc");
    fireEvent.blur(hexInput);

    expect(onChange).toHaveBeenCalledWith("#aabbcc");
  });

  it("aceita hex que já começa com # e normaliza", async () => {
    const onChange = vi.fn();
    render(<InputCor value={undefined} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const hexInput = screen.getByPlaceholderText("3b82f6");
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "#1a2b3c");
    fireEvent.blur(hexInput);

    expect(onChange).toHaveBeenCalledWith("#1a2b3c");
  });

  it("não chama onChange para hex incompleto (menos de 6 chars)", async () => {
    const onChange = vi.fn();
    render(<InputCor value={undefined} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const hexInput = screen.getByPlaceholderText("3b82f6");
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "abc");
    fireEvent.blur(hexInput);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("não chama onChange para hex com caracteres inválidos", async () => {
    const onChange = vi.fn();
    render(<InputCor value={undefined} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const hexInput = screen.getByPlaceholderText("3b82f6");
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "zzzzzz");
    fireEvent.blur(hexInput);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("pressionar Enter confirma o hex input", async () => {
    const onChange = vi.fn();
    render(<InputCor value={undefined} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /escolher cor/i }),
    );

    const hexInput = screen.getByPlaceholderText("3b82f6");
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "ff6600");
    fireEvent.keyDown(hexInput, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("#ff6600");
  });
});

describe("InputCor — sincronização value → hexInput", () => {
  it("atualiza o hex input quando value muda externamente", async () => {
    const { rerender } = render(
      <InputCor value="#aabbcc" onChange={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /#aabbcc/i }));
    expect(
      (screen.getByPlaceholderText("3b82f6") as HTMLInputElement).value,
    ).toBe("aabbcc");

    rerender(<InputCor value="#112233" onChange={vi.fn()} />);
    expect(
      (screen.getByPlaceholderText("3b82f6") as HTMLInputElement).value,
    ).toBe("112233");
  });
});
