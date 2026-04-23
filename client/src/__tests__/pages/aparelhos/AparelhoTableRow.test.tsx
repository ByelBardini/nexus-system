import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AparelhoTableRow } from "@/pages/aparelhos/lista/AparelhoTableRow";
import { aparelhoFixture } from "./fixtures";

vi.mock("@/pages/aparelhos/lista/AparelhoExpandedDetails", () => ({
  AparelhoExpandedDetails: () => (
    <div data-testid="expanded-mock">expanded</div>
  ),
}));

describe("AparelhoTableRow", () => {
  const kitsPorId = new Map<number, string>();

  it("alterna expansão e chama onToggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const ap = aparelhoFixture({
      id: 7,
      tipo: "RASTREADOR",
      status: "EM_ESTOQUE",
      proprietario: "INFINITY",
      identificador: "Z-1",
    });

    const { rerender } = render(
      <table>
        <tbody>
          <AparelhoTableRow
            aparelho={ap}
            kitsPorId={kitsPorId}
            isExpanded={false}
            onToggle={onToggle}
          />
        </tbody>
      </table>,
    );

    await user.click(screen.getByTestId("aparelho-row-7"));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <table>
        <tbody>
          <AparelhoTableRow
            aparelho={ap}
            kitsPorId={kitsPorId}
            isExpanded
            onToggle={onToggle}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId("expanded-mock")).toBeInTheDocument();
  });

  it("edge: identificador ausente exibe id com #", () => {
    const ap = aparelhoFixture({
      id: 99,
      tipo: "SIM",
      status: "CONFIGURADO",
      proprietario: "CLIENTE",
      cliente: { id: 1, nome: "C" },
      identificador: null,
    });

    render(
      <table>
        <tbody>
          <AparelhoTableRow
            aparelho={ap}
            kitsPorId={kitsPorId}
            isExpanded={false}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("#99")).toBeInTheDocument();
  });
});
