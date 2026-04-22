import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClienteModal } from "@/pages/clientes/cliente-modal";
import type { Cliente } from "@/pages/clientes/shared/clientes-page.shared";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: apiMock,
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

function renderModal(
  ui: React.ReactElement,
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  }),
) {
  return render(
    <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
  );
}

function clienteEdicao(): Cliente {
  return {
    id: 99,
    nome: "Edit Me",
    nomeFantasia: null,
    cnpj: null,
    tipoContrato: "COMODATO",
    estoqueProprio: false,
    status: "ATIVO",
    contatos: [],
  };
}

describe("ClienteModal — fluxo integrado", () => {
  beforeEach(() => {
    apiMock.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("criação: título Novo Cliente e salvar dispara POST", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValue({});
    const onClose = vi.fn();

    renderModal(
      <ClienteModal open editingCliente={null} onClose={onClose} />,
    );

    expect(
      screen.getByRole("heading", { name: /novo cliente/i }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/empresa abc ltda/i),
      "Cliente Novo LTDA",
    );
    await user.click(screen.getByRole("button", { name: /salvar cliente/i }));

    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    const postCall = apiMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0] === "/clientes",
    );
    expect(postCall?.[1]).toMatchObject({ method: "POST" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Cliente criado com sucesso");
  });

  it("edição: título Editar Cliente e salvar dispara PATCH", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValue({});
    const onClose = vi.fn();
    const c = clienteEdicao();

    renderModal(
      <ClienteModal open editingCliente={c} onClose={onClose} />,
    );

    expect(
      screen.getByRole("heading", { name: /editar cliente/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /salvar cliente/i }));

    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        "/clientes/99",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      "Cliente atualizado com sucesso",
    );
  });

  it("validação: razão social vazia não chama API", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(
      <ClienteModal open editingCliente={null} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /salvar cliente/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/razão social obrigatória|obrigatória/i),
      ).toBeInTheDocument(),
    );
    expect(apiMock).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Switch estoque próprio alterna rótulo SIM/NÃO", async () => {
    const user = userEvent.setup();
    renderModal(
      <ClienteModal open editingCliente={null} onClose={vi.fn()} />,
    );

    const sw = screen.getByRole("switch", { name: /estoque próprio/i });
    expect(screen.getByText("NÃO")).toBeInTheDocument();
    await user.click(sw);
    expect(screen.getByText("SIM")).toBeInTheDocument();
  });

  it("adicionar e remover contato", async () => {
    const user = userEvent.setup();
    renderModal(
      <ClienteModal open editingCliente={null} onClose={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: /adicionar contato/i }),
    );
    const nomeInput = screen.getByPlaceholderText(/nome do contato/i);
    await user.type(nomeInput, "Contato 1");

    const removeBtn = screen.getByRole("button", {
      name: /remover contato 1/i,
    });
    await user.click(removeBtn);

    expect(
      screen.queryByPlaceholderText(/nome do contato/i),
    ).not.toBeInTheDocument();
  });

  it("resumo lateral reflete razão social digitada", async () => {
    const user = userEvent.setup();
    renderModal(
      <ClienteModal open editingCliente={null} onClose={vi.fn()} />,
    );

    const resumo = screen.getByText(/resumo do cliente/i).closest("div");
    expect(resumo).toBeTruthy();

    await user.type(
      screen.getByPlaceholderText(/empresa abc ltda/i),
      "ACME Brasil",
    );

    await waitFor(() => {
      const aside = screen
        .getByText(/resumo do cliente/i)
        .closest(".overflow-y-auto");
      expect(aside).toBeTruthy();
      if (aside)
        expect(within(aside as HTMLElement).getByText("ACME Brasil")).toBeInTheDocument();
    });
  });
});
