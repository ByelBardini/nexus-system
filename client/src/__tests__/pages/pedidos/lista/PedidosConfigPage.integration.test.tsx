import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { PedidosConfigPage } from "@/pages/pedidos/PedidosConfigPage";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true, user: { nome: "U" } }),
}));

function App({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const empty = { data: [] };

describe("PedidosConfigPage (integração refatoração lista)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/pedidos-rastreadores")) {
        return Promise.resolve(empty);
      }
      if (String(path).includes("kits/detalhes")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
  });

  it("Query usa escopo 'config' na chave: lista + config no path implícito", async () => {
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    const listCalls = apiMock.mock.calls
      .map((c) => String(c[0]))
      .filter((p) => p.includes("pedidos-rastreadores"));
    expect(listCalls.length).toBeGreaterThan(0);
    expect(listCalls[0]).toMatch(/pedidos-rastreadores/);
  });

  it("toolbar: placeholder da config (busca PED/IMEI)", async () => {
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Buscar por PED, Técnico ou IMEI..."),
      ).toBeInTheDocument(),
    );
  });
});
