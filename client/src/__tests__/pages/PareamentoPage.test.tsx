import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
      <a href={String(to)}>{children}</a>
    ),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/pages/equipamentos/PreviewPareamentoTable", () => ({
  PreviewPareamentoTable: () => <div />,
  TRACKER_STATUS_LABELS: {
    FOUND_AVAILABLE: { label: "", className: "" },
    FOUND_ALREADY_LINKED: { label: "", className: "" },
    NEEDS_CREATE: { label: "", className: "" },
    INVALID_FORMAT: { label: "", className: "" },
  },
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: () => <div />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span aria-hidden="true" data-icon={name} />
  ),
}));

import { useSearchParams } from "react-router-dom";
import { PareamentoPage } from "@/pages/equipamentos/PareamentoPage";

function renderPage() {
  return render(<PareamentoPage />);
}

async function switchToMassa() {
  await userEvent.click(screen.getByRole("button", { name: /em massa/i }));
}

// ─── ESTADO INICIAL ──────────────────────────────────────────────────────────

describe("PareamentoPage — estado inicial (modo individual)", () => {
  it("não exibe campos de criação por padrão", () => {
    renderPage();
    expect(screen.queryByText(/pertence a um lote/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/marca \(se criar novo\)/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/modelo \(se criar novo\)/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^operadora$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/marca do simcard/i)).not.toBeInTheDocument();
  });

  it('exibe dois checkboxes "Criar Novo" desmarcados por padrão', () => {
    renderPage();
    const checkboxes = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((cb) =>
      expect(cb).toHaveAttribute("aria-checked", "false"),
    );
  });
});

// ─── INDIVIDUAL — RASTREADOR ─────────────────────────────────────────────────

describe("PareamentoPage — CRIAR NOVO rastreador (modo individual)", () => {
  it("ao marcar CRIAR NOVO, exibe PERTENCE A UM LOTE e campos de marca/modelo", async () => {
    renderPage();
    const [criarNovoRastreador] = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });

    await userEvent.click(criarNovoRastreador);

    expect(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/marca \(se criar novo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/modelo \(se criar novo\)/i)).toBeInTheDocument();
  });

  it("ao desmarcar CRIAR NOVO, campos de criação somem", async () => {
    renderPage();
    const [criarNovoRastreador] = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });

    await userEvent.click(criarNovoRastreador);
    await userEvent.click(criarNovoRastreador);

    expect(
      screen.queryByText(/marca \(se criar novo\)/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/pertence a um lote/i)).not.toBeInTheDocument();
  });

  it("ao marcar PERTENCE A UM LOTE, exibe dropdown de lote e esconde marca/modelo", async () => {
    renderPage();
    const [criarNovoRastreador] = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });
    await userEvent.click(criarNovoRastreador);

    const pertenceLote = screen.getByRole("checkbox", {
      name: /pertence a um lote/i,
    });
    await userEvent.click(pertenceLote);

    expect(screen.getByText(/^lote$/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/marca \(se criar novo\)/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/modelo \(se criar novo\)/i),
    ).not.toBeInTheDocument();
  });

  it("ao desmarcar PERTENCE A UM LOTE, volta para campos de marca/modelo", async () => {
    renderPage();
    const [criarNovoRastreador] = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });
    await userEvent.click(criarNovoRastreador);

    const pertenceLote = screen.getByRole("checkbox", {
      name: /pertence a um lote/i,
    });
    await userEvent.click(pertenceLote); // marcar lote
    await userEvent.click(pertenceLote); // desmarcar lote

    expect(screen.getByText(/marca \(se criar novo\)/i)).toBeInTheDocument();
  });
});

// ─── INDIVIDUAL — SIM ────────────────────────────────────────────────────────

describe("PareamentoPage — CRIAR NOVO SIM (modo individual)", () => {
  it("ao marcar CRIAR NOVO do SIM, exibe PERTENCE A UM LOTE e campos de operadora", async () => {
    renderPage();
    const checkboxes = screen.getAllByRole("checkbox", { name: /criar novo/i });
    const criarNovoSim = checkboxes[1];

    await userEvent.click(criarNovoSim);

    expect(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^operadora$/i)).toBeInTheDocument();
    expect(screen.getByText(/marca do simcard/i)).toBeInTheDocument();
  });

  it("ao desmarcar CRIAR NOVO do SIM, campos somem", async () => {
    renderPage();
    const checkboxes = screen.getAllByRole("checkbox", { name: /criar novo/i });
    const criarNovoSim = checkboxes[1];

    await userEvent.click(criarNovoSim);
    await userEvent.click(criarNovoSim);

    expect(screen.queryByText(/^operadora$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pertence a um lote/i)).not.toBeInTheDocument();
  });

  it("ao marcar PERTENCE A UM LOTE do SIM, exibe dropdown de lote e esconde operadora", async () => {
    renderPage();
    const checkboxes = screen.getAllByRole("checkbox", { name: /criar novo/i });
    await userEvent.click(checkboxes[1]);

    const pertenceLote = screen.getByRole("checkbox", {
      name: /pertence a um lote/i,
    });
    await userEvent.click(pertenceLote);

    expect(screen.getByText(/^lote$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^operadora$/i)).not.toBeInTheDocument();
  });

  it("marcar CRIAR NOVO de ambos exibe dois 'PERTENCE A UM LOTE'", async () => {
    renderPage();
    const [criarNovoRastreador, criarNovoSim] = screen.getAllByRole(
      "checkbox",
      {
        name: /criar novo/i,
      },
    );

    await userEvent.click(criarNovoRastreador);
    await userEvent.click(criarNovoSim);

    const pertenceLoteCheckboxes = screen.getAllByRole("checkbox", {
      name: /pertence a um lote/i,
    });
    expect(pertenceLoteCheckboxes).toHaveLength(2);
  });
});

// ─── RESET ───────────────────────────────────────────────────────────────────

describe("PareamentoPage — Limpar Campos (modo individual)", () => {
  it("Limpar Campos reseta os checkboxes CRIAR NOVO e oculta os campos de criação", async () => {
    renderPage();
    const [criarNovoRastreador, criarNovoSim] = screen.getAllByRole(
      "checkbox",
      {
        name: /criar novo/i,
      },
    );

    await userEvent.click(criarNovoRastreador);
    await userEvent.click(criarNovoSim);

    expect(
      screen.getAllByRole("checkbox", { name: /pertence a um lote/i }),
    ).toHaveLength(2);

    await userEvent.click(
      screen.getByRole("button", { name: /limpar campos/i }),
    );

    expect(criarNovoRastreador).toHaveAttribute("aria-checked", "false");
    expect(criarNovoSim).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText(/pertence a um lote/i)).not.toBeInTheDocument();
  });
});

// ─── MODO MASSA ───────────────────────────────────────────────────────────────

describe("PareamentoPage — modo massa", () => {
  beforeEach(() => {
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams("modo=massa"),
      vi.fn(),
    ]);
  });

  it("não exibe campos de criação por padrão no modo massa", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /em massa/i }));
    expect(screen.queryByText(/pertence a um lote/i)).not.toBeInTheDocument();
  });

  it('exibe dois checkboxes "Criar Novo" desmarcados por padrão no modo massa', async () => {
    renderPage();
    await switchToMassa();
    const checkboxes = screen.getAllByRole("checkbox", { name: /criar novo/i });
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((cb) =>
      expect(cb).toHaveAttribute("aria-checked", "false"),
    );
  });

  it("ao marcar CRIAR NOVO rastreadores, exibe configuração de criação", async () => {
    renderPage();
    await switchToMassa();

    const [criarNovoRastreador] = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });
    await userEvent.click(criarNovoRastreador);

    expect(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    ).toBeInTheDocument();
  });

  it("ao marcar CRIAR NOVO SIMs, exibe configuração de criação", async () => {
    renderPage();
    await switchToMassa();

    const checkboxes = screen.getAllByRole("checkbox", { name: /criar novo/i });
    await userEvent.click(checkboxes[1]);

    expect(
      screen.getByRole("checkbox", { name: /pertence a um lote/i }),
    ).toBeInTheDocument();
  });

  it("ao desmarcar CRIAR NOVO rastreadores, campos somem", async () => {
    renderPage();
    await switchToMassa();

    const [criarNovoRastreador] = screen.getAllByRole("checkbox", {
      name: /criar novo/i,
    });
    await userEvent.click(criarNovoRastreador);
    await userEvent.click(criarNovoRastreador);

    expect(screen.queryByText(/pertence a um lote/i)).not.toBeInTheDocument();
  });

  it("marcar CRIAR NOVO em ambos exibe dois 'PERTENCE A UM LOTE'", async () => {
    renderPage();
    await switchToMassa();

    const [criarNovoRastreador, criarNovoSim] = screen.getAllByRole(
      "checkbox",
      {
        name: /criar novo/i,
      },
    );
    await userEvent.click(criarNovoRastreador);
    await userEvent.click(criarNovoSim);

    expect(
      screen.getAllByRole("checkbox", { name: /pertence a um lote/i }),
    ).toHaveLength(2);
  });
});
