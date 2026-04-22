import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { OrdensServicoCriacaoPage } from "@/pages/ordens-servico/OrdensServicoCriacaoPage";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { nome: "U" },
    hasPermission: () => true,
  }),
}));

vi.mock("@/components/SelectTecnicoSearch", () => ({
  SelectTecnicoSearch: () => <div data-testid="stec" />,
}));

vi.mock("@/components/SubclienteNomeAutocomplete", () => ({
  SubclienteNomeAutocomplete: () => <div data-testid="subauto" />,
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: () => <div data-testid="clisel" />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span />,
}));

vi.mock("@/components/InputPlaca", () => ({
  InputPlaca: (p: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="placa"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: () => <input data-testid="cep" />,
}));

vi.mock("@/components/InputTelefone", () => ({
  InputTelefone: () => <input data-testid="tel" />,
}));

vi.mock("@/components/InputCPFCNPJ", () => ({
  InputCPFCNPJ: () => <input />,
}));

vi.mock("@/components/SelectUF", () => ({
  SelectUF: () => <select data-testid="uf" />,
}));

vi.mock("@/components/SelectCidade", () => ({
  SelectCidade: () => <select data-testid="cidade" />,
}));

vi.mock("@/components/IdAparelhoSearch", () => ({
  IdAparelhoSearch: () => <div data-testid="idap" />,
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const a =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...a,
    useNavigate: () => navigate,
  };
});

beforeEach(() => {
  api.mockReset();
  navigate.mockReset();
  api.mockImplementation((path: string) => {
    if (path === "/clientes?subclientes=1") return Promise.resolve([]);
    if (path === "/ordens-servico/cliente-infinity")
      return Promise.resolve({ clienteId: 1 });
    if (path === "/clientes/1")
      return Promise.resolve({ subclientes: [] });
    if (path === "/tecnicos")
      return Promise.resolve([
        { id: 2, nome: "Tec", precos: { revisao: 1, deslocamento: 0 } },
      ]);
    if (path === "/aparelhos") return Promise.resolve([]);
    if (path === "/veiculos/criar-ou-buscar" && String(path).includes("veiculos"))
      return Promise.resolve({ id: 9 });
    if (String(path).startsWith("/veiculos/criar-ou-buscar")) {
      return Promise.resolve({ id: 9 });
    }
    if (String(path) === "/ordens-servico" || path.startsWith("/ordens-servico"))
      return Promise.resolve({ id: 1, numero: 99 });
    return Promise.resolve(null);
  });
});

function App() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OrdensServicoCriacaoPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("OrdensServicoCriacaoPage (integração leve)", () => {
  it("carrega título e botões principais", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/nova ordem de serviço/i)).toBeInTheDocument();
    });
    expect(screen.getAllByRole("button", { name: /emitir ordem/i }).length).toBeGreaterThan(0);
  });

  it("exibe seção de técnico após carregar", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("stec")).toBeInTheDocument();
    });
  });
});
