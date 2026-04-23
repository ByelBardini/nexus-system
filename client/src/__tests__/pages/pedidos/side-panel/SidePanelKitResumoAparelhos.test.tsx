import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildAparelhoNoKit } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import { SidePanelKitResumoAparelhos } from "@/pages/pedidos/side-panel/components/SidePanelKitResumoAparelhos";

describe("SidePanelKitResumoAparelhos", () => {
  it("renderiza seções e mensagem vazia quando não há dados", () => {
    render(<SidePanelKitResumoAparelhos aparelhos={[]} />);
    expect(screen.getByText("Nenhum aparelho no kit.")).toBeInTheDocument();
  });

  it("exibe blocos de marcas, operadoras e empresas", () => {
    render(
      <SidePanelKitResumoAparelhos
        aparelhos={[
          buildAparelhoNoKit({
            marca: "M",
            modelo: "N",
            operadora: "Op",
            cliente: { id: 1, nome: "Empresa" },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Marcas / Modelos")).toBeInTheDocument();
    expect(screen.getByText("M / N")).toBeInTheDocument();
    expect(screen.getByText("Operadoras")).toBeInTheDocument();
    expect(screen.getByText("Op")).toBeInTheDocument();
    expect(screen.getByText("Empresas")).toBeInTheDocument();
    expect(screen.getByText("Empresa")).toBeInTheDocument();
  });
});
