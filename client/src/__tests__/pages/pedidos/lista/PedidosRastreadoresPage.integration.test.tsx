import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { PedidosRastreadoresPage } from "@/pages/pedidos/PedidosRastreadoresPage";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true, user: { nome: "U" } }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

function App({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const emptyList = { data: [] };

describe("PedidosRastreadoresPage (integração refatoração lista)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation((path: string) => {
      if (String(path).includes("pedidos-rastreadores")) {
        return Promise.resolve(emptyList);
      }
      return Promise.resolve(null);
    });
  });

  it("monta, busca lista com chave de escopo 'lista' e exibe o Kanban vazio com toolbar", async () => {
    render(
      <App>
        <PedidosRastreadoresPage />
      </App>,
    );
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalled();
    });
    const first = String(apiMock.mock.calls[0][0]);
    expect(first).toMatch(/pedidos-rastreadores/);
    expect(first).toContain("limit=500");
    await waitFor(() => {
      expect(
        screen.getByTestId("pedidos-rastreadores-busca"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Novo Pedido", { exact: false }),
    ).toBeInTheDocument();
  });

  it("edge: busca com espaços gera requisição com search trim (segunda chamada)", async () => {
    const user = userEvent.setup();
    render(
      <App>
        <PedidosRastreadoresPage />
      </App>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByTestId("pedidos-rastreadores-busca"),
      ).toBeInTheDocument(),
    );
    const n0 = apiMock.mock.calls.length;
    await user.type(screen.getByTestId("pedidos-rastreadores-busca"), "  a");
    await waitFor(() => expect(apiMock.mock.calls.length).toBeGreaterThan(n0));
    const last = String(apiMock.mock.calls[apiMock.mock.calls.length - 1][0]);
    expect(last).toMatch(/search=a/);
  });
});
