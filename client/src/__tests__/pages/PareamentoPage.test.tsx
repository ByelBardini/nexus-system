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

type MutationConfig<TData = unknown> = {
  mutationFn?: () => Promise<TData> | TData;
  onSuccess?: (data: TData) => void;
  onError?: (err: Error) => void;
};

const mutationCalls = { capturedConfigs: [] as MutationConfig[] };

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    useMutation: vi.fn((config: MutationConfig) => {
      mutationCalls.capturedConfigs.push(config);
      return { mutate: vi.fn(), isPending: false };
    }),
    useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/pages/equipamentos/pareamento/preview/PreviewPareamentoTable", () => ({
  PreviewPareamentoTable: () => <div />,
  TRACKER_STATUS_LABELS: {
    FOUND_AVAILABLE: { label: "", className: "" },
    FOUND_ALREADY_LINKED: { label: "", className: "" },
    NEEDS_CREATE: { label: "", className: "" },
    INVALID_FORMAT: { label: "", className: "" },
  },
}));

vi.mock("@/pages/equipamentos/pareamento/preview/PreviewCsvTable", () => ({
  PreviewCsvTable: () => <div data-testid="csv-preview-table" />,
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: () => <div />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span aria-hidden="true" data-icon={name} />
  ),
}));

type PapaParseConfig = {
  complete?: (result: {
    data: Record<string, string>[];
    errors: unknown[];
  }) => void;
  error?: (err: Error) => void;
  transformHeader?: (h: string) => string;
};

type PapaFakeMode =
  | "default"
  | "empty"
  | "parse_error"
  | "callback_error"
  | "invalid_header";

const papaState = { mode: "default" as PapaFakeMode };

vi.mock("papaparse", () => {
  return {
    default: {
      parse: vi.fn((_file: File, config: PapaParseConfig) => {
        switch (papaState.mode) {
          case "empty":
            config.complete?.({ data: [], errors: [] });
            return;
          case "parse_error":
            config.complete?.({
              data: [],
              errors: [{ message: "Quoted field unterminated" }],
            });
            return;
          case "callback_error":
            config.error?.(new Error("IO falhou"));
            return;
          case "invalid_header":
            config.complete?.({
              data: [
                {
                  col_x: "foo",
                  col_y: "bar",
                },
              ],
              errors: [],
            });
            return;
          case "default":
          default:
            config.complete?.({
              data: [
                {
                  imei: "358942109982341",
                  iccid: "8955101234567890123",
                  marca_rastreador: "Suntech",
                  modelo: "ST-901",
                },
              ],
              errors: [],
            });
        }
      }),
    },
  };
});

import { useSearchParams } from "react-router-dom";
import { PareamentoPage } from "@/pages/equipamentos/pareamento/PareamentoPage";

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

// ─── MODO CSV ────────────────────────────────────────────────────────────────

describe("PareamentoPage — modo CSV", () => {
  beforeEach(() => {
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams(),
      vi.fn(),
    ]);
    papaState.mode = "default";
    mutationCalls.capturedConfigs = [];
  });

  async function switchToCsv() {
    await userEvent.click(
      screen.getByRole("button", { name: /importação csv/i }),
    );
  }

  async function uploadDefaultCsv() {
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    const file = new File(
      ["imei;iccid\n358942109982341;8955101234567890123"],
      "teste.csv",
      { type: "text/csv" },
    );
    await userEvent.upload(input, file);
  }

  it("botão 'Importação CSV' está habilitado (não é mais 'Em breve')", () => {
    renderPage();
    const btn = screen.getByRole("button", { name: /importação csv/i });
    expect(btn).not.toBeDisabled();
    expect(btn.className).not.toMatch(/opacity-50/);
  });

  it("ao trocar para modo CSV, exibe seção de upload e botão de baixar modelo", async () => {
    renderPage();
    await switchToCsv();

    expect(screen.getByText(/importar arquivo csv/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /baixar modelo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /escolher arquivo/i }),
    ).toBeInTheDocument();
  });

  it("no modo CSV, o rodapé exibe 'Validar CSV' e 'Confirmar Importação'", async () => {
    renderPage();
    await switchToCsv();

    expect(
      screen.getByRole("button", { name: /validar csv/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirmar importação/i }),
    ).toBeInTheDocument();
  });

  it("botão 'Validar CSV' inicia desabilitado quando não há arquivo carregado", async () => {
    renderPage();
    await switchToCsv();

    expect(screen.getByRole("button", { name: /validar csv/i })).toBeDisabled();
  });

  it("botão 'Confirmar Importação' inicia desabilitado quando ainda não há preview", async () => {
    renderPage();
    await switchToCsv();

    expect(
      screen.getByRole("button", { name: /confirmar importação/i }),
    ).toBeDisabled();
  });

  it("clicar em 'Baixar modelo' cria e dispara download de CSV", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:fake");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis.URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });

    renderPage();
    await switchToCsv();
    await userEvent.click(
      screen.getByRole("button", { name: /baixar modelo/i }),
    );

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("fazer upload de CSV preenche o contador de linhas carregadas", async () => {
    renderPage();
    await switchToCsv();

    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    const file = new File(
      ["imei;iccid\n358942109982341;8955101234567890123"],
      "teste.csv",
      { type: "text/csv" },
    );
    await userEvent.upload(input, file);

    expect(
      screen.getByText(/1 linha\(s\) carregada\(s\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/teste\.csv/i)).toBeInTheDocument();
  });

  it("após upload, o botão 'Validar CSV' fica habilitado", async () => {
    renderPage();
    await switchToCsv();

    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    const file = new File(
      ["imei;iccid\n358942109982341;8955101234567890123"],
      "teste.csv",
      { type: "text/csv" },
    );
    await userEvent.upload(input, file);

    expect(
      screen.getByRole("button", { name: /validar csv/i }),
    ).not.toBeDisabled();
  });

  it("exibe instruções de colunas esperadas (operadora vem antes de marca_simcard)", async () => {
    renderPage();
    await switchToCsv();

    expect(screen.getByText(/colunas esperadas/i)).toBeInTheDocument();
    const lista = screen.getByText(/colunas esperadas/i)
      .nextElementSibling as HTMLElement;
    expect(lista.textContent).toMatch(/operadora/i);
    expect(lista.textContent).toMatch(/marca_simcard/i);
    const idxOp = lista.textContent!.indexOf("operadora");
    const idxMarca = lista.textContent!.indexOf("marca_simcard");
    expect(idxOp).toBeLessThan(idxMarca);
  });

  it("template baixado inclui cabeçalho com todas as colunas na ordem certa", async () => {
    const captured: Blob[] = [];
    const createObjectURL = vi.fn((b: Blob) => {
      captured.push(b);
      return "blob:fake";
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis.URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });

    renderPage();
    await switchToCsv();
    await userEvent.click(
      screen.getByRole("button", { name: /baixar modelo/i }),
    );

    expect(captured).toHaveLength(1);
    const texto = await captured[0].text();
    const primeiraLinha = texto.split("\n")[0].replace(/^\uFEFF/, "");
    expect(primeiraLinha).toBe(
      "marca_rastreador;modelo;imei;operadora;marca_simcard;plano;iccid;lote_rastreador;lote_simcard",
    );
    expect(texto).toMatch(/Suntech;ST-901;358942109982341;Claro/);
    expect(texto).toMatch(/10MB/);
  });

  it("papaparse retorna erros → exibe mensagem de erro e limpa linhas", async () => {
    papaState.mode = "parse_error";

    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    expect(screen.getByText(/erro ao ler csv/i)).toBeInTheDocument();
    expect(screen.getByText(/quoted field unterminated/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/linha\(s\) carregada\(s\)/i),
    ).not.toBeInTheDocument();
  });

  it("papaparse dispara callback error → exibe mensagem de erro", async () => {
    papaState.mode = "callback_error";

    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    expect(screen.getByText(/erro ao ler csv: io falhou/i)).toBeInTheDocument();
  });

  it("CSV sem colunas imei/iccid reconhecidas → mostra erro de cabeçalho", async () => {
    papaState.mode = "invalid_header";

    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    expect(
      screen.getByText(/nenhuma linha válida encontrada/i),
    ).toBeInTheDocument();
  });

  it("clicar em 'Validar CSV' dispara a mutation de preview", async () => {
    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    const validar = screen.getByRole("button", { name: /validar csv/i });
    expect(validar).not.toBeDisabled();

    await userEvent.click(validar);

    const previewConfig = mutationCalls.capturedConfigs.find((c) =>
      c.mutationFn?.toString().includes("/csv/preview"),
    );
    expect(previewConfig).toBeDefined();
  });

  it("'Confirmar Importação' desabilitado quando proprietário=CLIENTE e clienteId vazio", async () => {
    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    const proprietarioCombo = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.toLowerCase().includes("infinity"));
    expect(proprietarioCombo).toBeDefined();

    // Botão Confirmar Importação começa desabilitado (sem preview)
    expect(
      screen.getByRole("button", { name: /confirmar importação/i }),
    ).toBeDisabled();
  });

  it("clicar em 'Cancelar' limpa o arquivo carregado", async () => {
    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    expect(screen.getByText(/teste\.csv/i)).toBeInTheDocument();
    expect(
      screen.getByText(/1 linha\(s\) carregada\(s\)/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));

    expect(screen.queryByText(/teste\.csv/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/linha\(s\) carregada\(s\)/i),
    ).not.toBeInTheDocument();
  });

  it("configuração do useMutation para CSV envia proprietario/clienteId no body", async () => {
    renderPage();
    await switchToCsv();
    await uploadDefaultCsv();

    const previewConfig = mutationCalls.capturedConfigs.find((c) =>
      c.mutationFn?.toString().includes("/csv/preview"),
    );
    const importConfig = mutationCalls.capturedConfigs.find(
      (c) =>
        c.mutationFn?.toString().includes("/aparelhos/pareamento/csv") &&
        !c.mutationFn.toString().includes("/preview"),
    );
    expect(previewConfig).toBeDefined();
    expect(importConfig).toBeDefined();
    expect(previewConfig!.mutationFn!.toString()).toMatch(/proprietario/);
    expect(importConfig!.mutationFn!.toString()).toMatch(/clienteId/);
  });
});
