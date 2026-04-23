import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AparelhosTable } from "@/pages/aparelhos/lista/AparelhosTable";
import { aparelhoFixture } from "./fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

describe("AparelhosTable", () => {
  const kitsPorId = new Map<number, string>();

  it("renderiza linhas e estado vazio quando paginated vazio", () => {
    const onToggleRow = vi.fn();
    const onPageChange = vi.fn();

    const { rerender } = render(
      <AparelhosTable
        paginated={[
          aparelhoFixture({
            id: 1,
            tipo: "RASTREADOR",
            status: "EM_ESTOQUE",
            proprietario: "INFINITY",
            identificador: "A",
          }),
        ]}
        filteredLength={1}
        page={0}
        totalPages={1}
        kitsPorId={kitsPorId}
        expandedId={null}
        onToggleRow={onToggleRow}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByTestId("aparelhos-table")).toBeInTheDocument();
    expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument();

    rerender(
      <AparelhosTable
        paginated={[]}
        filteredLength={0}
        page={0}
        totalPages={1}
        kitsPorId={kitsPorId}
        expandedId={null}
        onToggleRow={onToggleRow}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByTestId("aparelhos-empty")).toHaveTextContent(
      "Nenhum aparelho encontrado",
    );
  });

  it("expande detalhe quando expandedId coincide", () => {
    const ap = aparelhoFixture({
      id: 2,
      tipo: "SIM",
      status: "CONFIGURADO",
      proprietario: "CLIENTE",
      cliente: { id: 1, nome: "X" },
      identificador: "S1",
    });

    render(
      <AparelhosTable
        paginated={[ap]}
        filteredLength={1}
        page={0}
        totalPages={1}
        kitsPorId={kitsPorId}
        expandedId={2}
        onToggleRow={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("aparelho-expanded-2")).toBeInTheDocument();
  });

  it("propaga onToggleRow ao clicar na linha", async () => {
    const user = userEvent.setup();
    const onToggleRow = vi.fn();
    const ap = aparelhoFixture({
      id: 3,
      tipo: "RASTREADOR",
      status: "INSTALADO",
      proprietario: "INFINITY",
    });

    render(
      <AparelhosTable
        paginated={[ap]}
        filteredLength={1}
        page={0}
        totalPages={1}
        kitsPorId={kitsPorId}
        expandedId={null}
        onToggleRow={onToggleRow}
        onPageChange={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("aparelho-row-3"));
    expect(onToggleRow).toHaveBeenCalledWith(3);
  });
});
