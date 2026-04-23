import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EquipamentosConfigPage } from "@/pages/equipamentos/EquipamentosConfigPage";
import { equipamentosQueryKeys } from "@/lib/query-keys/equipamentos";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

const mockHasPermission = vi.hoisted(() => vi.fn());

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) => mockHasPermission(p),
  }),
}));

const toastError = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const marcaRow = (id: number) => ({
  id,
  nome: `M${id}`,
  ativo: true,
  _count: { modelos: id === 1 ? 1 : 0 },
});

function marcasSimcardFixtures() {
  return [
    {
      id: 100,
      nome: "G",
      operadoraId: 1,
      temPlanos: true,
      ativo: true,
      operadora: { id: 1, nome: "Vivo" },
      planos: [{ id: 1, marcaSimcardId: 100, planoMb: 128, ativo: true }],
    },
  ];
}

type ApiInit = { method?: string; body?: string };

/**
 * Comportamento base: GET dos catálogos + respostas vazias para o resto (DELETE, etc.).
 */
function defaultApiHandler() {
  return (url: string, init?: ApiInit) => {
    if (url === "/equipamentos/marcas" && !init) {
      return Promise.resolve([marcaRow(1), marcaRow(2)]);
    }
    if (url === "/equipamentos/modelos" && !init) {
      return Promise.resolve([
        {
          id: 10,
          nome: "FMB",
          ativo: true,
          marca: { id: 1, nome: "M1", ativo: true },
        },
      ]);
    }
    if (url === "/equipamentos/operadoras" && !init) {
      return Promise.resolve([{ id: 1, nome: "Vivo", ativo: true }]);
    }
    if (url === "/equipamentos/marcas-simcard" && !init) {
      return Promise.resolve(marcasSimcardFixtures());
    }
    if (url.startsWith("/equipamentos/marcas") && init?.method === "POST") {
      return Promise.resolve({});
    }
    return Promise.resolve({});
  };
}

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function TestApp({ children }: { children: ReactNode }) {
  const qc = createClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

async function marcasRastreadorPanel() {
  const h = await screen.findByRole("heading", {
    name: "Marcas e Modelos de Rastreador",
  });
  return h.closest("div.col-span-7") as HTMLElement;
}

async function operadorasPanel() {
  const h = await screen.findByRole("heading", { name: "Operadoras" });
  return h.closest("div.col-span-5") as HTMLElement;
}

function expectPostJson(url: string, expected: Record<string, unknown>) {
  const call = apiMock.mock.calls.find(
    (c) =>
      c[0] === url &&
      (c[1] as ApiInit)?.method === "POST" &&
      (c[1] as ApiInit)?.body,
  );
  expect(call).toBeDefined();
  const body = (call![1] as ApiInit).body!;
  expect(JSON.parse(body)).toEqual(expected);
}

describe("EquipamentosConfigPage (integração)", () => {
  beforeEach(() => {
    apiMock.mockClear();
    apiMock.mockImplementation(defaultApiHandler());
    toastError.mockReset();
    toastSuccess.mockReset();
    mockHasPermission.mockImplementation(
      (p) => p === "CONFIGURACAO.APARELHO.EDITAR",
    );
  });

  it("busca restringe marcas; busca inexistente exibe vazio; limpar restaura totais", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const search = await screen.findByPlaceholderText(
      "Pesquisar marca ou modelo...",
    );
    expect(
      await screen.findByText("Total: 2 Marcas / 1 Modelos"),
    ).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "M2");
    await waitFor(() => {
      expect(
        screen.getByText("Total: 1 Marcas / 1 Modelos"),
      ).toBeInTheDocument();
    });
    await user.clear(search);
    await user.type(search, "nada-encaixa-zzz");
    await waitFor(() => {
      expect(screen.getByText("Nenhuma marca encontrada")).toBeInTheDocument();
      expect(
        screen.getByText("Total: 0 Marcas / 1 Modelos"),
      ).toBeInTheDocument();
    });
    await user.clear(search);
    await waitFor(() => {
      expect(
        screen.getByText("Total: 2 Marcas / 1 Modelos"),
      ).toBeInTheDocument();
    });
  }, 15_000);

  it("sem permissão: sem ações de criação, listagem ainda visível", async () => {
    mockHasPermission.mockReturnValue(false);
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    await screen.findByText("Marcas e Modelos de Rastreador");
    expect(
      screen.queryAllByRole("button", { name: /nova marca/i }),
    ).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /nova operadora/i }),
    ).toBeNull();
    const marcasP = await marcasRastreadorPanel();
    expect(
      within(marcasP).getByText("M1", { exact: true }),
    ).toBeInTheDocument();
  });

  it("marca M1 (com modelos) não oferece Excluir; M2 oferece", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const m1 = await screen.findByText("M1", { exact: true });
    const blocoM1 = m1.closest("div.border-b");
    expect(blocoM1).toBeTruthy();
    await user.click(within(blocoM1!).getByRole("button"));
    const menu1 = await screen.findByRole("menu");
    expect(
      within(menu1).queryByRole("menuitem", { name: /excluir/i }),
    ).toBeNull();
    await user.keyboard("{Escape}");
    const m2 = await screen.findByText("M2", { exact: true });
    const blocoM2 = m2.closest("div.border-b");
    await user.click(within(blocoM2!).getByRole("button"));
    const menu2 = await screen.findByRole("menu");
    expect(
      within(menu2).getByRole("menuitem", { name: /excluir/i }),
    ).toBeInTheDocument();
  }, 15_000);

  it("cria marca: POST { nome } correto, invalidação, toast de sucesso", async () => {
    const user = userEvent.setup();
    const qc = createClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EquipamentosConfigPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByPlaceholderText("Pesquisar marca ou modelo...");
    await user.click(
      within(await marcasRastreadorPanel()).getByRole("button", {
        name: /nova marca/i,
      }),
    );
    const nome = await screen.findByPlaceholderText("Ex: Teltonika");
    await user.type(nome, "MarcaN");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => {
      expectPostJson("/equipamentos/marcas", { nome: "MarcaN" });
      expect(invalidateSpy).toHaveBeenCalled();
      const inv = invalidateSpy.mock.calls.find(
        (args) => (args[0] as { queryKey: unknown })?.queryKey != null,
      )?.[0] as { queryKey: readonly unknown[] };
      expect(inv?.queryKey[0]).toBe(equipamentosQueryKeys.marcas[0]);
      expect(toastSuccess).toHaveBeenCalledWith("Marca criada com sucesso");
    });
  }, 15_000);

  it("validação: nome vazio exibe toast e não faz POST", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    await screen.findByPlaceholderText("Pesquisar marca ou modelo...");
    await user.click(
      within(await marcasRastreadorPanel()).getByRole("button", {
        name: /nova marca/i,
      }),
    );
    await screen.findByRole("heading", { name: "Nova Marca" });
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Nome é obrigatório");
    });
    const post = apiMock.mock.calls.find(
      (c) =>
        c[0] === "/equipamentos/marcas" && (c[1] as ApiInit)?.method === "POST",
    );
    expect(post).toBeUndefined();
  }, 15_000);

  it("exclui M2: DELETE, toast, sem toasts indevidos de outros fluxos", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const m2 = await screen.findByText("M2", { exact: true });
    const bloco = m2.closest("div.border-b");
    await user.click(within(bloco!).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /excluir/i }));
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/equipamentos/marcas/2",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toastSuccess).toHaveBeenCalledWith("Marca deletada com sucesso");
    });
  }, 15_000);

  it("exclui modelo FMB: DELETE e toast alinhado ao domínio", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const m1 = await screen.findByText("M1", { exact: true });
    await user.click(m1.closest("div.cursor-pointer")!);
    const fmb = await screen.findByText("FMB");
    const rowModelo = fmb.closest("div.py-3.pl-10");
    await user.click(within(rowModelo!).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /excluir/i }));
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/equipamentos/modelos/10",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toastSuccess).toHaveBeenCalledWith("Modelo deletado com sucesso");
    });
  }, 15_000);

  it("exclui Vivo: escopado ao painel Operadoras (outro 'Vivo' em sim card)", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    await screen.findByText("Total: 1 Operadoras Registradas");
    const panel = await operadorasPanel();
    const vivo = within(panel).getByText("Vivo", { exact: true });
    const tr = vivo.closest("tr");
    expect(tr).toBeTruthy();
    await user.click(within(tr!).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /excluir/i }));
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/equipamentos/operadoras/1",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toastSuccess).toHaveBeenCalledWith(
        "Operadora deletada com sucesso",
      );
    });
  }, 15_000);

  it("exclui plano 128 MB: copy do toast fala em desativado (regra de negócio API)", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const g = await screen.findByText("G", { exact: true });
    await user.click(g.closest("div.cursor-pointer")!);
    const mb = await screen.findByText("128 MB");
    const row = mb.closest("div.py-3.pl-10");
    await user.click(within(row!).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /excluir/i }));
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/equipamentos/planos-simcard/1",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toastSuccess).toHaveBeenCalledWith("Plano desativado com sucesso");
    });
  }, 15_000);

  it("exclui marca de sim G: DELETE e toast de exclusão de sim card", async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const g = await screen.findByText("G", { exact: true });
    const bloco = g.closest("div.border-b");
    await user.click(within(bloco!).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /excluir/i }));
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/equipamentos/marcas-simcard/100",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toastSuccess).toHaveBeenCalledWith(
        "Marca de simcard excluída com sucesso",
      );
    });
  }, 15_000);

  it("DELETE de marca: erro da API vira toast.error com mensagem (sem sucesso)", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((url, init) => {
      if (
        url === "/equipamentos/marcas/2" &&
        (init as ApiInit)?.method === "DELETE"
      ) {
        return Promise.reject(new Error("Servidor indisponível"));
      }
      return defaultApiHandler()(url, init);
    });
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    const m2 = await screen.findByText("M2", { exact: true });
    const bloco = m2.closest("div.border-b");
    await user.click(within(bloco!).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /excluir/i }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Servidor indisponível");
    });
    expect(toastSuccess).not.toHaveBeenCalledWith("Marca deletada com sucesso");
  }, 15_000);

  it("enquanto catálogos pendentes, mostra loader e nenhum painel de dados", () => {
    apiMock.mockImplementation(() => new Promise<never>(() => {}));
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Marcas e Modelos de Rastreador")).toBeNull();
  });
});
