import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { Login } from "@/pages/Login";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock("@/components/ModalTrocaSenha", () => ({
  ModalTrocaSenha: ({ open }: { open: boolean }) =>
    open ? <div>Modal Troca Senha</div> : null,
}));

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function setup(loginFn = vi.fn().mockResolvedValue({})) {
  const navigate = vi.fn();
  vi.mocked(useNavigate).mockReturnValue(navigate);
  vi.mocked(useAuth).mockReturnValue({
    login: loginFn,
    logout: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(false),
    user: null,
    permissions: [],
    accessToken: null,
    isLoading: false,
    isAuthenticated: false,
  });
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
  return { navigate };
}

describe("Login — renderização", () => {
  it("renderiza campos de email e senha", () => {
    setup();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("renderiza os três pilares de funcionalidade no painel lateral", () => {
    setup();
    expect(screen.getByText("Ordens de Serviço")).toBeInTheDocument();
    expect(screen.getByText("Equipamentos")).toBeInTheDocument();
    expect(screen.getByText("Técnicos")).toBeInTheDocument();
  });

  it("renderiza o título da seção de login", () => {
    setup();
    expect(screen.getByText(/entrar no sistema/i)).toBeInTheDocument();
  });

  it("botão Entrar começa habilitado", () => {
    setup();
    expect(screen.getByRole("button", { name: /entrar/i })).not.toBeDisabled();
  });
});

describe("Login — validação", () => {
  it('exibe "Senha obrigatória" ao submeter com senha vazia', async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText("Senha obrigatória")).toBeInTheDocument();
    });
  });

  it('exibe "Email inválido" para email malformado', async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Senha"), "qualquercoisa");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument();
    });
  });

  it("não exibe erros no estado inicial", () => {
    setup();
    expect(screen.queryByText("Senha obrigatória")).not.toBeInTheDocument();
    expect(screen.queryByText("Email inválido")).not.toBeInTheDocument();
  });
});

describe("Login — fluxo de sucesso", () => {
  it("login com sucesso → chama navigate", async () => {
    const loginFn = vi.fn().mockResolvedValue({});
    const { navigate } = setup(loginFn);

    await userEvent.type(screen.getByLabelText("E-mail"), "admin@admin.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("login com sucesso → exibe toast de sucesso", async () => {
    setup(vi.fn().mockResolvedValue({}));

    await userEvent.type(screen.getByLabelText("E-mail"), "admin@admin.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login realizado com sucesso");
    });
  });

  it("exigeTrocaSenha: true → abre ModalTrocaSenha", async () => {
    setup(vi.fn().mockResolvedValue({ exigeTrocaSenha: true }));

    await userEvent.type(screen.getByLabelText("E-mail"), "admin@admin.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText("Modal Troca Senha")).toBeInTheDocument();
    });
  });


});

describe("Login — fluxo de erro", () => {
  it("login com erro → exibe toast de erro", async () => {
    setup(vi.fn().mockRejectedValue(new Error("Credenciais inválidas")));

    await userEvent.type(screen.getByLabelText("E-mail"), "errado@teste.com");
    await userEvent.type(screen.getByLabelText("Senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Credenciais inválidas");
    });
  });

  it("erro sem mensagem → usa texto padrão no toast", async () => {
    setup(vi.fn().mockRejectedValue(new Error()));

    await userEvent.type(screen.getByLabelText("E-mail"), "x@x.com");
    await userEvent.type(screen.getByLabelText("Senha"), "abc123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});

describe("Login — toggle de visibilidade de senha", () => {
  it("botão de olho alterna tipo do input de password", async () => {
    setup();
    const senhaInput = screen.getByLabelText("Senha");
    expect(senhaInput).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar senha" }),
    );
    expect(senhaInput).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "Ocultar senha" }),
    );
    expect(senhaInput).toHaveAttribute("type", "password");
  });
});
