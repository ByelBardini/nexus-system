import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("EquipamentosConfigPage (integração)", () => {
  beforeEach(() => {
    apiMock.mockClear();
    toastError.mockReset();
    toastSuccess.mockReset();
    mockHasPermission.mockImplementation(
      (p) => p === "CONFIGURACAO.APARELHO.EDITAR",
    );
    apiMock.mockImplementation((url: string, init?: { method?: string }) => {
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
        return Promise.resolve([
          {
            id: 100,
            nome: "G",
            operadoraId: 1,
            temPlanos: true,
            ativo: true,
            operadora: { id: 1, nome: "Vivo" },
            planos: [{ id: 1, marcaSimcardId: 100, planoMb: 128, ativo: true }],
          },
        ]);
      }
      if (url.startsWith("/equipamentos/marcas") && init?.method === "POST") {
        return Promise.resolve({});
      }
      return Promise.resolve({});
    });
  });

  it(
    "após carregar, busca restringe marcas; limpar busca mostra de novo 2",
    async () => {
    const user = userEvent.setup();
    render(
      <TestApp>
        <EquipamentosConfigPage />
      </TestApp>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    const search = await screen.findByPlaceholderText(
      "Pesquisar marca ou modelo...",
    );
    await user.clear(search);
    await user.type(search, "M2");
    await waitFor(() => {
      expect(
        screen.getByText("Total: 1 Marcas / 1 Modelos"),
      ).toBeInTheDocument();
    });
    await user.clear(search);
    await waitFor(() => {
      expect(
        screen.getByText("Total: 2 Marcas / 1 Modelos"),
      ).toBeInTheDocument();
    });
    },
    15_000,
  );

  it(
    "abre modal de nova marca, preenche e envia POST",
    async () => {
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
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /nova marca/i })[0],
      ).toBeInTheDocument(),
    );
    await user.click(screen.getAllByRole("button", { name: /nova marca/i })[0]);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Nova Marca" }),
      ).toBeInTheDocument(),
    );
    await user.type(
      screen.getByPlaceholderText("Ex: Teltonika"),
      "NovaZ",
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => {
      const post = apiMock.mock.calls.find(
        (c) =>
          c[0] === "/equipamentos/marcas" &&
          (c[1] as { method?: string })?.method === "POST",
      );
      expect(post).toBeDefined();
    });
    expect(invalidateSpy).toHaveBeenCalled();
    const inv = invalidateSpy.mock.calls.find(
      (args) => (args[0] as { queryKey: unknown })?.queryKey != null,
    )?.[0] as { queryKey: readonly unknown[] };
    expect(inv?.queryKey[0]).toBe(equipamentosQueryKeys.marcas[0]);
    },
    15_000,
  );

  it(
    "edge: salvar nova marca com nome vazio exibe toast de validação (sem POST)",
    async () => {
      const user = userEvent.setup();
      render(
        <TestApp>
          <EquipamentosConfigPage />
        </TestApp>,
      );
      await waitFor(() =>
        expect(
          screen.getAllByRole("button", { name: /nova marca/i })[0],
        ).toBeInTheDocument(),
      );
      await user.click(
        screen.getAllByRole("button", { name: /nova marca/i })[0],
      );
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Nova Marca" }),
        ).toBeInTheDocument(),
      );
      await user.click(screen.getByRole("button", { name: "Salvar" }));
      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("Nome é obrigatório"),
      );
      const post = apiMock.mock.calls.find(
        (c) =>
          c[0] === "/equipamentos/marcas" &&
          (c[1] as { method?: string })?.method === "POST",
      );
      expect(post).toBeUndefined();
    },
    15_000,
  );
});
