import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CargosPage } from "@/pages/cargos/CargosPage";
import { CATEGORIA_CONFIG } from "@/types/cargo";

const apiMock = vi.hoisted(() => vi.fn());

/** Permissões por teste: padrão criar + editar. */
const hasPermissionMock = vi.hoisted(() =>
  vi.fn(
    (p: string) =>
      p === "ADMINISTRATIVO.CARGO.CRIAR" || p === "ADMINISTRATIVO.CARGO.EDITAR",
  ),
);

const cargoModalSpy = vi.hoisted(() =>
  vi.fn(
    (props: {
      open: boolean;
      onClose: () => void;
      cargo: { id: number } | null;
      isNew: boolean;
    }) =>
      props.open ? (
        <div data-testid="cargo-modal-mock">
          <button type="button" onClick={props.onClose}>
            fechar-modal
          </button>
          <span data-testid="modal-editing-id">{props.cargo?.id ?? "new"}</span>
          <span data-testid="modal-is-new">{String(props.isNew)}</span>
        </div>
      ) : null,
  ),
);

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

vi.mock("@/components/SearchableSelect", () => ({
  SearchableSelect: ({
    value,
    onChange,
    options,
    className,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    className?: string;
  }) => (
    <select
      aria-label="categoria-filter"
      className={className}
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

vi.mock("../../../pages/cargos/cargo-modal", () => ({
  CargoModal: (props: Parameters<typeof cargoModalSpy>[0]) =>
    cargoModalSpy(props),
}));

function makeCargo(
  overrides: Partial<{
    id: number;
    nome: string;
    categoria: "OPERACIONAL" | "ADMINISTRATIVO" | "GESTAO";
    ativo: boolean;
    descricao: string | null;
    usuariosVinculados: number;
  }> = {},
) {
  return {
    id: 1,
    code: "OP",
    nome: "Operador",
    descricao: null,
    categoria: "OPERACIONAL" as const,
    ativo: true,
    setor: { id: 1, code: "A", nome: "A" },
    usuariosVinculados: 2,
    cargoPermissoes: [],
    ...overrides,
  };
}

function paginatedCalls() {
  return apiMock.mock.calls
    .map((c) => c[0])
    .filter(
      (u): u is string =>
        typeof u === "string" && u.includes("/roles/paginated"),
    );
}

function lastPaginatedUrl() {
  const urls = paginatedCalls();
  expect(urls.length).toBeGreaterThan(0);
  return urls[urls.length - 1]!;
}

/** Botões anterior/próximo no rodapé (ordem no DOM: esquerda, direita). */
function getPaginationButtons() {
  const pageLabel = screen.getByText(/página \d+ de \d+/i);
  const cluster = pageLabel.parentElement;
  expect(cluster).toBeTruthy();
  const buttons = within(cluster as HTMLElement).getAllByRole("button");
  expect(buttons).toHaveLength(2);
  return { prev: buttons[0]!, next: buttons[1]! };
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CargosPage", () => {
  beforeEach(() => {
    apiMock.mockClear();
    hasPermissionMock.mockImplementation(
      (p: string) =>
        p === "ADMINISTRATIVO.CARGO.CRIAR" ||
        p === "ADMINISTRATIVO.CARGO.EDITAR",
    );
    cargoModalSpy.mockClear();
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/roles/paginated")) {
        return {
          data: [makeCargo()],
          total: 1,
          page: 1,
          totalPages: 2,
        };
      }
      if (url.includes("/roles/setores")) return [];
      if (url.includes("/roles/permissions")) return [];
      throw new Error(`Unhandled api in test: ${url}`);
    });
  });

  it("lista cargo com badge da categoria (dentro da tabela, não no filtro)", async () => {
    render(<CargosPage />, { wrapper });

    const table = await screen.findByRole("table");
    expect(within(table).getByText("Operador")).toBeInTheDocument();
    expect(
      within(table).getByText(CATEGORIA_CONFIG.OPERACIONAL.label),
    ).toBeInTheDocument();
  });

  it("exibe apenas o spinner global enquanto a listagem não retorna (sem shell da página)", async () => {
    apiMock.mockImplementation(
      () =>
        new Promise(() => {
          /* nunca resolve */
        }),
    );

    render(<CargosPage />, { wrapper });

    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Filtrar cargo..."),
    ).not.toBeInTheDocument();
  });

  it("monta URL sem search nem categoria quando filtros estão vazios / TODAS", async () => {
    render(<CargosPage />, { wrapper });

    await screen.findByRole("table");

    const url = lastPaginatedUrl();
    const qs = new URLSearchParams(url.split("?")[1] ?? "");
    expect(qs.get("page")).toBe("1");
    expect(qs.get("limit")).toBe("15");
    expect(qs.has("search")).toBe(false);
    expect(qs.has("categoria")).toBe(false);
  });

  it("inclui search e categoria na URL quando o usuário filtra", async () => {
    const user = userEvent.setup();
    render(<CargosPage />, { wrapper });

    const searchInput = await screen.findByPlaceholderText("Filtrar cargo...");
    fireEvent.change(searchInput, { target: { value: "gerente" } });

    await waitFor(() => {
      const u = lastPaginatedUrl();
      expect(u).toContain("search=gerente");
    });

    const cat = await screen.findByLabelText("categoria-filter");
    await user.selectOptions(cat, "ADMINISTRATIVO");

    await waitFor(() => {
      const u = lastPaginatedUrl();
      const qs = new URLSearchParams(u.split("?")[1] ?? "");
      expect(qs.get("search")).toBe("gerente");
      expect(qs.get("categoria")).toBe("ADMINISTRATIVO");
      expect(qs.get("page")).toBe("1");
    });
  });

  it("codifica caracteres especiais do search na query string", async () => {
    render(<CargosPage />, { wrapper });

    const searchInput = await screen.findByPlaceholderText("Filtrar cargo...");
    fireEvent.change(searchInput, { target: { value: "a&b=c" } });

    await waitFor(() => {
      const u = lastPaginatedUrl();
      expect(u).toContain("search=");
      expect(
        decodeURIComponent(
          new URL(u, "http://x.test").searchParams.get("search") ?? "",
        ),
      ).toBe("a&b=c");
    });
  });

  it("ao mudar filtro após ir para outra página, volta para página 1 na requisição", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(async (url: string) => {
      if (!url.includes("/roles/paginated")) {
        if (url.includes("/roles/setores")) return [];
        if (url.includes("/roles/permissions")) return [];
        throw new Error(`Unhandled: ${url}`);
      }
      const qs = new URLSearchParams(url.split("?")[1] ?? "");
      const p = Number(qs.get("page") ?? "1");
      if (p === 2) {
        return {
          data: [makeCargo({ id: 99, nome: "Só na p2" })],
          total: 5,
          page: 2,
          totalPages: 3,
        };
      }
      return {
        data: [makeCargo({ nome: "Página 1" })],
        total: 5,
        page: 1,
        totalPages: 3,
      };
    });

    render(<CargosPage />, { wrapper });

    await screen.findByText("Página 1");
    const { next } = getPaginationButtons();
    expect(next).not.toBeDisabled();
    await user.click(next);

    await screen.findByText("Só na p2");
    expect(lastPaginatedUrl()).toContain("page=2");

    const cat = screen.getByLabelText("categoria-filter");
    await user.selectOptions(cat, "GESTAO");

    await waitFor(() => {
      const u = lastPaginatedUrl();
      expect(u).toContain("page=1");
      expect(u).toContain("categoria=GESTAO");
    });
  });

  it("não chama setores/permissões com modal fechado; chama ao abrir novo cargo e passa isNew=true", async () => {
    const user = userEvent.setup();
    render(<CargosPage />, { wrapper });

    await screen.findByRole("table");

    expect(
      apiMock.mock.calls.some((c) => String(c[0]).includes("/roles/setores")),
    ).toBe(false);
    expect(
      apiMock.mock.calls.some((c) =>
        String(c[0]).includes("/roles/permissions"),
      ),
    ).toBe(false);

    await user.click(screen.getByRole("button", { name: /novo cargo/i }));

    await waitFor(() => {
      expect(screen.getByTestId("cargo-modal-mock")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        apiMock.mock.calls.some((c) => String(c[0]).includes("/roles/setores")),
      ).toBe(true);
      expect(
        apiMock.mock.calls.some((c) =>
          String(c[0]).includes("/roles/permissions"),
        ),
      ).toBe(true);
    });

    expect(cargoModalSpy).toHaveBeenCalled();
    const lastOpen = [...cargoModalSpy.mock.calls]
      .reverse()
      .find((call) => call[0]?.open);
    expect(lastOpen?.[0]).toMatchObject({
      isNew: true,
      cargo: null,
    });
  });

  it("ao editar pelo menu, abre modal com cargo e isNew=false", async () => {
    const user = userEvent.setup();
    render(<CargosPage />, { wrapper });

    await screen.findByText("Operador");

    const rowTrigger = screen.getAllByRole("button").find((btn) => {
      const onlyIcon = btn.querySelector("svg");
      return (
        onlyIcon &&
        btn.className.includes("text-slate-400") &&
        btn.getAttribute("aria-haspopup") === "menu"
      );
    });
    expect(rowTrigger).toBeTruthy();
    await user.click(rowTrigger!);

    const editItem = await screen.findByRole("menuitem", {
      name: /editar cargo/i,
    });
    await user.click(editItem);

    await waitFor(() => {
      expect(screen.getByTestId("modal-editing-id")).toHaveTextContent("1");
      expect(screen.getByTestId("modal-is-new")).toHaveTextContent("false");
    });
  });

  it("sem permissão de criar: não exibe Novo Cargo e não dispara setores antes de qualquer ação de modal", async () => {
    hasPermissionMock.mockImplementation(
      (p) => p === "ADMINISTRATIVO.CARGO.EDITAR",
    );

    render(<CargosPage />, { wrapper });

    await screen.findByRole("table");

    expect(
      screen.queryByRole("button", { name: /novo cargo/i }),
    ).not.toBeInTheDocument();
    expect(
      apiMock.mock.calls.some((c) => String(c[0]).includes("/roles/setores")),
    ).toBe(false);
  });

  it("sem permissão de editar: não há menu de ações na linha", async () => {
    hasPermissionMock.mockImplementation(
      (p) => p === "ADMINISTRATIVO.CARGO.CRIAR",
    );

    render(<CargosPage />, { wrapper });

    await screen.findByRole("table");

    const menuTriggers = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-haspopup") === "menu");
    expect(menuTriggers).toHaveLength(0);
  });

  it("lista vazia, total no rodapé e paginação: avançar, voltar, botões desabilitados nas bordas", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/roles/paginated")) {
        const qs = new URLSearchParams(url.split("?")[1] ?? "");
        const p = Number(qs.get("page") ?? "1");
        if (p === 2) {
          return {
            data: [makeCargo({ id: 2, nome: "Na segunda" })],
            total: 2,
            page: 2,
            totalPages: 2,
          };
        }
        return {
          data: [],
          total: 0,
          page: 1,
          totalPages: 2,
        };
      }
      if (url.includes("/roles/setores")) return [];
      if (url.includes("/roles/permissions")) return [];
      throw new Error(`Unhandled api: ${url}`);
    });

    render(<CargosPage />, { wrapper });

    await screen.findByText("Nenhum cargo encontrado");
    expect(
      screen.getByText(/total de 0 cargos cadastrados/i),
    ).toBeInTheDocument();

    let { prev, next } = getPaginationButtons();
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    await user.click(next);
    await screen.findByText("Na segunda");

    ({ prev, next } = getPaginationButtons());
    expect(prev).not.toBeDisabled();
    expect(next).toBeDisabled();

    await user.click(prev);
    await screen.findByText("Nenhum cargo encontrado");
    ({ prev, next } = getPaginationButtons());
    expect(prev).toBeDisabled();
  });

  it("quando a API não envia totalPages, assume 1 e desabilita próxima página", async () => {
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/roles/paginated")) {
        return {
          data: [makeCargo()],
          total: 1,
          page: 1,
        } as {
          data: ReturnType<typeof makeCargo>[];
          total: number;
          page: number;
        };
      }
      if (url.includes("/roles/setores")) return [];
      if (url.includes("/roles/permissions")) return [];
      throw new Error(`Unhandled: ${url}`);
    });

    render(<CargosPage />, { wrapper });

    await screen.findByText(/página 1 de 1/i);
    const { prev, next } = getPaginationButtons();
    expect(prev).toBeDisabled();
    expect(next).toBeDisabled();
  });

  it("falha na listagem: não trava em spinner; exibe estado vazio e total 0", async () => {
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/roles/paginated")) {
        throw new Error("servidor indisponível");
      }
      if (url.includes("/roles/setores")) return [];
      if (url.includes("/roles/permissions")) return [];
      throw new Error(`Unhandled: ${url}`);
    });

    render(<CargosPage />, { wrapper });

    await screen.findByText("Nenhum cargo encontrado");
    expect(screen.queryByRole("table")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeNull();
    expect(
      screen.getByText(/total de 0 cargos cadastrados/i),
    ).toBeInTheDocument();
  });

  it("cargo inativo: nome e vínculos acinzentados, descrição ausente vira traço, status Inativo", async () => {
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/roles/paginated")) {
        return {
          data: [
            makeCargo({
              nome: "Supervisor",
              ativo: false,
              descricao: null,
              categoria: "GESTAO",
              usuariosVinculados: 3,
            }),
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        };
      }
      if (url.includes("/roles/setores")) return [];
      if (url.includes("/roles/permissions")) return [];
      throw new Error(`Unhandled api: ${url}`);
    });

    render(<CargosPage />, { wrapper });

    const table = await screen.findByRole("table");
    const nome = within(table).getByText("Supervisor");
    expect(nome).toHaveClass("text-slate-400");

    const vinculos = within(table).getByText("03");
    expect(vinculos).toHaveClass("text-slate-400");

    const badge = within(table)
      .getByText(CATEGORIA_CONFIG.GESTAO.label)
      .closest("span");
    expect(badge?.className).toMatch(/grayscale/);

    expect(within(table).getByText("-")).toBeInTheDocument();
    expect(
      within(table).getByText("Inativo", { selector: ".text-\\[10px\\]" }),
    ).toBeInTheDocument();
  });

  it("cargo ativo com descrição e usuários com um dígito: exibe texto e zero à esquerda", async () => {
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/roles/paginated")) {
        return {
          data: [
            makeCargo({
              nome: "Auxiliar",
              descricao: "Acesso somente leitura",
              usuariosVinculados: 7,
              categoria: "ADMINISTRATIVO",
            }),
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        };
      }
      if (url.includes("/roles/setores")) return [];
      if (url.includes("/roles/permissions")) return [];
      throw new Error(`Unhandled: ${url}`);
    });

    render(<CargosPage />, { wrapper });

    const table = await screen.findByRole("table");
    expect(
      within(table).getByText("Acesso somente leitura"),
    ).toBeInTheDocument();
    expect(within(table).getByText("07")).toBeInTheDocument();
    expect(within(table).getByText("Ativo")).toBeInTheDocument();
  });

  it("link Voltar aponta para /configuracoes", async () => {
    render(<CargosPage />, { wrapper });
    await screen.findByRole("table");
    const back = screen
      .getAllByRole("link")
      .find((l) => l.getAttribute("href") === "/configuracoes");
    expect(back).toBeTruthy();
  });
});
