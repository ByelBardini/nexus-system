import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdensServicoPipelineStrip } from "@/pages/ordens-servico/lista/components/OrdensServicoPipelineStrip";
import type { OrdensServicoResumo } from "@/pages/ordens-servico/shared/ordens-servico.types";

const resumo: OrdensServicoResumo = {
  agendado: 1,
  emTestes: 2,
  testesRealizados: 3,
  aguardandoCadastro: 4,
  finalizado: 5,
};

describe("OrdensServicoPipelineStrip", () => {
  it("renderiza estágios e total agregado", () => {
    const onClick = vi.fn();
    render(
      <OrdensServicoPipelineStrip
        statusFilter="TODOS"
        resumo={resumo}
        onStatusClick={onClick}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-pipeline-strip"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("ordens-servico-pipeline-TODOS"),
    ).toHaveTextContent("15");
    expect(
      screen.getByTestId("ordens-servico-pipeline-AGENDADO"),
    ).toHaveTextContent("1");
    expect(
      screen.getByTestId("ordens-servico-pipeline-FINALIZADO"),
    ).toHaveTextContent("5");
  });

  it("chama onStatusClick com filtro correto", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <OrdensServicoPipelineStrip
        statusFilter="TODOS"
        resumo={resumo}
        onStatusClick={onClick}
      />,
    );
    await user.click(screen.getByTestId("ordens-servico-pipeline-EM_TESTES"));
    expect(onClick).toHaveBeenCalledWith("EM_TESTES");
  });

  it("edge: resumo undefined — contagens zero exceto total", () => {
    const onClick = vi.fn();
    render(
      <OrdensServicoPipelineStrip
        statusFilter="AGENDADO"
        resumo={undefined}
        onStatusClick={onClick}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-pipeline-TODOS"),
    ).toHaveTextContent("0");
    expect(
      screen.getByTestId("ordens-servico-pipeline-AGENDADO"),
    ).toHaveTextContent("0");
  });
});
