import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TesteSectionShell } from "@/pages/testes/components/TesteSectionShell";

describe("TesteSectionShell", () => {
  it("renderiza título e ícone acessível via heading", () => {
    render(
      <TesteSectionShell icon="wifi" title="Seção teste">
        <div>Conteúdo</div>
      </TesteSectionShell>,
    );
    expect(
      screen.getByRole("heading", { name: /seção teste/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("renderiza headerRight quando informado", () => {
    render(
      <TesteSectionShell
        icon="description"
        title="Com extra"
        headerRight={<span data-testid="extra">Extra</span>}
      >
        <p>Body</p>
      </TesteSectionShell>,
    );
    expect(screen.getByTestId("extra")).toHaveTextContent("Extra");
  });

  it("edge: sem headerRight não exibe região extra vazia problemática", () => {
    const { container } = render(
      <TesteSectionShell icon="devices" title="Só título">
        <span>Inner</span>
      </TesteSectionShell>,
    );
    expect(container.querySelectorAll('[class*="shrink-0"]').length).toBeGreaterThanOrEqual(0);
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });
});
