import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { EquipamentosConfigPageHeader } from "@/pages/equipamentos/config/components/EquipamentosConfigPageHeader";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span data-icon="pm" />,
}));

describe("EquipamentosConfigPageHeader", () => {
  it("título, subtítulo e link para equipamentos", () => {
    render(
      <MemoryRouter>
        <EquipamentosConfigPageHeader />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /Marcas, Modelos e Operadoras/i }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/equipamentos");
  });
});
