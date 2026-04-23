import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TecnicosPage } from "@/pages/tecnicos/TecnicosPage";

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

vi.mock("@/components/TecnicosMap", () => ({
  default: () => <div data-testid="tecnicos-map-mock" />,
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
      aria-label="uf-atuacao"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">--</option>
      <option value="SP">SP</option>
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
      aria-label="cidade-atuacao"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">--</option>
    </select>
  ),
}));

vi.mock("@/components/InputCPFCNPJ", () => ({
  InputCPFCNPJ: (p: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <input
      aria-label="cpf-cnpj"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputTelefone", () => ({
  InputTelefone: (p: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <input
      aria-label="telefone"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputPreco", () => ({
  InputPreco: (p: {
    value: number;
    onChange: (v: number) => void;
    className?: string;
  }) => (
    <input
      type="number"
      aria-label="input-preco-field"
      value={p.value}
      onChange={(e) => p.onChange(Number(e.target.value))}
    />
  ),
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: ({
    onAddressFound,
  }: {
    value: string;
    onChange: (v: string) => void;
    onAddressFound?: (e: {
      logradouro: string;
      bairro: string;
      localidade: string;
      uf: string;
      complemento: string;
    }) => void;
    className?: string;
  }) => (
    <button
      type="button"
      data-testid="cep-mock-busca"
      onClick={() =>
        onAddressFound?.({
          logradouro: "Rua ViaCEP",
          bairro: "Bairro ViaCEP",
          localidade: "Cidade ViaCEP",
          uf: "MG",
          complemento: "Sala 1",
        })
      }
    >
      Buscar CEP
    </button>
  ),
}));

function makeTecnico(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    nome: "Alpha Técnico",
    cpfCnpj: null,
    telefone: null,
    cidade: "Campinas",
    estado: "SP",
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidadeEndereco: null,
    estadoEndereco: null,
    latitude: null,
    longitude: null,
    geocodingPrecision: null,
    ativo: true,
    precos: {
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 100,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    },
    ...overrides,
  };
}

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <TecnicosPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("TecnicosPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
    hasPermissionMock.mockReset();
    hasPermissionMock.mockImplementation(() => true);
    apiMock.mockResolvedValue([
      makeTecnico({ id: 1, nome: "Alpha Técnico" }),
      makeTecnico({
        id: 2,
        nome: "Beta Inativo",
        ativo: false,
        cidade: "Niterói",
        estado: "RJ",
      }),
    ]);
  });

  it("exibe técnicos após carregar da API", async () => {
    renderPage();
    expect(await screen.findByText("Alpha Técnico")).toBeInTheDocument();
    expect(screen.getByText("Beta Inativo")).toBeInTheDocument();
  });

  it("mostra spinner enquanto a query está pendente", async () => {
    apiMock.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("mostra erro quando a API falha", async () => {
    apiMock.mockRejectedValue(new Error("falha de rede"));
    renderPage();
    expect(
      await screen.findByText(/Erro ao carregar técnicos/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/falha de rede/i)).toBeInTheDocument();
  });

  it("filtra por texto de busca", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alpha Técnico");
    const busca = screen.getByPlaceholderText(/Nome ou CPF/i);
    await user.clear(busca);
    await user.type(busca, "Beta");
    expect(screen.queryByText("Alpha Técnico")).not.toBeInTheDocument();
    expect(screen.getByText("Beta Inativo")).toBeInTheDocument();
  });

  it("filtro status Inativo oculta técnicos ativos", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alpha Técnico");
    const selects = screen.getAllByLabelText("searchable-select");
    const statusSelect = selects[1]!;
    await user.selectOptions(statusSelect, "inativo");
    expect(screen.queryByText("Alpha Técnico")).not.toBeInTheDocument();
    expect(screen.getByText("Beta Inativo")).toBeInTheDocument();
  });

  it("pagina quando há mais de 10 técnicos", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 11 }, (_, i) =>
      makeTecnico({
        id: i + 1,
        nome: `Técnico ${i + 1}`,
        estado: "SP",
        cidade: "X",
      }),
    );
    apiMock.mockResolvedValue(many);
    renderPage();
    await screen.findByText("Técnico 1");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    const pagRow = screen.getByText("1 / 2").parentElement!;
    const pagButtons = within(pagRow).getAllByRole("button");
    await user.click(pagButtons[pagButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });
    expect(screen.getByText("Técnico 11")).toBeInTheDocument();
  });

  it("oculta Novo Técnico sem permissão de criar", async () => {
    hasPermissionMock.mockImplementation(
      (perm: string) => perm !== "AGENDAMENTO.TECNICO.CRIAR",
    );
    renderPage();
    await screen.findByText("Alpha Técnico");
    expect(screen.queryByRole("button", { name: /Novo Técnico/i })).toBeNull();
  });

  it("desabilita toggle de status sem permissão de editar", async () => {
    hasPermissionMock.mockImplementation(
      (perm: string) => perm !== "AGENDAMENTO.TECNICO.EDITAR",
    );
    renderPage();
    await screen.findByText("Alpha Técnico");
    const switches = screen.getAllByRole("switch");
    const rowSwitch = switches[0]!;
    expect(rowSwitch).toBeDisabled();
  });

  it("abre edição com preços em centavos ao clicar Editar Perfil", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValue([
      makeTecnico({
        id: 9,
        nome: "Com Preco",
        precos: {
          instalacaoComBloqueio: "150.50",
          instalacaoSemBloqueio: 0,
          revisao: 0,
          retirada: 0,
          deslocamento: 0,
        },
      }),
    ]);
    renderPage();
    await screen.findByText("Com Preco");
    await user.click(screen.getByText("Com Preco"));
    await user.click(screen.getByRole("button", { name: /Editar Perfil/i }));
    expect(screen.getAllByText(/Editar Técnico/i).length).toBeGreaterThan(0);
    const precos = screen.getAllByLabelText("input-preco-field");
    const comBloqueio = precos[0] as HTMLInputElement;
    expect(comBloqueio.value).toBe("15050");
  });

  it("preenche endereço ao acionar busca CEP mockada no modal", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alpha Técnico");
    await user.click(screen.getByRole("button", { name: /Novo Técnico/i }));
    await user.click(screen.getByTestId("cep-mock-busca"));
    const logradouro = screen.getByPlaceholderText(/Rua, Avenida/i);
    expect(logradouro).toHaveValue("Rua ViaCEP");
    expect(screen.getByPlaceholderText(/Centro/i)).toHaveValue("Bairro ViaCEP");
  });

  it("alterna status com PATCH ao clicar no switch", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alpha Técnico");
    const switches = screen.getAllByRole("switch");
    await user.click(switches[0]!);
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/tecnicos/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ ativo: false }),
        }),
      );
    });
  });

  it("envia POST ao salvar novo técnico", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValueOnce([
      makeTecnico({ id: 1, nome: "Alpha Técnico" }),
      makeTecnico({
        id: 2,
        nome: "Beta Inativo",
        ativo: false,
        cidade: "Niterói",
        estado: "RJ",
      }),
    ]);
    renderPage();
    await screen.findByText("Alpha Técnico");
    await user.click(screen.getByRole("button", { name: /Novo Técnico/i }));
    const nomeInput = screen.getByPlaceholderText(/Ricardo Silva/i);
    await user.type(nomeInput, "Novo E2E");
    await user.click(screen.getByRole("button", { name: /Salvar Técnico/i }));
    await waitFor(() => {
      const postCall = apiMock.mock.calls.find(
        (c) =>
          c[0] === "/tecnicos" &&
          c[1] &&
          (c[1] as { method?: string }).method === "POST",
      );
      expect(postCall).toBeDefined();
    });
    const postCall = apiMock.mock.calls.find(
      (c) =>
        c[0] === "/tecnicos" &&
        c[1] &&
        (c[1] as { method?: string }).method === "POST",
    );
    expect(postCall).toBeDefined();
    const init = postCall![1] as { body: string };
    const body = JSON.parse(init.body) as {
      nome: string;
      precos: { instalacaoComBloqueio: number };
    };
    expect(body.nome).toBe("Novo E2E");
    expect(body.precos.instalacaoComBloqueio).toBe(0);
  });

  it("envia PATCH ao salvar edição com payload alinhado ao buildTecnicoApiBody", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValueOnce([
      makeTecnico({
        id: 42,
        nome: "Edit Me",
        precos: {
          instalacaoComBloqueio: 1,
          instalacaoSemBloqueio: 2,
          revisao: 3,
          retirada: 4,
          deslocamento: 5,
        },
      }),
    ]);
    renderPage();
    await screen.findByText("Edit Me");
    await user.click(screen.getByText("Edit Me"));
    await user.click(screen.getByRole("button", { name: /Editar Perfil/i }));
    const nomeInput = screen.getByPlaceholderText(/Ricardo Silva/i);
    await user.clear(nomeInput);
    await user.type(nomeInput, "Editado API");
    await user.click(screen.getByRole("button", { name: /Salvar Técnico/i }));
    await waitFor(() => {
      const patchCall = apiMock.mock.calls.find(
        (c) =>
          c[0] === "/tecnicos/42" &&
          c[1] &&
          (c[1] as { method?: string }).method === "PATCH",
      );
      expect(patchCall).toBeDefined();
    });
    const patchCall = apiMock.mock.calls.find(
      (c) =>
        c[0] === "/tecnicos/42" &&
        c[1] &&
        (c[1] as { method?: string }).method === "PATCH",
    );
    const body = JSON.parse((patchCall![1] as { body: string }).body) as {
      nome: string;
      precos: Record<string, number>;
    };
    expect(body.nome).toBe("Editado API");
    expect(body.precos.revisao).toBe(3);
    expect(body.precos.instalacaoComBloqueio).toBe(1);
  });
});
