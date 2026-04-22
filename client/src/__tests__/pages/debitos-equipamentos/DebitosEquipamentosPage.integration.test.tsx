import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebitosEquipamentosPage } from "@/pages/debitos-equipamentos/DebitosEquipamentosPage";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

function TestApp({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("DebitosEquipamentosPage (integração)", () => {
  beforeEach(() => {
    apiMock.mockResolvedValue({
      data: [
        buildDebitoRastreadorListaApi({
          id: 1,
          devedorCliente: { id: 1, nome: "SóEu" },
        }),
        buildDebitoRastreadorListaApi({
          id: 2,
          quantidade: 0,
          devedorCliente: { id: 2, nome: "Quitado" },
        }),
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it("carrega, exibe rodapé com contagem e filtra por busca", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <DebitosEquipamentosPage />
      </TestApp>,
    );
    await waitFor(() =>
      expect(screen.getByText("2 registro(s) encontrado(s)")).toBeInTheDocument(),
    );
    await user.type(
      screen.getByPlaceholderText("Devedor ou credor..."),
      "Quitado",
    );
    await waitFor(() =>
      expect(
        screen.getByText("1 registro(s) encontrado(s)"),
      ).toBeInTheDocument(),
    );
  });

  it("limpa filtros volta contagem total", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <DebitosEquipamentosPage />
      </TestApp>,
    );
    await waitFor(() =>
      expect(screen.getByText("2 registro(s) encontrado(s)")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Quitado" }));
    await waitFor(() =>
      expect(
        screen.getByText("1 registro(s) encontrado(s)"),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Limpar/i }));
    await waitFor(() =>
      expect(screen.getByText("2 registro(s) encontrado(s)")).toBeInTheDocument(),
    );
  });

  it("expande linha e mostra painel de detalhes", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <DebitosEquipamentosPage />
      </TestApp>,
    );
    await waitFor(() => expect(screen.getByText("SóEu")).toBeInTheDocument());
    await user.click(screen.getByText("SóEu"));
    await waitFor(() =>
      expect(
        screen.getAllByText("Distribuição de Modelos").length,
      ).toBeGreaterThan(0),
    );
  });
});
