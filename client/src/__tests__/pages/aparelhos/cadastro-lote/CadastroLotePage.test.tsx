import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CadastroLotePage } from "@/pages/aparelhos/CadastroLotePage";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: () => <div data-testid="select-cliente" />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden="true" />
  ),
}));

function setupApi() {
  apiMock.mockImplementation((url: string) => {
    if (url === "/clientes") return Promise.resolve([]);
    if (url === "/equipamentos/marcas")
      return Promise.resolve([{ id: 1, nome: "M", ativo: true }]);
    if (url === "/equipamentos/modelos")
      return Promise.resolve([
        {
          id: 1,
          nome: "X",
          ativo: true,
          marca: { id: 1, nome: "M" },
          minCaracteresImei: 15,
        },
      ]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([{ id: 1, nome: "O", ativo: true }]);
    if (url === "/equipamentos/marcas-simcard" || url.includes("marcas-simcard"))
      return Promise.resolve([
        {
          id: 1,
          nome: "SC",
          operadoraId: 1,
          temPlanos: false,
          operadora: { id: 1, nome: "O" },
        },
      ]);
    if (url.startsWith("/debitos-rastreadores"))
      return Promise.resolve({ data: [] });
    if (url === "/aparelhos")
      return Promise.resolve([{ identificador: "1", lote: null }]);
    return Promise.resolve(null);
  });
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return render(<CadastroLotePage />, { wrapper: W });
}

describe("CadastroLotePage (integrado, APIs mockadas)", () => {
  beforeEach(() => {
    setupApi();
  });

  it("exibe título, blocos e resumo; sem seção de abate quando não há débitos", async () => {
    renderPage();
    expect(
      await screen.findByText(/Entrada de Rastreador\/Simcard/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Identificação do Lote/i)).toBeInTheDocument();
    expect(await screen.findByText(/Propriedade e Tipo/i)).toBeInTheDocument();
    expect(await screen.findByText(/Resumo do Lote/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalled();
    });
    expect(screen.queryByText(/Abater Dívida/i)).not.toBeInTheDocument();
  });

  it("botão registrar inicia desabilitado (estado vazio) e exibe atalho cancelar", async () => {
    renderPage();
    expect(
      await screen.findByRole("button", { name: /Registrar Lote/i }),
    ).toBeDisabled();
    expect(screen.getByRole("link", { name: "" })).toHaveAttribute(
      "href",
      "/aparelhos",
    );
  });
});
