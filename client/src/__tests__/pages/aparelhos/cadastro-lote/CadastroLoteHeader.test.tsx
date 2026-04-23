import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CadastroLoteHeader } from "@/pages/aparelhos/cadastro-lote/CadastroLoteHeader";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid="icon" data-name={name} />
  ),
}));

describe("CadastroLoteHeader", () => {
  it("exibe título, subtítulo e link de volta", () => {
    render(
      <MemoryRouter>
        <CadastroLoteHeader />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /Entrada de Rastreador\/Simcard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cadastro em massa de lote/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "" });
    expect(link).toHaveAttribute("href", "/aparelhos");
  });
});
