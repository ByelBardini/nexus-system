import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PareamentoPageHeader } from "@/pages/equipamentos/pareamento/components/PareamentoPageHeader";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

describe("PareamentoPageHeader", () => {
  it("exibe link para /equipamentos e título", () => {
    render(
      <PareamentoPageHeader
        modo="individual"
        onModoChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/equipamentos");
    expect(
      screen.getByRole("heading", { name: /pareamento de equipamentos/i }),
    ).toBeInTheDocument();
  });

  it("subtítulo reflete modo individual", () => {
    render(
      <PareamentoPageHeader modo="individual" onModoChange={vi.fn()} />,
    );
    expect(
      screen.getByText(/pareamento individual/i),
    ).toBeInTheDocument();
  });

  it("chama onModoChange ao clicar nas abas", async () => {
    const onModoChange = vi.fn();
    render(
      <PareamentoPageHeader modo="individual" onModoChange={onModoChange} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /importação csv/i }),
    );
    expect(onModoChange).toHaveBeenCalledWith("csv");
  });
});
