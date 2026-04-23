import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalSelecaoEKitTabelaRastreadoresNoKit } from "@/pages/pedidos/modal-selecao-ekit/components/ModalSelecaoEKitTabelaRastreadoresNoKit";
import {
  buildAparelhoNoKit,
  buildKitComAparelhos,
} from "./modal-selecao-ekit.fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

describe("ModalSelecaoEKitTabelaRastreadoresNoKit", () => {
  it("mostra estado vazio quando não há aparelhos no kit", () => {
    render(
      <ModalSelecaoEKitTabelaRastreadoresNoKit
        isMisto={false}
        aparelhosNoKit={[]}
        kitComAparelhos={buildKitComAparelhos()}
        destinatariosData={undefined}
        pedidoApi={null}
        progressQtd={0}
        qtdEsperada={3}
        onRemover={vi.fn()}
      />,
    );
    expect(screen.getByText("Nenhum rastreador no kit.")).toBeInTheDocument();
  });

  it("coluna Cliente usa getDestinatarioExibicaoAparelhoNoKit (nome do cliente)", () => {
    const a = buildAparelhoNoKit({
      id: 77,
      cliente: { id: 1, nome: "Empresa ACME" },
      tecnico: { id: 2, nome: "Técnico" },
    });
    render(
      <ModalSelecaoEKitTabelaRastreadoresNoKit
        isMisto={false}
        aparelhosNoKit={[a]}
        kitComAparelhos={buildKitComAparelhos({ nome: "MeuKit" })}
        destinatariosData={undefined}
        pedidoApi={null}
        progressQtd={1}
        qtdEsperada={3}
        onRemover={vi.fn()}
      />,
    );
    expect(screen.getByText("Empresa ACME")).toBeInTheDocument();
    expect(screen.queryByText("Técnico")).not.toBeInTheDocument();
  });

  it("Infinity sem cliente exibe rótulo Infinity", () => {
    const a = buildAparelhoNoKit({
      id: 88,
      proprietario: "INFINITY",
      cliente: undefined,
      tecnico: undefined,
    });
    render(
      <ModalSelecaoEKitTabelaRastreadoresNoKit
        isMisto={false}
        aparelhosNoKit={[a]}
        kitComAparelhos={buildKitComAparelhos()}
        destinatariosData={undefined}
        pedidoApi={null}
        progressQtd={1}
        qtdEsperada={1}
        onRemover={vi.fn()}
      />,
    );
    expect(screen.getByText("Infinity")).toBeInTheDocument();
  });

  it("chama onRemover ao clicar em Remover", async () => {
    const user = userEvent.setup();
    const onRemover = vi.fn();
    const a = buildAparelhoNoKit({ id: 55 });

    render(
      <ModalSelecaoEKitTabelaRastreadoresNoKit
        isMisto={false}
        aparelhosNoKit={[a]}
        kitComAparelhos={buildKitComAparelhos({ nome: "K" })}
        destinatariosData={undefined}
        pedidoApi={null}
        progressQtd={1}
        qtdEsperada={3}
        onRemover={onRemover}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(onRemover).toHaveBeenCalledWith(55);
  });
});
