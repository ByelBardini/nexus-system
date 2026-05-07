import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StatusAparelho } from "@/lib/aparelho-status";
import { AparelhosStatusPipeline } from "@/pages/aparelhos/lista/AparelhosStatusPipeline";

/** Botão com filtro ativo recebe borda superior/inferior grossa (estado “selecionado”). */
function hasActivePipelineSelection(className: string): boolean {
  return /\bborder-t-2\b/.test(className) && /\bborder-b-2\b/.test(className);
}

const DEFAULT_COUNTS: Record<StatusAparelho, number> = {
  EM_ESTOQUE: 3,
  CONFIGURADO: 1,
  DESPACHADO: 0,
  COM_TECNICO: 2,
  INSTALADO: 5,
};

/**
 * Enter e espaço ativam `<button>` no navegador.
 * Usamos o caractere espaço literal: `{Space}` do user-event não dispara clique em jsdom aqui.
 */
const ACTIVATION_KEYS = [
  { key: "{Enter}", label: "Enter" },
  { key: " ", label: "Espaço" },
] as const;

const PIPELINE_SEGMENTS: Array<{
  testId: string;
  expectedClickArg: StatusAparelho | "TODOS";
  label: string;
  /** Trecho do className que identifica o destaque quando este segmento está filtrado */
  activeTopBorderToken: string;
}> = [
  {
    testId: "aparelhos-status-total",
    expectedClickArg: "TODOS",
    label: "Total",
    activeTopBorderToken: "border-t-blue-500",
  },
  {
    testId: "aparelhos-status-em_estoque",
    expectedClickArg: "EM_ESTOQUE",
    label: "Em Estoque",
    activeTopBorderToken: "border-t-yellow-500",
  },
  {
    testId: "aparelhos-status-configurado",
    expectedClickArg: "CONFIGURADO",
    label: "Configurado",
    activeTopBorderToken: "border-t-blue-500",
  },
  {
    testId: "aparelhos-status-despachado",
    expectedClickArg: "DESPACHADO",
    label: "Despachado",
    activeTopBorderToken: "border-t-purple-500",
  },
  {
    testId: "aparelhos-status-com_tecnico",
    expectedClickArg: "COM_TECNICO",
    label: "Com Técnico",
    activeTopBorderToken: "border-t-orange-500",
  },
  {
    testId: "aparelhos-status-instalado",
    expectedClickArg: "INSTALADO",
    label: "Instalado",
    activeTopBorderToken: "border-t-emerald-500",
  },
];

describe("AparelhosStatusPipeline", () => {
  it("estrutura: um botão por segmento, todos type=button (não submetem formulário acidentalmente)", () => {
    render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={DEFAULT_COUNTS}
        totalCount={11}
        onStatusClick={vi.fn()}
      />,
    );

    const root = screen.getByTestId("aparelhos-status-pipeline");
    const buttons = within(root).getAllByRole("button");
    expect(buttons).toHaveLength(PIPELINE_SEGMENTS.length);

    for (const btn of buttons) {
      expect(btn).toHaveAttribute("type", "button");
    }
  });

  it.each(PIPELINE_SEGMENTS)(
    "clique com mouse chama onStatusClick apenas com $expectedClickArg",
    async ({ testId, expectedClickArg }) => {
      const user = userEvent.setup();
      const onStatusClick = vi.fn();

      render(
        <AparelhosStatusPipeline
          statusFilter="CONFIGURADO"
          statusCounts={DEFAULT_COUNTS}
          totalCount={11}
          onStatusClick={onStatusClick}
        />,
      );

      await user.click(screen.getByTestId(testId));

      expect(onStatusClick).toHaveBeenCalledTimes(1);
      expect(onStatusClick).toHaveBeenCalledWith(expectedClickArg);
    },
  );

  it.each(
    PIPELINE_SEGMENTS.flatMap((seg) =>
      ACTIVATION_KEYS.map((ak) => ({
        ...seg,
        activationKey: ak.key,
        activationLabel: ak.label,
      })),
    ),
  )(
    "teclado: com foco, $activationLabel dispara onStatusClick com $expectedClickArg",
    async ({ testId, expectedClickArg, activationKey }) => {
      const user = userEvent.setup();
      const onStatusClick = vi.fn();

      render(
        <AparelhosStatusPipeline
          statusFilter="TODOS"
          statusCounts={DEFAULT_COUNTS}
          totalCount={11}
          onStatusClick={onStatusClick}
        />,
      );

      const btn = screen.getByTestId(testId);
      btn.focus();
      expect(btn).toHaveFocus();

      await user.keyboard(activationKey);

      expect(onStatusClick).toHaveBeenCalledTimes(1);
      expect(onStatusClick).toHaveBeenCalledWith(expectedClickArg);
    },
  );

  it.each(PIPELINE_SEGMENTS)(
    "exatamente um segmento com destaque de seleção quando filtro é $expectedClickArg",
    ({ testId, expectedClickArg, activeTopBorderToken }) => {
      render(
        <AparelhosStatusPipeline
          statusFilter={expectedClickArg}
          statusCounts={DEFAULT_COUNTS}
          totalCount={11}
          onStatusClick={vi.fn()}
        />,
      );

      const root = screen.getByTestId("aparelhos-status-pipeline");
      const buttons = within(root).getAllByRole("button");

      const highlighted = buttons.filter((b) =>
        hasActivePipelineSelection(b.className),
      );
      expect(highlighted).toHaveLength(1);

      const active = screen.getByTestId(testId);
      expect(highlighted[0]).toBe(active);
      expect(active.className).toContain(activeTopBorderToken);

      const inactive = buttons.filter((b) => b !== active);
      for (const btn of inactive) {
        expect(
          hasActivePipelineSelection(btn.className),
          `esperado sem seleção: ${btn.getAttribute("data-testid")}`,
        ).toBe(false);
      }
    },
  );

  it("exibe totalCount e cada contagem de status de forma independente (total pode divergir da soma — ex.: cache/API)", () => {
    const counts: Record<StatusAparelho, number> = {
      EM_ESTOQUE: 10,
      CONFIGURADO: 5,
      DESPACHADO: 2,
      COM_TECNICO: 1,
      INSTALADO: 7,
    };
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    const totalCount = 999;

    expect(sum).not.toBe(totalCount);

    render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={counts}
        totalCount={totalCount}
        onStatusClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("aparelhos-status-total")).toHaveTextContent(
      String(totalCount),
    );
    expect(screen.getByTestId("aparelhos-status-em_estoque")).toHaveTextContent(
      "10",
    );
    expect(screen.getByTestId("aparelhos-status-instalado")).toHaveTextContent(
      "7",
    );
  });

  it("atualiza números após re-render com novas props (pai mudou dados)", () => {
    const { rerender } = render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={DEFAULT_COUNTS}
        totalCount={11}
        onStatusClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("aparelhos-status-total")).toHaveTextContent(
      "11",
    );
    expect(screen.getByTestId("aparelhos-status-despachado")).toHaveTextContent(
      "0",
    );

    const next: Record<StatusAparelho, number> = {
      ...DEFAULT_COUNTS,
      DESPACHADO: 42,
    };

    rerender(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={next}
        totalCount={100}
        onStatusClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("aparelhos-status-total")).toHaveTextContent(
      "100",
    );
    expect(screen.getByTestId("aparelhos-status-despachado")).toHaveTextContent(
      "42",
    );
  });

  it("edge: contagens zero em todos os status ainda renderiza rótulos e 0 em cada coluna", () => {
    const zero: Record<StatusAparelho, number> = {
      EM_ESTOQUE: 0,
      CONFIGURADO: 0,
      DESPACHADO: 0,
      COM_TECNICO: 0,
      INSTALADO: 0,
    };

    render(
      <AparelhosStatusPipeline
        statusFilter="INSTALADO"
        statusCounts={zero}
        totalCount={0}
        onStatusClick={vi.fn()}
      />,
    );

    for (const seg of PIPELINE_SEGMENTS) {
      if (seg.expectedClickArg === "TODOS") continue;
      const col = screen.getByTestId(seg.testId);
      expect(col).toHaveTextContent(seg.label);
      expect(col).toHaveTextContent("0");
    }
    expect(screen.getByTestId("aparelhos-status-total")).toHaveTextContent("0");
  });

  it("edge: valores grandes são exibidos como número bruto (sem locale)", () => {
    const big: Record<StatusAparelho, number> = {
      EM_ESTOQUE: 1_234_567,
      CONFIGURADO: 0,
      DESPACHADO: 0,
      COM_TECNICO: 0,
      INSTALADO: 0,
    };

    render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={big}
        totalCount={9_876_543}
        onStatusClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("aparelhos-status-total")).toHaveTextContent(
      "9876543",
    );
    expect(screen.getByTestId("aparelhos-status-em_estoque")).toHaveTextContent(
      "1234567",
    );
  });

  it("cliques repetidos no mesmo segmento chamam o callback de novo (componente não deduplica)", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();

    render(
      <AparelhosStatusPipeline
        statusFilter="TODOS"
        statusCounts={DEFAULT_COUNTS}
        totalCount={11}
        onStatusClick={onStatusClick}
      />,
    );

    const btn = screen.getByTestId("aparelhos-status-em_estoque");
    await user.click(btn);
    await user.click(btn);

    expect(onStatusClick).toHaveBeenCalledTimes(2);
    expect(onStatusClick).toHaveBeenNthCalledWith(1, "EM_ESTOQUE");
    expect(onStatusClick).toHaveBeenNthCalledWith(2, "EM_ESTOQUE");
  });
});
