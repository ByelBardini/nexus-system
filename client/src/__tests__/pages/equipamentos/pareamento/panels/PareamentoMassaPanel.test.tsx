import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PareamentoMassaPanel } from "@/pages/equipamentos/pareamento/panels/PareamentoMassaPanel";
import type { PreviewResult } from "@/pages/equipamentos/pareamento/preview/PreviewPareamentoTable";

const lastMassaPreview = vi.hoisted(() => ({
  current: null as PreviewResult | null,
}));

vi.mock(
  "@/pages/equipamentos/pareamento/preview/PreviewPareamentoTable",
  () => ({
    PreviewPareamentoTable: ({ preview }: { preview: PreviewResult }) => {
      lastMassaPreview.current = preview;
      return <div data-testid="preview-pareamento-table" />;
    },
    TRACKER_STATUS_LABELS: {},
    ACTION_LABELS: {},
  }),
);

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

function basePreview(
  overrides: Partial<PreviewResult["contadores"]> = {},
): PreviewResult {
  return {
    linhas: [],
    contadores: { validos: 1, exigemLote: 0, erros: 0, ...overrides },
  };
}

function baseProps(
  overrides: Partial<Parameters<typeof PareamentoMassaPanel>[0]> = {},
) {
  return {
    textImeis: "",
    setTextImeis: vi.fn(),
    textIccids: "",
    setTextIccids: vi.fn(),
    minImeiMassa: 0,
    minIccidMassa: 0,
    imeisLen: 0,
    iccidsLen: 0,
    quantidadeBate: true,
    paresMassa: [],
    preview: null,
    criarNovoRastreadorMassa: false,
    setCriarNovoRastreadorMassa: vi.fn(),
    pertenceLoteRastreadorMassa: false,
    setPertenceLoteRastreadorMassa: vi.fn(),
    criarNovoSimMassa: false,
    setCriarNovoSimMassa: vi.fn(),
    pertenceLoteSimMassa: false,
    setPertenceLoteSimMassa: vi.fn(),
    loteRastreadorId: "",
    setLoteRastreadorId: vi.fn(),
    loteSimId: "",
    setLoteSimId: vi.fn(),
    loteBuscaRastreador: "",
    setLoteBuscaRastreador: vi.fn(),
    loteBuscaSim: "",
    setLoteBuscaSim: vi.fn(),
    marcaRastreadorMassa: "",
    setMarcaRastreadorMassa: vi.fn(),
    modeloRastreadorMassa: "",
    setModeloRastreadorMassa: vi.fn(),
    operadoraSimMassa: "",
    setOperadoraSimMassa: vi.fn(),
    marcaSimcardIdSimMassa: "",
    setMarcaSimcardIdSimMassa: vi.fn(),
    planoSimcardIdSimMassa: "",
    setPlanoSimcardIdSimMassa: vi.fn(),
    proprietarioMassa: "INFINITY" as const,
    setProprietarioMassa: vi.fn(),
    clienteIdMassa: null,
    setClienteIdMassa: vi.fn(),
    lotesRastreadoresFiltrados: [],
    lotesSimsFiltrados: [],
    marcasAtivas: [],
    modelosPorMarcaMassa: [],
    operadorasAtivas: [],
    marcasSimcardPorOperadoraMassa: [],
    marcasSimcard: [],
    clientes: [],
    ...overrides,
  };
}

/** Duas textareas: IMEI (placeholder 3589...) e ICCID (8955...) */
function getImeiIccidTextareas() {
  const all = screen.getAllByRole("textbox");
  expect(all).toHaveLength(2);
  const [imeiTa, iccidTa] = all;
  expect(imeiTa.getAttribute("placeholder")).toContain("358942109982341");
  expect(iccidTa.getAttribute("placeholder")).toContain("895501100000001");
  return { imeiTa, iccidTa };
}

describe("PareamentoMassaPanel", () => {
  beforeEach(() => {
    lastMassaPreview.current = null;
  });

  describe("textareas (lista)", () => {
    it("IMEI: sem o pai refletir textImeis, cada tecla chama setter só com o último caractere (armadilha de input controlado)", async () => {
      const setTextImeis = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({ setTextImeis, textImeis: "" })}
        />,
      );
      const { imeiTa } = getImeiIccidTextareas();
      await userEvent.type(imeiTa, "xy");
      expect(setTextImeis.mock.calls.map((c) => c[0])).toEqual(["x", "y"]);
    });

    it("IMEI: com pai que mantém textImeis, digitar acumula (fluxo real)", async () => {
      function Harness() {
        const [text, setText] = useState("");
        return (
          <PareamentoMassaPanel
            {...baseProps({ textImeis: text, setTextImeis: setText })}
          />
        );
      }
      render(<Harness />);
      const { imeiTa } = getImeiIccidTextareas();
      await userEvent.type(imeiTa, "ab");
      expect(imeiTa).toHaveValue("ab");
    });

    it("IMEI: change em lote (paste) envia o valor completo de uma vez", () => {
      const setTextImeis = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({ setTextImeis, textImeis: "" })}
        />,
      );
      const { imeiTa } = getImeiIccidTextareas();
      fireEvent.change(imeiTa, {
        target: { value: "111\n222\n333" },
      });
      expect(setTextImeis).toHaveBeenCalledTimes(1);
      expect(setTextImeis).toHaveBeenCalledWith("111\n222\n333");
    });

    it("ICCID: mesmo contrato — change único com várias linhas", () => {
      const setTextIccids = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({ setTextIccids, textIccids: "" })}
        />,
      );
      const { iccidTa } = getImeiIccidTextareas();
      fireEvent.change(iccidTa, { target: { value: "a;b;c" } });
      expect(setTextIccids).toHaveBeenCalledWith("a;b;c");
    });
  });

  describe("dicas de mínimo", () => {
    it("mostra avisos quando mínimos > 0", () => {
      render(
        <PareamentoMassaPanel
          {...baseProps({ minImeiMassa: 14, minIccidMassa: 18 })}
        />,
      );
      const imeiCol = screen
        .getByText("Lista de IMEIs (Rastreadores)")
        .closest("div")?.parentElement;
      const iccidCol = screen
        .getByText("Lista de ICCIDs (SIM Cards)")
        .closest("div")?.parentElement;
      expect(imeiCol).toBeTruthy();
      expect(iccidCol).toBeTruthy();
      expect(
        within(imeiCol as HTMLElement).getByText(
          (_, el) =>
            el?.tagName === "P" &&
            (el.textContent ?? "").includes("Mínimo 14 dígito(s) por IMEI"),
        ),
      ).toBeInTheDocument();
      expect(
        within(iccidCol as HTMLElement).getByText(
          (_, el) =>
            el?.tagName === "P" &&
            (el.textContent ?? "").includes("Mínimo 18 dígito(s) por ICCID"),
        ),
      ).toBeInTheDocument();
    });

    it("não renderiza parágrafos de mínimo quando ambos são 0", () => {
      render(
        <PareamentoMassaPanel
          {...baseProps({ minImeiMassa: 0, minIccidMassa: 0 })}
        />,
      );
      expect(screen.queryByText(/mínimo \d+ dígito/i)).not.toBeInTheDocument();
    });
  });

  describe("alerta quantidade IMEI × ICCID", () => {
    it("exige quantidadeBate falso E pelo menos um lado > 0", () => {
      const { rerender } = render(
        <PareamentoMassaPanel
          {...baseProps({
            quantidadeBate: false,
            imeisLen: 0,
            iccidsLen: 0,
          })}
        />,
      );
      expect(
        screen.queryByText(/quantidade não confere/i),
      ).not.toBeInTheDocument();

      rerender(
        <PareamentoMassaPanel
          {...baseProps({
            quantidadeBate: false,
            imeisLen: 2,
            iccidsLen: 1,
          })}
        />,
      );
      expect(
        screen.getByText(/quantidade não confere: 2 imeis x 1 iccids/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/faltam 1 iccid/i)).toBeInTheDocument();
    });

    it("quando há mais ICCIDs, mensagem pede IMEIs", () => {
      render(
        <PareamentoMassaPanel
          {...baseProps({
            quantidadeBate: false,
            imeisLen: 1,
            iccidsLen: 3,
          })}
        />,
      );
      expect(screen.getByText(/faltam 2 imei/i)).toBeInTheDocument();
    });

    it("quantidadeBate true nunca mostra alerta, mesmo com contagens diferentes", () => {
      render(
        <PareamentoMassaPanel
          {...baseProps({
            quantidadeBate: true,
            imeisLen: 9,
            iccidsLen: 1,
          })}
        />,
      );
      expect(
        screen.queryByText(/quantidade não confere/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("preview e resumo", () => {
    it("monta PreviewPareamentoTable e repassa o mesmo objeto preview", () => {
      const preview = basePreview();
      render(<PareamentoMassaPanel {...baseProps({ preview })} />);
      expect(
        screen.getByTestId("preview-pareamento-table"),
      ).toBeInTheDocument();
      expect(lastMassaPreview.current).toBe(preview);
    });

    it('"A Criar" = validos + exigemLote; Total de Itens usa paresMassa.length', () => {
      render(
        <PareamentoMassaPanel
          {...baseProps({
            paresMassa: [
              { imei: "1", iccid: "2" },
              { imei: "3", iccid: "4" },
            ],
            preview: basePreview({ validos: 2, exigemLote: 3, erros: 0 }),
          })}
        />,
      );
      const montagemRoot = screen
        .getByRole("heading", { name: /resumo da montagem/i })
        .closest("div")?.parentElement?.parentElement;
      expect(montagemRoot).toBeTruthy();
      const scope = montagemRoot as HTMLElement;
      expect(within(scope).getByText(/^2$/)).toBeInTheDocument();
      expect(within(scope).getByText("Pares")).toBeInTheDocument();
      expect(within(scope).getByText("+5")).toBeInTheDocument();
    });

    it("sem preview, não exibe bloco +N em A Criar", () => {
      render(
        <PareamentoMassaPanel
          {...baseProps({
            preview: null,
            paresMassa: [{ imei: "1", iccid: "2" }],
          })}
        />,
      );
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });
  });

  describe("proprietário", () => {
    it("Infinity zera cliente e seta tipo", async () => {
      const setProprietarioMassa = vi.fn();
      const setClienteIdMassa = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({
            proprietarioMassa: "CLIENTE",
            setProprietarioMassa,
            setClienteIdMassa,
          })}
        />,
      );
      const pertence = screen
        .getByText("Pertence a")
        .closest("div")?.parentElement;
      await userEvent.click(
        within(pertence as HTMLElement).getByRole("button", {
          name: /^infinity$/i,
        }),
      );
      expect(setProprietarioMassa).toHaveBeenCalledWith("INFINITY");
      expect(setClienteIdMassa).toHaveBeenCalledWith(null);
    });

    it("Cliente só altera tipo", async () => {
      const setProprietarioMassa = vi.fn();
      const setClienteIdMassa = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({
            proprietarioMassa: "INFINITY",
            clienteIdMassa: 7,
            setProprietarioMassa,
            setClienteIdMassa,
          })}
        />,
      );
      const pertence = screen
        .getByText("Pertence a")
        .closest("div")?.parentElement;
      await userEvent.click(
        within(pertence as HTMLElement).getByRole("button", {
          name: /^cliente$/i,
        }),
      );
      expect(setProprietarioMassa).toHaveBeenCalledWith("CLIENTE");
      expect(setClienteIdMassa).not.toHaveBeenCalled();
    });
  });

  describe("massa: desmarcar Criar Novo", () => {
    it("rastreador: desmarca, força pertence a lote e limpa marca/modelo/lote", async () => {
      const setPertenceLoteRastreadorMassa = vi.fn();
      const setMarcaRastreadorMassa = vi.fn();
      const setModeloRastreadorMassa = vi.fn();
      const setLoteRastreadorId = vi.fn();
      const setCriarNovoRastreadorMassa = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({
            criarNovoRastreadorMassa: true,
            setCriarNovoRastreadorMassa,
            setPertenceLoteRastreadorMassa,
            setMarcaRastreadorMassa,
            setModeloRastreadorMassa,
            setLoteRastreadorId,
            criarNovoSimMassa: false,
          })}
        />,
      );
      const criarNovoBoxes = screen.getAllByRole("checkbox", {
        name: /criar novo/i,
      });
      expect(criarNovoBoxes).toHaveLength(2);
      await userEvent.click(criarNovoBoxes[0]);
      expect(setCriarNovoRastreadorMassa.mock.calls).toEqual([[false]]);
      expect(setPertenceLoteRastreadorMassa.mock.calls).toEqual([[true]]);
      expect(setMarcaRastreadorMassa).toHaveBeenCalledWith("");
      expect(setModeloRastreadorMassa).toHaveBeenCalledWith("");
      expect(setLoteRastreadorId).toHaveBeenCalledWith("");
    });

    it("SIM: desmarca, força pertence a lote e limpa operadora/marca/plano/lote", async () => {
      const setPertenceLoteSimMassa = vi.fn();
      const setOperadoraSimMassa = vi.fn();
      const setMarcaSimcardIdSimMassa = vi.fn();
      const setPlanoSimcardIdSimMassa = vi.fn();
      const setLoteSimId = vi.fn();
      const setCriarNovoSimMassa = vi.fn();
      render(
        <PareamentoMassaPanel
          {...baseProps({
            criarNovoRastreadorMassa: false,
            criarNovoSimMassa: true,
            setCriarNovoSimMassa,
            setPertenceLoteSimMassa,
            setOperadoraSimMassa,
            setMarcaSimcardIdSimMassa,
            setPlanoSimcardIdSimMassa,
            setLoteSimId,
          })}
        />,
      );
      const criarNovoBoxes = screen.getAllByRole("checkbox", {
        name: /criar novo/i,
      });
      await userEvent.click(criarNovoBoxes[1]);
      expect(setCriarNovoSimMassa).toHaveBeenCalledWith(false);
      expect(setPertenceLoteSimMassa).toHaveBeenCalledWith(true);
      expect(setOperadoraSimMassa).toHaveBeenCalledWith("");
      expect(setMarcaSimcardIdSimMassa).toHaveBeenCalledWith("");
      expect(setPlanoSimcardIdSimMassa).toHaveBeenCalledWith("");
      expect(setLoteSimId).toHaveBeenCalledWith("");
    });
  });
});
