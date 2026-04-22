import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AparelhosPage } from "@/pages/aparelhos/AparelhosPage";
import type { Aparelho } from "@/pages/aparelhos/lista/aparelhos-page.shared";
import { aparelhoFixture } from "./fixtures";

const apiMock = vi.hoisted(() => vi.fn());
const hasPermissionMock = vi.hoisted(() =>
  vi.fn<(perm: string) => boolean>(() => true),
);

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SearchableSelect", () => ({
  SearchableSelect: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      aria-label="searchable-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }
  return render(<AparelhosPage />, { wrapper: Wrapper });
}

describe("AparelhosPage (fluxo integrado)", () => {
  beforeEach(() => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          aparelhoFixture({
            id: 1,
            tipo: "RASTREADOR",
            status: "EM_ESTOQUE",
            proprietario: "INFINITY",
            identificador: "IMEI-ALPHA",
            tecnico: { id: 1, nome: "Técnico Silva" },
            lote: { id: 1, referencia: "L2024" },
          }),
          aparelhoFixture({
            id: 2,
            tipo: "SIM",
            status: "CONFIGURADO",
            proprietario: "CLIENTE",
            cliente: { id: 9, nome: "Cliente Beta" },
            identificador: "890",
            operadora: "Vivo",
          }),
        ] satisfies Aparelho[]);
      }
      if (url === "/aparelhos/pareamento/kits") {
        return Promise.resolve([{ id: 1, nome: "Kit K" }]);
      }
      return Promise.resolve([]);
    });
    hasPermissionMock.mockImplementation(() => true);
  });

  it("carrega pipeline, busca filtra por técnico e expande linha", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelhos-status-pipeline")).toBeInTheDocument(),
    );

    expect(screen.getByTestId("aparelhos-toolbar")).toBeInTheDocument();

    const busca = screen.getByTestId("aparelhos-busca-input");
    await user.clear(busca);
    await user.type(busca, "Silva");

    await waitFor(() => {
      expect(screen.getByText("IMEI-ALPHA")).toBeInTheDocument();
      expect(screen.queryByText("890")).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId("aparelho-row-1"));
    expect(screen.getByTestId("aparelho-expanded-1")).toBeInTheDocument();
  });

  it("clique no card de status filtra lista", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("aparelhos-status-configurado"));
    await waitFor(() => {
      expect(screen.queryByTestId("aparelho-row-1")).toBeNull();
      expect(screen.getByTestId("aparelho-row-2")).toBeInTheDocument();
    });
  });

  it("edge: busca sem match mostra vazio", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );

    const busca = screen.getByTestId("aparelhos-busca-input");
    await user.clear(busca);
    await user.type(busca, "não-existe-xyz");

    await waitFor(() => {
      expect(screen.getByTestId("aparelhos-empty")).toBeInTheDocument();
    });
  });

  it("sem permissão de criar oculta atalhos do toolbar", async () => {
    hasPermissionMock.mockImplementation(
      (p) => p !== "CONFIGURACAO.APARELHO.CRIAR",
    );
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelhos-toolbar")).toBeInTheDocument(),
    );

    expect(screen.queryByTestId("aparelhos-link-lote")).toBeNull();
  });
});
