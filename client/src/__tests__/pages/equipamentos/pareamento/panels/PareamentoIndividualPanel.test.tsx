import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PareamentoIndividualPanel } from "@/pages/equipamentos/pareamento/panels/PareamentoIndividualPanel";
import type { PreviewResult } from "@/pages/equipamentos/pareamento/preview/PreviewPareamentoTable";

vi.mock("@/pages/equipamentos/pareamento/components/PareamentoCriarRastreadorBlock", () => ({
  PareamentoCriarRastreadorBlock: () => (
    <div data-testid="mock-rastreador-block" />
  ),
}));

vi.mock("@/pages/equipamentos/pareamento/components/PareamentoCriarSimBlock", () => ({
  PareamentoCriarSimBlock: () => <div data-testid="mock-sim-block" />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

function basePreview(overrides: Partial<PreviewResult["linhas"][0]> = {}): PreviewResult {
  return {
    linhas: [
      {
        imei: "358942109982341",
        iccid: "895501100000001",
        tracker_status: "NEEDS_CREATE",
        sim_status: "NEEDS_CREATE",
        action_needed: "OK",
        ...overrides,
      },
    ],
    contadores: { validos: 0, exigemLote: 0, erros: 0 },
  };
}

function baseProps(
  overrides: Partial<Parameters<typeof PareamentoIndividualPanel>[0]> = {},
) {
  return {
    imeiIndividual: "",
    setImeiIndividual: vi.fn(),
    iccidIndividual: "",
    setIccidIndividual: vi.fn(),
    criarNovoRastreador: false,
    setCriarNovoRastreador: vi.fn(),
    pertenceLoteRastreador: false,
    setPertenceLoteRastreador: vi.fn(),
    loteRastreadorId: "",
    setLoteRastreadorId: vi.fn(),
    loteBuscaRastreador: "",
    setLoteBuscaRastreador: vi.fn(),
    marcaRastreador: "",
    setMarcaRastreador: vi.fn(),
    modeloRastreador: "",
    setModeloRastreador: vi.fn(),
    criarNovoSim: false,
    setCriarNovoSim: vi.fn(),
    pertenceLoteSim: false,
    setPertenceLoteSim: vi.fn(),
    loteSimId: "",
    setLoteSimId: vi.fn(),
    loteBuscaSim: "",
    setLoteBuscaSim: vi.fn(),
    operadoraSim: "",
    setOperadoraSim: vi.fn(),
    marcaSimcardIdSim: "",
    setMarcaSimcardIdSim: vi.fn(),
    planoSimcardIdSim: "",
    setPlanoSimcardIdSim: vi.fn(),
    proprietarioIndividual: "INFINITY" as const,
    setProprietarioIndividual: vi.fn(),
    clienteIdIndividual: null,
    setClienteIdIndividual: vi.fn(),
    preview: null,
    quantidadeCriada: 0,
    podeConfirmarIndividual: false,
    podeConfirmarPareamentoIndividual: false,
    progressoVinculoIndividual: 0,
    minImeiIndividual: 14,
    minIccidIndividual: 18,
    lotesRastreadoresFiltrados: [],
    lotesSimsFiltrados: [],
    marcasAtivas: [],
    modelosPorMarca: [],
    operadorasAtivas: [],
    marcasSimcardPorOperadora: [],
    marcasSimcard: [],
    clientes: [],
    ...overrides,
  };
}

/** Card escuro "Resumo da Configuração" */
function getResumoPanel(container: HTMLElement) {
  const heading = screen.getByRole("heading", { name: /resumo da configuração/i });
  return heading.closest("div")?.parentElement?.parentElement as HTMLElement;
}

describe("PareamentoIndividualPanel", () => {
  describe("campos IMEI / ICCID", () => {
    it("com pai que aplica cada mudança, digitar acumula IMEI (fluxo controlado real)", async () => {
      function Harness() {
        const [imei, setImei] = useState("");
        return (
          <PareamentoIndividualPanel
            {...baseProps({
              imeiIndividual: imei,
              setImeiIndividual: setImei,
            })}
          />
        );
      }
      render(<Harness />);
      const imeiInput = screen.getByPlaceholderText("Ex: 358942109982341");
      await userEvent.type(imeiInput, "12");
      expect(imeiInput).toHaveValue("12");
    });

    it("aceita apagar e substituir via último valor emitido", async () => {
      const setIccidIndividual = vi.fn();
      const { rerender } = render(
        <PareamentoIndividualPanel
          {...baseProps({
            setIccidIndividual,
            iccidIndividual: "",
          })}
        />,
      );
      const iccidInput = screen.getByPlaceholderText("Ex: 895501100000001");
      await userEvent.type(iccidInput, "abc");
      rerender(
        <PareamentoIndividualPanel
          {...baseProps({
            setIccidIndividual,
            iccidIndividual: "ab",
          })}
        />,
      );
      expect(iccidInput).toHaveValue("ab");
    });
  });

  describe("Pertence a (Infinity / Cliente)", () => {
    it("Infinity: setProprietarioIndividual + zera cliente", async () => {
      const setProprietarioIndividual = vi.fn();
      const setClienteIdIndividual = vi.fn();
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            proprietarioIndividual: "CLIENTE",
            setProprietarioIndividual,
            setClienteIdIndividual,
          })}
        />,
      );
      const pertenceCard = screen.getByText("Pertence a").closest("div")?.parentElement;
      await userEvent.click(
        within(pertenceCard as HTMLElement).getByRole("button", { name: /^infinity$/i }),
      );
      expect(setProprietarioIndividual).toHaveBeenCalledWith("INFINITY");
      expect(setClienteIdIndividual).toHaveBeenCalledWith(null);
    });

    it("Cliente: só altera tipo — não zera clienteId sozinho", async () => {
      const setProprietarioIndividual = vi.fn();
      const setClienteIdIndividual = vi.fn();
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            proprietarioIndividual: "INFINITY",
            clienteIdIndividual: 5,
            setProprietarioIndividual,
            setClienteIdIndividual,
          })}
        />,
      );
      const pertenceCard = screen.getByText("Pertence a").closest("div")?.parentElement;
      await userEvent.click(
        within(pertenceCard as HTMLElement).getByRole("button", { name: /^cliente$/i }),
      );
      expect(setProprietarioIndividual).toHaveBeenCalledWith("CLIENTE");
      expect(setClienteIdIndividual).not.toHaveBeenCalled();
    });
  });

  describe("preview disponível (marca/modelo/operadora)", () => {
    it("FOUND_AVAILABLE rastreador: exibe marca e modelo; null vira --", () => {
      const { rerender } = render(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: basePreview({
              tracker_status: "FOUND_AVAILABLE",
              marca: "Marca X",
              modelo: "Mod Y",
            }),
          })}
        />,
      );
      expect(screen.getByText("Marca X")).toBeInTheDocument();
      expect(screen.getByText("Mod Y")).toBeInTheDocument();

      rerender(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: basePreview({
              tracker_status: "FOUND_AVAILABLE",
              marca: undefined,
              modelo: undefined,
            }),
          })}
        />,
      );
      const marcas = screen.getAllByText("--");
      expect(marcas.length).toBeGreaterThanOrEqual(2);
    });

    it("não exibe bloco de marca/modelo quando tracker não está FOUND_AVAILABLE", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: basePreview({
              tracker_status: "NEEDS_CREATE",
              marca: "Ignorada",
            }),
          })}
        />,
      );
      expect(screen.queryByText("Ignorada")).not.toBeInTheDocument();
    });

    it("FOUND_AVAILABLE SIM: exibe operadora; null vira --", () => {
      const { rerender } = render(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: basePreview({
              sim_status: "FOUND_AVAILABLE",
              operadora: "Op Z",
            }),
          })}
        />,
      );
      expect(screen.getByText("Op Z")).toBeInTheDocument();

      rerender(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: basePreview({
              sim_status: "FOUND_AVAILABLE",
              operadora: undefined,
            }),
          })}
        />,
      );
      expect(screen.getAllByText("--").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("visualização da unidade lógica (trim)", () => {
    it("espaços só: mostra aguardando; com dígitos mostra trim no resumo", () => {
      const { rerender } = render(
        <PareamentoIndividualPanel
          {...baseProps({
            imeiIndividual: "   ",
            iccidIndividual: "\t",
          })}
        />,
      );
      expect(screen.getByText("Aguardando IMEI")).toBeInTheDocument();
      expect(screen.getByText("Aguardando ICCID")).toBeInTheDocument();

      rerender(
        <PareamentoIndividualPanel
          {...baseProps({
            imeiIndividual: "  3589  ",
            iccidIndividual: " 89 ",
          })}
        />,
      );
      const resumo = getResumoPanel(document.body);
      expect(within(resumo).getByText("3589")).toBeInTheDocument();
      expect(within(resumo).getByText("89")).toBeInTheDocument();
    });
  });

  describe("resumo: badge de estado", () => {
    it("PRONTO quando podeConfirmarPareamentoIndividual", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({ podeConfirmarPareamentoIndividual: true })}
        />,
      );
      expect(screen.getByText("PRONTO")).toBeInTheDocument();
    });

    it("CONFIGURE quando há preview e exigemLote > 0", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: {
              linhas: [],
              contadores: { validos: 0, exigemLote: 2, erros: 0 },
            },
          })}
        />,
      );
      expect(screen.getByText("CONFIGURE")).toBeInTheDocument();
    });

    it("ERRO quando há preview, sem exigemLote e com falha (ex.: erros)", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            preview: {
              linhas: [],
              contadores: { validos: 0, exigemLote: 0, erros: 1 },
            },
          })}
        />,
      );
      expect(screen.getByText("ERRO")).toBeInTheDocument();
    });

    it("RASCUNHO sem preview e sem confirmação", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({ preview: null, podeConfirmarPareamentoIndividual: false })}
        />,
      );
      expect(screen.getByText("RASCUNHO")).toBeInTheDocument();
    });
  });

  describe("barra de progresso do vínculo", () => {
    it("100% quando completo; caso contrário usa progressoVinculoIndividual", () => {
      const { container, rerender } = render(
        <PareamentoIndividualPanel
          {...baseProps({
            podeConfirmarPareamentoIndividual: true,
            progressoVinculoIndividual: 12,
          })}
        />,
      );
      let fill = container.querySelector(".h-full.bg-erp-blue") as HTMLElement;
      expect(fill).toHaveStyle({ width: "100%" });

      rerender(
        <PareamentoIndividualPanel
          {...baseProps({
            podeConfirmarPareamentoIndividual: false,
            progressoVinculoIndividual: 37,
          })}
        />,
      );
      fill = container.querySelector(".h-full.bg-erp-blue") as HTMLElement;
      expect(fill).toHaveStyle({ width: "37%" });
    });
  });

  describe("mensagens de validação (sidebar)", () => {
    it("com dígitos insuficientes mostra textos de mínimo; min 0 cai em 'Informe'", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            imeiIndividual: "1",
            iccidIndividual: "2",
            podeConfirmarPareamentoIndividual: false,
            podeConfirmarIndividual: false,
            minImeiIndividual: 14,
            minIccidIndividual: 18,
          })}
        />,
      );
      expect(
        screen.getByText(/imei deve ter ao menos 14 dígito/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/iccid deve ter ao menos 18 dígito/i),
      ).toBeInTheDocument();
    });

    it("min 0: mensagem genérica 'Informe o IMEI' / 'Informe o ICCID' (ainda exige algum dígito para mostrar o aviso)", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            imeiIndividual: "1",
            iccidIndividual: "2",
            podeConfirmarPareamentoIndividual: false,
            podeConfirmarIndividual: false,
            minImeiIndividual: 0,
            minIccidIndividual: 0,
          })}
        />,
      );
      expect(screen.getByText(/informe o imei/i)).toBeInTheDocument();
      expect(screen.getByText(/informe o iccid/i)).toBeInTheDocument();
    });

    it("não mostra aviso de tamanho quando já pode confirmar individual", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            imeiIndividual: "1",
            podeConfirmarPareamentoIndividual: false,
            podeConfirmarIndividual: true,
            preview: null,
          })}
        />,
      );
      expect(screen.queryByText(/imei deve ter ao menos/i)).not.toBeInTheDocument();
      expect(screen.getByText("Verificando...")).toBeInTheDocument();
    });

    it("podeConfirmarIndividual + preview: exigemLote pede lotes/dados", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            podeConfirmarIndividual: true,
            podeConfirmarPareamentoIndividual: false,
            preview: {
              linhas: [basePreview().linhas[0]],
              contadores: { validos: 0, exigemLote: 1, erros: 0 },
            },
          })}
        />,
      );
      expect(
        screen.getByText(/selecione os lotes ou informe marca\/modelo/i),
      ).toBeInTheDocument();
    });

    it("podeConfirmarIndividual + erros: mostra chips de formato inválido / já vinculado", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            podeConfirmarIndividual: true,
            podeConfirmarPareamentoIndividual: false,
            preview: {
              linhas: [
                {
                  imei: "bad",
                  iccid: "bad",
                  tracker_status: "INVALID_FORMAT",
                  sim_status: "FOUND_ALREADY_LINKED",
                  action_needed: "FIX_ERROR",
                },
              ],
              contadores: { validos: 0, exigemLote: 0, erros: 2 },
            },
          })}
        />,
      );
      expect(screen.getByText(/corrija os erros abaixo/i)).toBeInTheDocument();
      expect(
        screen.getByText(/rastreador: formato inválido/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/sim: em uso/i)).toBeInTheDocument();
    });

    it("preview ok mas ainda não pareamento: pede para clicar em Verificar", () => {
      render(
        <PareamentoIndividualPanel
          {...baseProps({
            podeConfirmarIndividual: true,
            podeConfirmarPareamentoIndividual: false,
            preview: {
              linhas: [basePreview().linhas[0]],
              contadores: { validos: 1, exigemLote: 0, erros: 0 },
            },
          })}
        />,
      );
      expect(
        screen.getByText(/clique em verificar para validar os dados/i),
      ).toBeInTheDocument();
    });
  });

  describe("sessão", () => {
    it("banner de equipamentos criados só aparece quando quantidadeCriada > 0", () => {
      const { rerender } = render(
        <PareamentoIndividualPanel {...baseProps({ quantidadeCriada: 0 })} />,
      );
      expect(
        screen.queryByText(/equipamento\(s\) criado\(s\) nesta sessão/i),
      ).not.toBeInTheDocument();

      rerender(<PareamentoIndividualPanel {...baseProps({ quantidadeCriada: 3 })} />);
      expect(
        screen.getByText("3 equipamento(s) criado(s) nesta sessão"),
      ).toBeInTheDocument();
    });
  });
});
