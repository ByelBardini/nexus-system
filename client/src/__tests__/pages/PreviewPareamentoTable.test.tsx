import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PreviewPareamentoTable,
  countPareamentoPreviewDuplicateLinhas,
  type PreviewLinha,
  type PreviewResult,
} from "@/pages/equipamentos/PreviewPareamentoTable";

const linha = (overrides: Partial<PreviewLinha>): PreviewLinha => ({
  imei: "111",
  iccid: "222",
  tracker_status: "FOUND_AVAILABLE",
  sim_status: "FOUND_AVAILABLE",
  action_needed: "OK",
  ...overrides,
});

function makePreview(linhas: PreviewLinha[]): PreviewResult {
  return {
    linhas,
    contadores: { validos: 0, exigemLote: 0, erros: 0 },
  };
}

describe("countPareamentoPreviewDuplicateLinhas", () => {
  it("retorna 0 quando não há repetição", () => {
    expect(
      countPareamentoPreviewDuplicateLinhas([
        linha({ imei: "a", iccid: "1" }),
        linha({ imei: "b", iccid: "2" }),
      ]),
    ).toBe(0);
  });

  it("conta linhas cujo IMEI se repete (não vazio)", () => {
    expect(
      countPareamentoPreviewDuplicateLinhas([
        linha({ imei: "same", iccid: "1" }),
        linha({ imei: "same", iccid: "2" }),
        linha({ imei: "other", iccid: "3" }),
      ]),
    ).toBe(2);
  });

  it("conta linhas cujo ICCID se repete", () => {
    expect(
      countPareamentoPreviewDuplicateLinhas([
        linha({ imei: "1", iccid: "dup" }),
        linha({ imei: "2", iccid: "dup" }),
      ]),
    ).toBe(2);
  });

  it("ignora strings vazias / só espaço para duplicidade", () => {
    expect(
      countPareamentoPreviewDuplicateLinhas([
        linha({ imei: "", iccid: "" }),
        linha({ imei: "   ", iccid: "  " }),
      ]),
    ).toBe(0);
  });

  it("normaliza trim: mesmo IMEI com espaços conta como duplicado", () => {
    expect(
      countPareamentoPreviewDuplicateLinhas([
        linha({ imei: "  abc  ", iccid: "1" }),
        linha({ imei: "abc", iccid: "2" }),
      ]),
    ).toBe(2);
  });
});

describe("PreviewPareamentoTable — card Duplicados", () => {
  it("exibe contagem derivada das linhas (não fixo em 0)", () => {
    const preview = makePreview([
      linha({ imei: "x", iccid: "a" }),
      linha({ imei: "x", iccid: "b" }),
    ]);

    render(<PreviewPareamentoTable preview={preview} />);

    const label = screen.getByText(/^duplicados$/i);
    const card = label.closest("div.flex-1");
    expect(card).toBeTruthy();
    expect(within(card!).getByText("2")).toBeInTheDocument();
  });

  it("exibe 0 no card Duplicados quando não há duplicados", () => {
    const preview = makePreview([
      linha({ imei: "a", iccid: "1" }),
      linha({ imei: "b", iccid: "2" }),
    ]);

    render(<PreviewPareamentoTable preview={preview} />);

    const label = screen.getByText(/^duplicados$/i);
    const card = label.closest("div.flex-1");
    expect(within(card!).getByText("0")).toBeInTheDocument();
  });
});
