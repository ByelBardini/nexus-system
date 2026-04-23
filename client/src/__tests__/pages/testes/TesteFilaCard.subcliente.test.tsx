import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TesteFilaCard } from "@/pages/testes/components/TesteFilaCard";
import { osTesteFixture } from "./fixtures";

describe("TesteFilaCard + subclienteLabel", () => {
  it("mostra snapshot quando subcliente é null", () => {
    const os = osTesteFixture({
      subcliente: null,
      subclienteSnapshotNome: "Só snapshot",
    });
    render(<TesteFilaCard item={os} isSelected={false} onClick={() => {}} />);
    expect(screen.getByText("Só snapshot")).toBeInTheDocument();
  });

  it("edge: prefere nome do subcliente quando ambos existem", () => {
    const os = osTesteFixture({
      subcliente: { id: 1, nome: "Base Real" },
      subclienteSnapshotNome: "Snap",
    });
    render(<TesteFilaCard item={os} isSelected={false} onClick={() => {}} />);
    expect(screen.getByText("Base Real")).toBeInTheDocument();
    expect(screen.queryByText("Snap")).not.toBeInTheDocument();
  });
});
