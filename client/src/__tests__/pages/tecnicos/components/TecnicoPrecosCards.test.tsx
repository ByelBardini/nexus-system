import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TecnicoPrecosCards } from "@/pages/tecnicos/components/TecnicoPrecosCards";

describe("TecnicoPrecosCards", () => {
  it("renderiza cinco rótulos de preço", () => {
    render(
      <TecnicoPrecosCards
        precos={{
          instalacaoComBloqueio: 100,
          instalacaoSemBloqueio: 200,
          revisao: 50,
          retirada: 10,
          deslocamento: 5,
        }}
      />,
    );
    expect(screen.getByText(/Inst\. c\/ Bloqueio/i)).toBeInTheDocument();
    expect(screen.getByText(/Inst\. s\/ Bloqueio/i)).toBeInTheDocument();
    expect(screen.getByText(/^Revisão$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Retirada$/i)).toBeInTheDocument();
    expect(screen.getByText(/Deslocamento/i)).toBeInTheDocument();
  });

  it("edge: precos undefined mostra zeros formatados", () => {
    const { container } = render(<TecnicoPrecosCards precos={undefined} />);
    expect(container.textContent).toMatch(/R\$/);
  });
});
