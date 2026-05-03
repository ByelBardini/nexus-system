import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientesPage } from "@/pages/clientes/ClientesPage";
import type { Cliente } from "@/pages/clientes/shared/clientes-page.shared";

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

vi.mock("@/hooks/useBrasilAPI", () => ({
  useUFs: () => ({ data: [{ sigla: "SP", nome: "São Paulo" }] }),
  useMunicipios: () => ({ data: [] }),
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

vi.mock("@/components/SelectUF", () => ({
  SelectUF: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      aria-label="uf-endereco"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">--</option>
    </select>
  ),
}));

vi.mock("@/components/SelectCidade", () => ({
  SelectCidade: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      aria-label="cidade-endereco"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">--</option>
    </select>
  ),
}));

vi.mock("@/components/InputTelefone", () => ({
  InputTelefone: (p: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <input
      aria-label="telefone-contato"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputCNPJ", () => ({
  InputCNPJ: (p: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <input
      aria-label="cnpj"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: (p: {
    value: string;
    onChange: (v: string) => void;
    onAddressFound?: (e: unknown) => void;
    placeholder?: string;
    className?: string;
  }) => (
    <input
      aria-label="cep"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputCor", () => ({
  InputCor: (p: {
    value: string | undefined;
    onChange: (v: string | undefined) => void;
  }) => (
    <input
      aria-label="cor"
      value={p.value ?? ""}
      onChange={(e) => p.onChange(e.target.value || undefined)}
    />
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: ReactNode;
    open: boolean;
    onOpenChange?: (o: boolean) => void;
  }) => (open ? <div data-testid="dialog-open">{children}</div> : null),
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

function clienteFixture(
  overrides: Partial<Cliente> & Pick<Cliente, "id" | "nome" | "status">,
): Cliente {
  return {
    nomeFantasia: null,
    cnpj: null,
    tipoContrato: "COMODATO",
    contatos: [],
    ...overrides,
  };
}

describe("ClientesPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    apiMock.mockReset();
    hasPermissionMock.mockImplementation(() => true);
  });

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ClientesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("rodapé mostra totais da lista filtrada e ativos na seleção (não só ativos globais)", async () => {
    const mockClientes: Cliente[] = [
      clienteFixture({ id: 2, nome: "Alfa", status: "ATIVO" }),
      clienteFixture({ id: 3, nome: "Beta", status: "ATIVO" }),
      clienteFixture({ id: 4, nome: "Gama", status: "PENDENTE" }),
    ];
    apiMock.mockResolvedValue(mockClientes);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Exibindo 3 de 3 cliente\(s\)/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/2 ativo\(s\) na seleção/i)).toBeInTheDocument();
  });

  it("após filtrar por status na busca, rodapé reflete apenas linhas exibidas", async () => {
    const mockClientes: Cliente[] = [
      clienteFixture({ id: 2, nome: "Só Ativo", status: "ATIVO" }),
      clienteFixture({ id: 3, nome: "Pendente Um", status: "PENDENTE" }),
    ];
    apiMock.mockResolvedValue(mockClientes);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Razão Social ou CNPJ/i),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const busca = screen.getByPlaceholderText(/Razão Social ou CNPJ/i);
    await user.type(busca, "Pendente");

    await waitFor(() => {
      expect(
        screen.getByText(/Exibindo 1 de 2 cliente\(s\)/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/0 ativo\(s\) na seleção/i)).toBeInTheDocument();
  });
});
