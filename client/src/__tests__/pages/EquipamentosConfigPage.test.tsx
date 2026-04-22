import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EquipamentosConfigPage } from "@/pages/equipamentos/EquipamentosConfigPage";

const mockHasPermission = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) => mockHasPermission(p),
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQuery: vi.fn((opts: { queryKey: unknown[] }) => {
      const k = opts.queryKey[0];
      if (k === "marcas")
        return {
          data: [
            {
              id: 1,
              nome: "MarcaA",
              ativo: true,
              _count: { modelos: 0 },
            },
          ],
          isLoading: false,
        };
      if (k === "modelos") return { data: [], isLoading: false };
      if (k === "operadoras")
        return {
          data: [{ id: 1, nome: "Op1", ativo: true }],
          isLoading: false,
        };
      if (k === "marcas-simcard")
        return {
          data: [
            {
              id: 10,
              nome: "SimMarca",
              operadoraId: 1,
              temPlanos: false,
              ativo: true,
              operadora: { id: 1, nome: "Op1" },
              planos: [],
            },
          ],
          isLoading: false,
        };
      return { data: [], isLoading: false };
    }),
  };
});

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("EquipamentosConfigPage — permissões canEdit", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation((p: string) => {
      if (p === "CONFIGURACAO.APARELHO.EDITAR") return true;
      return false;
    });
  });

  it("com EDITAR: exibe Nova Operadora e Nova Marca (simcard)", () => {
    render(<EquipamentosConfigPage />, { wrapper });

    expect(
      screen.getByRole("button", { name: /nova operadora/i }),
    ).toBeInTheDocument();
    const marcaSimBtns = screen.getAllByRole("button", { name: /nova marca/i });
    expect(marcaSimBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("sem EDITAR: oculta Nova Operadora e ações de marca simcard (nova marca / engrenagem)", () => {
    mockHasPermission.mockImplementation(() => false);

    render(<EquipamentosConfigPage />, { wrapper });

    expect(
      screen.queryByRole("button", { name: /nova operadora/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nova marca/i }),
    ).not.toBeInTheDocument();
    const settingsIcons = document.querySelectorAll('[data-icon="settings"]');
    expect(settingsIcons.length).toBe(0);
  });
});
