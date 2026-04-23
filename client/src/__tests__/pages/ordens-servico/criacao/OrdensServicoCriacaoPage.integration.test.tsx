import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import type { EnderecoCEP } from "@/hooks/useBrasilAPI";
import { OrdensServicoCriacaoPage } from "@/pages/ordens-servico/OrdensServicoCriacaoPage";

const api = vi.hoisted(() => vi.fn());

const auth = vi.hoisted(() => ({
  user: { nome: "U" },
  hasPermission: vi.fn(() => true),
}));

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: auth.user,
    hasPermission: (p: string) => auth.hasPermission(p),
  }),
}));

vi.mock("@/components/SelectTecnicoSearch", () => ({
  SelectTecnicoSearch: () => <div data-testid="stec" />,
}));

vi.mock("@/components/SubclienteNomeAutocomplete", () => ({
  SubclienteNomeAutocomplete: (p: {
    value: string;
    onChange: (n: string) => void;
  }) => (
    <input
      data-testid="subnome"
      aria-label="Nome do subcliente"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
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
  InputCEP: (p: {
    value: string;
    onChange: (v: string) => void;
    onAddressFound?: (e: EnderecoCEP) => void;
  }) => (
    <div>
      <input
        data-testid="cep"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
      <button
        type="button"
        data-testid="cep-simular-endereco"
        onClick={() =>
          p.onAddressFound?.({
            logradouro: "Rua do CEP",
            bairro: "Centro",
            complemento: "Cj 1",
            localidade: "Campinas",
            uf: "SP",
          })
        }
      >
        simular CEP
      </button>
    </div>
  ),
}));

vi.mock("@/components/InputTelefone", () => ({
  InputTelefone: (p: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="tel"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputCPFCNPJ", () => ({
  InputCPFCNPJ: () => <input />,
}));

vi.mock("@/components/SelectUF", () => ({
  SelectUF: (p: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="uf"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/SelectCidade", () => ({
  SelectCidade: (p: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="cidade"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/IdAparelhoSearch", () => ({
  IdAparelhoSearch: () => <div data-testid="idap" />,
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const a =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...a,
    useNavigate: () => navigate,
  };
});

function createDefaultApiImplementation() {
  return (path: string, init?: RequestInit) => {
    if (path === "/clientes?subclientes=1") return Promise.resolve([]);
    if (path === "/ordens-servico/cliente-infinity")
      return Promise.resolve({ clienteId: 1 });
    if (path === "/clientes/1") return Promise.resolve({ subclientes: [] });
    if (path === "/tecnicos")
      return Promise.resolve([
        { id: 2, nome: "Tec", precos: { revisao: 1, deslocamento: 0 } },
      ]);
    if (path === "/aparelhos") return Promise.resolve([]);
    if (String(path).startsWith("/veiculos/criar-ou-buscar")) {
      return Promise.resolve({ id: 9 });
    }
    if (path === "/ordens-servico" && init?.method === "POST") {
      return Promise.resolve({ id: 1, numero: 99 });
    }
    return Promise.resolve(null);
  };
}

beforeEach(() => {
  api.mockReset();
  navigate.mockReset();
  auth.hasPermission.mockReset();
  auth.hasPermission.mockImplementation(() => true);
  vi.mocked(toast.error).mockClear();
  api.mockImplementation(createDefaultApiImplementation());
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

function getLastPostOrdensServicoBody(): Record<string, unknown> {
  const posts = api.mock.calls.filter(
    ([url, init]) =>
      url === "/ordens-servico" &&
      (init as RequestInit | undefined)?.method === "POST",
  );
  expect(posts.length).toBeGreaterThan(0);
  const init = posts[posts.length - 1][1] as RequestInit;
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

function countPostOrdensServicoCalls() {
  return api.mock.calls.filter(
    ([url, init]) =>
      url === "/ordens-servico" &&
      (init as RequestInit | undefined)?.method === "POST",
  ).length;
}

function getVeiculoCriarOuBuscarPostBodies() {
  return api.mock.calls
    .filter(
      ([url, init]) =>
        String(url).startsWith("/veiculos/criar-ou-buscar") &&
        (init as RequestInit | undefined)?.method === "POST",
    )
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

async function preencherSubclienteMinimoValido(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.type(screen.getByTestId("subnome"), "Cliente OS");
  await user.type(screen.getByTestId("cep"), "13000000");
  await user.click(screen.getByTestId("cep-simular-endereco"));
  await user.type(screen.getByPlaceholderText("Nº"), "100");
  await user.type(screen.getByTestId("tel"), "11999999999");
}

describe("OrdensServicoCriacaoPage (integração)", () => {
  it("render: título, emissor no header, requisições de catálogo e seção de técnico", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/nova ordem de serviço/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/criado por:\s*u/i)).toBeInTheDocument();
    const emitirBtns = screen.getAllByRole("button", { name: /emitir ordem/i });
    expect(emitirBtns).toHaveLength(2);
    emitirBtns.forEach((b) => expect(b).toBeDisabled());

    await waitFor(() => expect(api).toHaveBeenCalledWith("/tecnicos"));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/ordens-servico/cliente-infinity"),
    );
    expect(screen.getByTestId("stec")).toBeInTheDocument();
  });

  it("onAddressFound do CEP preenche logradouro, cidade, UF e permanece com CEP digitado", async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("cep")).toBeInTheDocument());

    await user.type(screen.getByTestId("cep"), "13000000");
    await user.click(screen.getByTestId("cep-simular-endereco"));

    expect(screen.getByTestId("cep")).toHaveValue("13000000");
    expect(screen.getByTestId("cidade")).toHaveValue("Campinas");
    expect(screen.getByTestId("uf")).toHaveValue("SP");
    expect(screen.getByPlaceholderText(/rua, av/i)).toHaveValue("Rua do CEP");
  });

  it("Revisão e Retirada exibem o bloco de aparelho/local (não exige Instalação)", async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /revisão/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /revisão/i }));
    expect(screen.getByText("ID Instalado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retirada/i }));
    expect(screen.getByText("Local de Instalação")).toBeInTheDocument();
  });

  it("sem AGENDAMENTO.OS.CRIAR: emitir fica desabilitado e o POST nunca ocorre", async () => {
    auth.hasPermission.mockImplementation((p) => p !== "AGENDAMENTO.OS.CRIAR");
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("subnome")).toBeInTheDocument(),
    );

    await preencherSubclienteMinimoValido(user);
    await user.click(screen.getByRole("button", { name: /^instalação$/i }));
    const emitir = screen.getAllByRole("button", { name: /emitir ordem/i })[0];
    await waitFor(() => expect(emitir).toBeDisabled());
    for (const btn of screen.getAllByRole("button", {
      name: /emitir ordem/i,
    })) {
      expect(btn).toBeDisabled();
    }
    expect(countPostOrdensServicoCalls()).toBe(0);
  });

  it("submissão: POST com clienteId, tipo, subclienteCreate e sem observacoes vazias só com espaço", async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("subnome")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/ordens-servico/cliente-infinity"),
    );

    await preencherSubclienteMinimoValido(user);
    await user.type(
      screen.getByPlaceholderText(/detalhes técnicos/i),
      "   \n  ",
    );
    await user.click(screen.getByRole("button", { name: /^instalação$/i }));

    const emitir = screen.getAllByRole("button", { name: /emitir ordem/i })[0];
    await waitFor(() => expect(emitir).not.toBeDisabled(), { timeout: 10_000 });
    const postsAntes = countPostOrdensServicoCalls();
    await user.click(emitir);

    await waitFor(() =>
      expect(countPostOrdensServicoCalls()).toBe(postsAntes + 1),
    );
    const body = getLastPostOrdensServicoBody();
    expect(body).toMatchObject({
      tipo: "INSTALACAO_COM_BLOQUEIO",
      clienteId: 1,
    });
    expect(body).toHaveProperty("subclienteCreate");
    expect((body.subclienteCreate as { nome: string }).nome).toBe("Cliente OS");
    expect(body.observacoes).toBeUndefined();
  }, 20_000);

  it("placa preenchida sem marca/modelo/ano/cor: Zod bloqueia o submit (nenhum POST /ordens-servico)", async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("placa")).toBeInTheDocument(),
    );

    await preencherSubclienteMinimoValido(user);
    await user.click(screen.getByRole("button", { name: /^instalação$/i }));
    await user.type(screen.getByTestId("placa"), "ABC1D23");

    const emitir = screen.getAllByRole("button", { name: /emitir ordem/i })[0];
    await waitFor(() => expect(emitir).not.toBeDisabled(), { timeout: 10_000 });
    const antes = countPostOrdensServicoCalls();
    await user.click(emitir);

    expect(countPostOrdensServicoCalls()).toBe(antes);
  }, 20_000);

  it("dados de veículo completos: chama /veiculos/criar-ou-buscar e veiculoId no payload da OS", async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("placa")).toBeInTheDocument(),
    );

    await preencherSubclienteMinimoValido(user);
    await user.click(screen.getByRole("button", { name: /^instalação$/i }));
    await user.type(screen.getByTestId("placa"), "ABC1D23");
    await user.type(screen.getByPlaceholderText("Marca"), "Ford");
    await user.type(screen.getByPlaceholderText("Modelo"), "Ka");
    await user.type(screen.getByPlaceholderText("Ano"), "2020");
    await user.type(screen.getByPlaceholderText("Cor"), "Prata");

    const emitir = screen.getAllByRole("button", { name: /emitir ordem/i })[0];
    await waitFor(() => expect(emitir).not.toBeDisabled(), { timeout: 10_000 });
    await user.click(emitir);

    await waitFor(() => {
      const veiculos = getVeiculoCriarOuBuscarPostBodies();
      expect(veiculos.length).toBeGreaterThan(0);
      expect(veiculos[0]).toMatchObject({
        placa: "ABC1D23",
        marca: "Ford",
        modelo: "Ka",
        ano: "2020",
        cor: "Prata",
      });
    });
    expect(getLastPostOrdensServicoBody().veiculoId).toBe(9);
  }, 20_000);

  it("falha no POST de criação: exibe toast de erro da API", async () => {
    api.mockImplementation((path, init) => {
      if (path === "/ordens-servico" && init?.method === "POST") {
        return Promise.reject(new Error("Erro 503 no gateway"));
      }
      return createDefaultApiImplementation()(path, init);
    });
    const user = userEvent.setup({ delay: null });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("subnome")).toBeInTheDocument(),
    );

    await preencherSubclienteMinimoValido(user);
    await user.click(screen.getByRole("button", { name: /^instalação$/i }));
    const emitir = screen.getAllByRole("button", { name: /emitir ordem/i })[0];
    await waitFor(() => expect(emitir).not.toBeDisabled(), { timeout: 10_000 });
    await user.click(emitir);

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Erro 503 no gateway",
      ),
    );
  }, 20_000);

  it("Cancelar aciona navigate('/')", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /cancelar/i }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(navigate).toHaveBeenCalledWith("/");
  });
});
