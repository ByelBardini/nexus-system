import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PanelBlock,
  PanelRow,
} from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoPanelPrimitives";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

describe("PanelBlock / PanelRow", () => {
  it("renderiza título e filhos", () => {
    render(
      <PanelBlock icon="x" title="Título Bloco">
        <PanelRow label="Campo" value="Valor" />
      </PanelBlock>,
    );
    expect(screen.getByText("Título Bloco")).toBeInTheDocument();
    expect(screen.getByText("Campo")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();
  });
});
