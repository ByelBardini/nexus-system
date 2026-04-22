import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientesPage } from "@/pages/clientes/ClientesPage";
import type { Cliente } from "@/pages/clientes/shared/clientes-page.shared";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: apiMock,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) =>
      p === "AGENDAMENTO.CLIENTE.CRIAR" ||
      p === "AGENDAMENTO.CLIENTE.EDITAR",
  }),
}));

vi.mock("@/hooks/useBrasilAPI", () => ({
  useUFs: () => ({ data: [] }),
  useMunicipios: () => ({ data: [] }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function clienteLista(): Cliente[] {
  return [
    {
      id: 1,
      nome: "Alfa Indústria",
      nomeFantasia: "Alfa",
      cnpj: "11222333000181",
      tipoContrato: "COMODATO",
      estoqueProprio: true,
      status: "ATIVO",
      contatos: [
        { id: 1, nome: "Zé", celular: "11999998888", email: null },
      ],
    },
  ];
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ClientesPage — fluxo integrado", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("carrega lista e expande linha mostrando contatos", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValue(clienteLista());

    render(<ClientesPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByText("Alfa Indústria")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("Alfa Indústria"));
    expect(await screen.findByText(/meios de contato/i)).toBeInTheDocument();
    expect(screen.getByText("Zé")).toBeInTheDocument();
  });

  it("abre modal novo cliente e submete criação", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/clientes" && !init) return Promise.resolve(clienteLista());
      if (url === "/clientes" && init?.method === "POST")
        return Promise.resolve({});
      return Promise.resolve([]);
    });

    render(<ClientesPage />, { wrapper });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /novo cliente/i })).toBeEnabled(),
    );

    await user.click(screen.getByRole("button", { name: /novo cliente/i }));
    expect(
      await screen.findByRole("heading", { name: /novo cliente/i }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/empresa abc ltda/i),
      "Novo Cliente SA",
    );
    await user.click(screen.getByRole("button", { name: /salvar cliente/i }));

    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        "/clientes",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("erro na API de listagem: exibe mensagem", async () => {
    apiMock.mockRejectedValue(new Error("falha rede"));

    render(<ClientesPage />, { wrapper });

    expect(
      await screen.findByText(/erro ao carregar clientes/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/falha rede/i)).toBeInTheDocument();
  });

  it("filtro por busca restringe linhas visíveis", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValue([
      ...clienteLista(),
      {
        id: 2,
        nome: "Beta Outro",
        nomeFantasia: null,
        cnpj: null,
        tipoContrato: "AQUISICAO",
        estoqueProprio: false,
        status: "INATIVO",
        contatos: [],
      },
    ]);

    render(<ClientesPage />, { wrapper });

    await waitFor(() => expect(screen.getByText("Beta Outro")).toBeInTheDocument());

    await user.type(
      screen.getByPlaceholderText(/razão social ou cnpj/i),
      "Alfa",
    );

    expect(screen.getByText("Alfa Indústria")).toBeInTheDocument();
    expect(screen.queryByText("Beta Outro")).not.toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(2);
  });
});
