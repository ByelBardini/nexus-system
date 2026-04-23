import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AparelhoExpandedDetails } from "@/pages/aparelhos/lista/AparelhoExpandedDetails";
import { aparelhoFixture } from "./fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

describe("AparelhoExpandedDetails", () => {
  const kitsPorId = new Map<number, string>([[1, "Kit Fallback"]]);

  it("mostra dados de rastreador e histórico", () => {
    const ap = aparelhoFixture({
      id: 10,
      tipo: "RASTREADOR",
      status: "CONFIGURADO",
      proprietario: "INFINITY",
      identificador: "IMEI-99",
      marca: "M1",
      modelo: "X",
      historico: [
        {
          data: "2024-02-01T10:00:00.000Z",
          acao: "Entrada",
          descricao: "Lote",
        },
      ],
    });

    render(<AparelhoExpandedDetails aparelho={ap} kitsPorId={kitsPorId} />);

    expect(screen.getByTestId("aparelho-expanded-10")).toBeInTheDocument();
    expect(screen.getByText("IMEI")).toBeInTheDocument();
    expect(screen.getByText("IMEI-99")).toBeInTheDocument();
    expect(screen.getByTestId("aparelho-historico-item-0")).toHaveTextContent(
      "Entrada",
    );
  });

  it("SIM sem histórico exibe mensagem vazia", () => {
    const ap = aparelhoFixture({
      id: 11,
      tipo: "SIM",
      status: "EM_ESTOQUE",
      proprietario: "CLIENTE",
      cliente: { id: 1, nome: "Cli" },
      operadora: "Claro",
      historico: [],
    });

    render(<AparelhoExpandedDetails aparelho={ap} kitsPorId={kitsPorId} />);

    expect(screen.getByTestId("aparelho-historico-vazio")).toBeInTheDocument();
    expect(screen.getByText("ICCID")).toBeInTheDocument();
  });

  it("edge: ordem de serviço ausente mostra traços", () => {
    const ap = aparelhoFixture({
      id: 12,
      tipo: "RASTREADOR",
      status: "INSTALADO",
      proprietario: "INFINITY",
      ordemServicoVinculada: null,
    });

    render(<AparelhoExpandedDetails aparelho={ap} kitsPorId={kitsPorId} />);

    const vinculos = screen.getByTestId("aparelho-expanded-vinculos");
    expect(vinculos.textContent).toContain("-");
  });
});
