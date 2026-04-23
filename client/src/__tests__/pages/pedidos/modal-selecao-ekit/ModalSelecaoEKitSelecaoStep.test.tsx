import type { UseMutationResult } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { KitResumo } from "@/pages/pedidos/shared/pedidos-config-types";
import { ModalSelecaoEKitSelecaoStep } from "@/pages/pedidos/modal-selecao-ekit/components/ModalSelecaoEKitSelecaoStep";
import { buildKitDetalhe } from "./modal-selecao-ekit.fixtures";

function stubCreateMutation(
  isPending: boolean,
): UseMutationResult<KitResumo, Error, string, unknown> {
  return { isPending } as UseMutationResult<KitResumo, Error, string, unknown>;
}

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} aria-hidden />
  ),
}));

function TestApp({ children }: { children: ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("ModalSelecaoEKitSelecaoStep", () => {
  it("exibe aviso quando há kits ocultos por incompatibilidade", () => {
    const kitsDisp = [
      buildKitDetalhe({ id: 1, nome: "A" }),
      buildKitDetalhe({ id: 2, nome: "B" }),
    ];
    const kitsComp = [buildKitDetalhe({ id: 1, nome: "A" })];

    render(
      <TestApp>
        <ModalSelecaoEKitSelecaoStep
          showCriarNovo={false}
          setShowCriarNovo={vi.fn()}
          nomeNovoKit=""
          setNomeNovoKit={vi.fn()}
          filtroBusca=""
          setFiltroBusca={vi.fn()}
          loadingKits={false}
          kitsFiltrados={kitsComp}
          kitsDisponiveis={kitsDisp}
          kitsCompativeis={kitsComp}
          createMutation={stubCreateMutation(false)}
          handleCriarNovo={vi.fn()}
          handleEscolherKit={vi.fn()}
          handleClose={vi.fn()}
        />
      </TestApp>,
    );

    expect(
      screen.getByText(/1 kit oculto por incompatibilidade/i),
    ).toBeInTheDocument();
  });

  it("dispara handleEscolherKit ao clicar em Escolher", async () => {
    const user = userEvent.setup();
    const onEscolher = vi.fn();
    const k = buildKitDetalhe({ id: 7, nome: "Escolhido" });

    render(
      <TestApp>
        <ModalSelecaoEKitSelecaoStep
          showCriarNovo={false}
          setShowCriarNovo={vi.fn()}
          nomeNovoKit=""
          setNomeNovoKit={vi.fn()}
          filtroBusca=""
          setFiltroBusca={vi.fn()}
          loadingKits={false}
          kitsFiltrados={[k]}
          kitsDisponiveis={[k]}
          kitsCompativeis={[k]}
          createMutation={stubCreateMutation(false)}
          handleCriarNovo={vi.fn()}
          handleEscolherKit={onEscolher}
          handleClose={vi.fn()}
        />
      </TestApp>,
    );

    await user.click(screen.getByRole("button", { name: /Escolher/i }));
    expect(onEscolher).toHaveBeenCalledWith(k);
  });
});
