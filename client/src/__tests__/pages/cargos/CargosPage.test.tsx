import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CargosPage } from "@/pages/cargos/CargosPage";
import { CATEGORIA_CONFIG } from "@/types/cargo";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) =>
      p === "ADMINISTRATIVO.CARGO.CRIAR" || p === "ADMINISTRATIVO.CARGO.EDITAR",
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: (opts: { queryKey: unknown[] }) => mockUseQuery(opts),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CargosPage — tipos e CATEGORIA_CONFIG compartilhados", () => {
  beforeEach(() => {
    mockUseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
      const k = opts.queryKey[0];
      if (k === "roles-paginated") {
        return {
          data: {
            data: [
              {
                id: 1,
                code: "OP",
                nome: "Operador",
                descricao: null,
                categoria: "OPERACIONAL",
                ativo: true,
                setor: { id: 1, code: "A", nome: "A" },
                usuariosVinculados: 2,
                cargoPermissoes: [],
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
          isLoading: false,
        };
      }
      if (k === "setores") return { data: [], isLoading: false };
      if (k === "permissions") return { data: [], isLoading: false };
      return { data: undefined, isLoading: false };
    });
  });

  it("renderiza badge de categoria com label do CATEGORIA_CONFIG compartilhado", () => {
    render(<CargosPage />, { wrapper });

    expect(screen.getByText("Operador")).toBeInTheDocument();
    expect(screen.getByText(CATEGORIA_CONFIG.OPERACIONAL.label)).toBeInTheDocument();
  });
});
