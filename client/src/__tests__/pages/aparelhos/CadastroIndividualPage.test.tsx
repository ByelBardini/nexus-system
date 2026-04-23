import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CadastroIndividualPage } from "@/pages/aparelhos/CadastroIndividualPage";

const apiMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const hasPermissionMock = vi.hoisted(() =>
  vi.fn<(perm: string) => boolean>(() => true),
);

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => navigateMock };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: () => <div data-testid="select-cliente" />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden="true" />
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function defaultApiResponse(url: string, init?: RequestInit): Promise<unknown> {
  if (url === "/aparelhos/individual" && init?.method === "POST")
    return Promise.resolve({});
  if (url === "/clientes") return Promise.resolve([]);
  if (url === "/equipamentos/marcas")
    return Promise.resolve([{ id: 1, nome: "M", ativo: true }]);
  if (url === "/equipamentos/modelos")
    return Promise.resolve([
      {
        id: 1,
        nome: "X",
        ativo: true,
        marca: { id: 1, nome: "M" },
        minCaracteresImei: 15,
      },
    ]);
  if (url === "/equipamentos/operadoras")
    return Promise.resolve([{ id: 1, nome: "O", ativo: true }]);
  if (url === "/equipamentos/marcas-simcard")
    return Promise.resolve([
      {
        id: 1,
        nome: "SC",
        operadoraId: 1,
        temPlanos: false,
        operadora: { id: 1, nome: "O" },
        minCaracteresIccid: 20,
      },
    ]);
  if (url.startsWith("/debitos-rastreadores"))
    return Promise.resolve({ data: [] });
  if (url === "/aparelhos")
    return Promise.resolve([{ identificador: "999", lote: null }]);
  return Promise.resolve(null);
}

function setupApi() {
  apiMock.mockImplementation((url: string, init?: RequestInit) =>
    defaultApiResponse(url, init),
  );
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return render(<CadastroIndividualPage />, { wrapper: W });
}

/** Comboboxes só da seção Identificação (tipo, marca, modelo / SIM) — evita colidir com origem. */
function comboboxesIdentificacaoTecnica() {
  const card = screen
    .getByText(/Identificação Técnica/i)
    .parentElement?.parentElement;
  if (!card) {
    throw new Error("Card Identificação Técnica não encontrado");
  }
  return within(card).getAllByRole("combobox");
}

function findLastPostIndividualBody(): unknown {
  const postCalls = apiMock.mock.calls.filter(
    (c) => c[0] === "/aparelhos/individual" && (c[1] as RequestInit | undefined)?.method === "POST",
  );
  const last = postCalls[postCalls.length - 1];
  if (!last) throw new Error("Nenhum POST /aparelhos/individual");
  return JSON.parse((last[1] as RequestInit).body as string);
}

describe("CadastroIndividualPage (integrado, APIs mockadas)", () => {
  beforeEach(() => {
    setupApi();
    hasPermissionMock.mockImplementation(() => true);
    navigateMock.mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("exibe título e blocos do formulário", async () => {
    renderPage();
    expect(
      await screen.findByText(/Cadastro Manual de Rastreador\/Simcard/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Identificação Técnica/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Origem e Rastreabilidade/i),
    ).toBeInTheDocument();
  });

  it("mostra seção de abater dívida vazia quando não há débitos", async () => {
    renderPage();
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalled();
    });
    expect(
      screen.queryByText(/Abater Dívida/i),
    ).not.toBeInTheDocument();
  });

  it("resumo exibe rótulo de data de entrada (formato pt-BR)", async () => {
    renderPage();
    expect(await screen.findByText(/Data Entrada/i)).toBeInTheDocument();
  });

  it("resumo: IMEI duplicado exibe aviso DUPLICADO", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    const imei = screen.getByPlaceholderText("Digite o identificador único...");
    await user.clear(imei);
    await user.type(imei, "999");
    expect(await screen.findByText("DUPLICADO")).toBeInTheDocument();
    expect(
      await screen.findByText(/já consta no sistema/i),
    ).toBeInTheDocument();
  });

  it("resumo: IMEI curto exibe ID INVÁLIDO com marca e modelo preenchidos", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    const combos = comboboxesIdentificacaoTecnica();
    await user.click(combos[1]!);
    await user.click(await screen.findByRole("option", { name: "M" }));
    await user.click(combos[2]!);
    await user.click(await screen.findByRole("option", { name: "X" }));
    const imei = screen.getByPlaceholderText("Digite o identificador único...");
    await user.type(imei, "123");
    expect(await screen.findByText("ID INVÁLIDO")).toBeInTheDocument();
    expect(
      await screen.findByText(/IMEI deve ter 15 dígitos/i),
    ).toBeInTheDocument();
  });

  it("resumo: formulário incompleto exibe INCOMPLETO", async () => {
    renderPage();
    expect(await screen.findByText("INCOMPLETO")).toBeInTheDocument();
  });

  it("Compra Avulsa restringe opções de status a NOVO_OK", async () => {
    const user = userEvent.setup();
    renderPage();
    const defHeading = await screen.findByText(/Definição de Status/i);
    const statusCard = defHeading.parentElement;
    expect(statusCard).toBeTruthy();
    expect(
      within(statusCard!.parentElement!).getByRole("button", {
        name: /Em Manutenção/i,
      }),
    ).toBeInTheDocument();

    const origemSelect = within(
      screen.getByText(/Origem e Rastreabilidade/i).parentElement
        ?.parentElement!,
    ).getAllByRole("combobox")[0]!;
    await user.click(origemSelect);
    await user.click(
      await screen.findByRole("option", { name: /Compra Avulsa/i }),
    );
    expect(
      within(statusCard!.parentElement!).getByRole("button", {
        name: /Novo.*OK/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(statusCard!.parentElement!).queryByRole("button", {
        name: /Em Manutenção/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("IMEI com máscara: envia só dígitos no JSON do POST", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    const imei = screen.getByPlaceholderText("Digite o identificador único...");
    await user.type(imei, "123-456.789-012-345");
    const combos = comboboxesIdentificacaoTecnica();
    await user.click(combos[1]!);
    await user.click(await screen.findByRole("option", { name: "M" }));
    await user.click(combos[2]!);
    await user.click(await screen.findByRole("option", { name: "X" }));
    const finalizar = await screen.findByRole("button", {
      name: /Finalizar Cadastro/i,
    });
    await waitFor(() => expect(finalizar).not.toBeDisabled());
    await user.click(finalizar);
    await waitFor(() => {
      expect(
        (findLastPostIndividualBody() as { identificador: string })
          .identificador,
      ).toBe("123456789012345");
    });
  }, 15_000);

  it("formulário válido: resumo exibe PRONTO antes de salvar", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    await user.type(
      screen.getByPlaceholderText("Digite o identificador único..."),
      "123456789012345",
    );
    const combos = comboboxesIdentificacaoTecnica();
    await user.click(combos[1]!);
    await user.click(await screen.findByRole("option", { name: "M" }));
    await user.click(combos[2]!);
    await user.click(await screen.findByRole("option", { name: "X" }));
    expect(await screen.findByText("PRONTO")).toBeInTheDocument();
  }, 15_000);

  it("sem CONFIGURACAO.APARELHO.CRIAR: ações de salvar permanecem desabilitadas", async () => {
    hasPermissionMock.mockImplementation(
      (p) => p !== "CONFIGURACAO.APARELHO.CRIAR",
    );
    const user = userEvent.setup({ delay: null });
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    await user.type(
      screen.getByPlaceholderText("Digite o identificador único..."),
      "123456789012345",
    );
    const combos = comboboxesIdentificacaoTecnica();
    await user.click(combos[1]!);
    await user.click(await screen.findByRole("option", { name: "M" }));
    await user.click(combos[2]!);
    await user.click(await screen.findByRole("option", { name: "X" }));
    const finalizar = await screen.findByRole("button", {
      name: /Finalizar Cadastro/i,
    });
    const outro = screen.getByRole("button", {
      name: /Cadastrar Outro Equipamento/i,
    });
    expect(finalizar).toBeDisabled();
    expect(outro).toBeDisabled();
  }, 15_000);

  it("POST falha: exibe toast de erro e não navega", async () => {
    apiMock.mockImplementation((url, init) => {
      if (url === "/aparelhos/individual" && init?.method === "POST")
        return Promise.reject(new Error("Erro 502 no gateway"));
      return defaultApiResponse(url, init);
    });
    const user = userEvent.setup({ delay: null });
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    await user.type(
      screen.getByPlaceholderText("Digite o identificador único..."),
      "123456789012345",
    );
    const combos = comboboxesIdentificacaoTecnica();
    await user.click(combos[1]!);
    await user.click(await screen.findByRole("option", { name: "M" }));
    await user.click(combos[2]!);
    await user.click(await screen.findByRole("option", { name: "X" }));
    const finalizar = await screen.findByRole("button", {
      name: /Finalizar Cadastro/i,
    });
    await waitFor(() => expect(finalizar).not.toBeDisabled());
    await user.click(finalizar);
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Erro 502 no gateway",
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  }, 15_000);

  it(
    "Finalizar com dados válidos: payload, toast de sucesso e navegação",
    async () => {
      const user = userEvent.setup({ delay: null });
      renderPage();
      await screen.findByText(/Identificação Técnica/i);
      const imei = screen.getByPlaceholderText("Digite o identificador único...");
      await user.type(imei, "123456789012345");
      const combos = comboboxesIdentificacaoTecnica();
      await user.click(combos[1]!);
      await user.click(await screen.findByRole("option", { name: "M" }));
      await user.click(combos[2]!);
      await user.click(await screen.findByRole("option", { name: "X" }));

      const finalizar = await screen.findByRole("button", {
        name: /Finalizar Cadastro/i,
      });
      await waitFor(() => expect(finalizar).not.toBeDisabled());
      await user.click(finalizar);

      await waitFor(() => {
        expect(apiMock).toHaveBeenCalledWith(
          "/aparelhos/individual",
          expect.objectContaining({ method: "POST" }),
        );
      });
      const body = findLastPostIndividualBody() as {
        identificador: string;
        tipo: string;
        marca: string;
        modelo: string;
        origem: string;
        proprietario: string;
        statusEntrada: string;
      };
      expect(body.identificador).toBe("123456789012345");
      expect(body.tipo).toBe("RASTREADOR");
      expect(body.marca).toBe("M");
      expect(body.modelo).toBe("X");
      expect(body.origem).toBe("DEVOLUCAO_TECNICO");
      expect(body.proprietario).toBe("INFINITY");
      expect(body.statusEntrada).toBe("EM_MANUTENCAO");
      expect(vi.mocked(toast.success)).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/aparelhos");
    },
    15_000,
  );

  it(
    "Cadastrar outro: sucesso chama API e limpa o identificador",
    async () => {
      const user = userEvent.setup({ delay: null });
      renderPage();
      await screen.findByText(/Identificação Técnica/i);
      const imei = screen.getByPlaceholderText("Digite o identificador único...");
      await user.type(imei, "123456789012345");
      const combos = comboboxesIdentificacaoTecnica();
      await user.click(combos[1]!);
      await user.click(await screen.findByRole("option", { name: "M" }));
      await user.click(combos[2]!);
      await user.click(await screen.findByRole("option", { name: "X" }));

      const outro = await screen.findByRole("button", {
        name: /Cadastrar Outro Equipamento/i,
      });
      await waitFor(() => expect(outro).not.toBeDisabled());
      await user.click(outro);

      await waitFor(() => {
        expect(apiMock).toHaveBeenCalledWith(
          "/aparelhos/individual",
          expect.objectContaining({ method: "POST" }),
        );
      });
      const identInput = screen.getByPlaceholderText(
        "Digite o identificador único...",
      );
      expect(identInput).toHaveValue("");
      expect(
        await screen.findByText(
          /1 equipamento cadastrado nesta sessão/i,
        ),
      ).toBeInTheDocument();
      expect(vi.mocked(toast.success)).toHaveBeenCalled();
    },
    15_000,
  );

  it("Limpar campos: zera identificador e remove marca selecionada (volta ao padrão)", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await screen.findByText(/Identificação Técnica/i);
    const imei = screen.getByPlaceholderText("Digite o identificador único...");
    await user.type(imei, "123");
    const combos = comboboxesIdentificacaoTecnica();
    await user.click(combos[1]!);
    await user.click(await screen.findByRole("option", { name: "M" }));
    await user.click(
      await screen.findByRole("button", { name: /Limpar Campos/i }),
    );
    expect(imei).toHaveValue("");
    const combosApos = comboboxesIdentificacaoTecnica();
    expect(combosApos[1]!).toHaveTextContent("Marca");
  });
});
