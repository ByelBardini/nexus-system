import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PreviewCsvTable,
  type CsvPreviewResult,
  type CsvPreviewLinha,
} from "@/pages/equipamentos/pareamento/preview/PreviewCsvTable";

function makePreview(
  linhas: CsvPreviewLinha[],
  contadores?: Partial<CsvPreviewResult["contadores"]>,
): CsvPreviewResult {
  return {
    linhas,
    contadores: {
      validos:
        contadores?.validos ??
        linhas.filter((l) => l.erros.length === 0).length,
      comAviso: contadores?.comAviso ?? 0,
      erros:
        contadores?.erros ?? linhas.filter((l) => l.erros.length > 0).length,
    },
  };
}

const linhaBase: CsvPreviewLinha = {
  imei: "358942109982341",
  iccid: "8955101234567890123",
  tracker_status: "FOUND_AVAILABLE",
  sim_status: "FOUND_AVAILABLE",
  tracker_acao: "VINCULAR_EXISTENTE",
  sim_acao: "VINCULAR_EXISTENTE",
  erros: [],
};

describe("PreviewCsvTable — contadores e cabeçalhos", () => {
  it("renderiza os quatro contadores (válidos, com aviso, total, erros)", () => {
    const preview = makePreview(
      [
        { ...linhaBase },
        {
          ...linhaBase,
          imei: "222",
          iccid: "333",
          tracker_acao: "ERRO",
          sim_acao: "ERRO",
          erros: ["IMEI_INVALIDO"],
        },
        {
          ...linhaBase,
          imei: "444",
          iccid: "555",
          tracker_acao: "ERRO",
          sim_acao: "ERRO",
          erros: ["IMEI_INVALIDO"],
        },
      ],
      { comAviso: 7 },
    );

    const { container } = render(<PreviewCsvTable preview={preview} />);

    expect(screen.getByText(/válidos/i)).toBeInTheDocument();
    expect(screen.getByText(/com aviso/i)).toBeInTheDocument();
    expect(screen.getByText(/total de linhas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^erros$/i).length).toBeGreaterThanOrEqual(1);

    const valores = Array.from(container.querySelectorAll("p.text-2xl")).map(
      (p) => p.textContent,
    );
    expect(valores).toEqual(["1", "7", "3", "2"]);
  });

  it("renderiza todas as colunas no header da tabela", () => {
    render(<PreviewCsvTable preview={makePreview([{ ...linhaBase }])} />);

    expect(screen.getByRole("columnheader", { name: "#" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /imei/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /iccid/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /rastreador/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^sim$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /erros/i }),
    ).toBeInTheDocument();
  });

  it("renderiza IMEI e ICCID em cada linha", () => {
    render(<PreviewCsvTable preview={makePreview([{ ...linhaBase }])} />);

    expect(screen.getByText("358942109982341")).toBeInTheDocument();
    expect(screen.getByText("8955101234567890123")).toBeInTheDocument();
  });

  it("renderiza 'vazio' quando IMEI ou ICCID estão em branco", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            imei: "",
            iccid: "",
            tracker_acao: "ERRO",
            sim_acao: "ERRO",
            erros: ["IMEI_INVALIDO", "ICCID_INVALIDO"],
          },
        ])}
      />,
    );

    const vazios = screen.getAllByText(/vazio/i);
    expect(vazios.length).toBeGreaterThanOrEqual(2);
  });

  it("mostra o contador total de itens processados no rodapé do header", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([{ ...linhaBase }, { ...linhaBase, imei: "x" }])}
      />,
    );

    expect(screen.getByText(/2 itens processados/i)).toBeInTheDocument();
  });
});

describe("PreviewCsvTable — labels de ação", () => {
  it("exibe 'Vincular existente' com detalhe marca/modelo para tracker_acao=VINCULAR_EXISTENTE", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_acao: "VINCULAR_EXISTENTE",
            marcaRastreador: "Suntech",
            modeloRastreador: "ST-901",
          },
        ])}
      />,
    );

    const labels = screen.getAllByText(/vincular existente/i);
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Suntech / ST-901")).toBeInTheDocument();
  });

  it("exibe 'Criar via lote' com referência para tracker_acao=CRIAR_VIA_LOTE", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_status: "NEEDS_CREATE",
            tracker_acao: "CRIAR_VIA_LOTE",
            loteRastreadorId: 100,
            loteRastreadorReferencia: "LOTE-AB",
          },
        ])}
      />,
    );

    expect(screen.getByText(/criar via lote/i)).toBeInTheDocument();
    expect(screen.getByText("Lote LOTE-AB")).toBeInTheDocument();
  });

  it("exibe 'Criar via lote' com ID numérico quando referência está vazia", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_status: "NEEDS_CREATE",
            tracker_acao: "CRIAR_VIA_LOTE",
            loteRastreadorId: 42,
          },
        ])}
      />,
    );

    expect(screen.getByText("Lote 42")).toBeInTheDocument();
  });

  it("exibe 'Criar novo' para tracker_acao=CRIAR_MANUAL", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_status: "NEEDS_CREATE",
            tracker_acao: "CRIAR_MANUAL",
            marcaRastreador: "Suntech",
            modeloRastreador: "ST-901",
          },
        ])}
      />,
    );

    expect(screen.getByText(/criar novo/i)).toBeInTheDocument();
    expect(screen.getByText("Suntech / ST-901")).toBeInTheDocument();
  });

  it("exibe detalhe de SIM com operadora quando sim_acao=VINCULAR_EXISTENTE", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          { ...linhaBase, sim_acao: "VINCULAR_EXISTENTE", operadora: "Claro" },
        ])}
      />,
    );

    expect(screen.getByText("Claro")).toBeInTheDocument();
  });

  it("exibe 'Lote <ref>' para sim_acao=CRIAR_VIA_LOTE", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            sim_status: "NEEDS_CREATE",
            sim_acao: "CRIAR_VIA_LOTE",
            loteSimId: 55,
            loteSimReferencia: "LOTE-SIM-1",
          },
        ])}
      />,
    );

    expect(screen.getByText("Lote LOTE-SIM-1")).toBeInTheDocument();
  });

  it("exibe 'Novo' no SIM quando sim_acao=CRIAR_MANUAL e operadora vazia", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            sim_status: "NEEDS_CREATE",
            sim_acao: "CRIAR_MANUAL",
          },
        ])}
      />,
    );

    expect(screen.getByText("Novo")).toBeInTheDocument();
  });

  it("exibe '—' como detalhe quando acao=ERRO", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_status: "INVALID_FORMAT",
            sim_status: "INVALID_FORMAT",
            tracker_acao: "ERRO",
            sim_acao: "ERRO",
            erros: ["IMEI_INVALIDO", "ICCID_INVALIDO"],
          },
        ])}
      />,
    );

    const erroLabels = screen.getAllByText(/^erro$/i);
    expect(erroLabels.length).toBeGreaterThanOrEqual(2);
  });
});

describe("PreviewCsvTable — coluna de erros", () => {
  it("exibe '—' em verde quando não há erros", () => {
    const { container } = render(
      <PreviewCsvTable preview={makePreview([{ ...linhaBase }])} />,
    );

    const ok = container.querySelector(".text-emerald-600");
    expect(ok).toBeTruthy();
    expect(ok?.textContent).toBe("—");
  });

  it("traduz códigos de erro conhecidos para mensagens amigáveis", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_acao: "ERRO",
            sim_acao: "ERRO",
            erros: [
              "FALTA_DADOS_RASTREADOR",
              "LOTE_SIMCARD_NAO_ENCONTRADO",
              "MARCA_SIMCARD_NAO_ENCONTRADA",
              "PLANO_SIMCARD_NAO_ENCONTRADO",
            ],
          },
        ])}
      />,
    );

    expect(
      screen.getByText(/rastreador não existe: informe lote ou marca\+modelo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/lote de simcard não encontrado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/marca de simcard não encontrada/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/plano de simcard não encontrado/i),
    ).toBeInTheDocument();
  });

  it("renderiza código cru quando o erro não tem tradução", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_acao: "ERRO",
            sim_acao: "ERRO",
            erros: ["CODIGO_NOVO_DESCONHECIDO"],
          },
        ])}
      />,
    );

    expect(screen.getByText("CODIGO_NOVO_DESCONHECIDO")).toBeInTheDocument();
  });

  it("linha com erro recebe classe bg-red-50", () => {
    const { container } = render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            tracker_acao: "ERRO",
            sim_acao: "ERRO",
            erros: ["FALTA_DADOS_SIM"],
          },
        ])}
      />,
    );

    const rowComErro = container.querySelector("tr.bg-red-50\\/50");
    expect(rowComErro).toBeTruthy();
  });

  it("linha sem erro NÃO recebe classe bg-red-50", () => {
    const { container } = render(
      <PreviewCsvTable preview={makePreview([{ ...linhaBase }])} />,
    );

    const body = container.querySelector("tbody");
    const firstRow = body?.querySelector("tr");
    expect(firstRow?.className).not.toMatch(/bg-red-50/);
  });

  it("renderiza múltiplos erros como lista", () => {
    render(
      <PreviewCsvTable
        preview={makePreview([
          {
            ...linhaBase,
            imei: "",
            iccid: "",
            tracker_acao: "ERRO",
            sim_acao: "ERRO",
            erros: ["IMEI_INVALIDO", "ICCID_INVALIDO"],
          },
        ])}
      />,
    );

    const rows = screen.getAllByRole("row");
    const linhaErros = rows[rows.length - 1];
    const items = within(linhaErros).getAllByRole("listitem");
    expect(items).toHaveLength(2);
  });
});

describe("PreviewCsvTable — render de listas vazias", () => {
  it("renderiza com 0 linhas sem quebrar", () => {
    const preview: CsvPreviewResult = {
      linhas: [],
      contadores: { validos: 0, comAviso: 0, erros: 0 },
    };

    render(<PreviewCsvTable preview={preview} />);

    expect(screen.getByText(/0 itens processados/i)).toBeInTheDocument();
  });
});
