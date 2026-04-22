import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdensServicoDetalhePanel } from "@/pages/ordens-servico/lista/components/OrdensServicoDetalhePanel";
import type { OrdemServicoDetalhe } from "@/pages/ordens-servico/shared/ordens-servico.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function base(
  overrides: Partial<OrdemServicoDetalhe> = {},
): OrdemServicoDetalhe {
  return {
    id: 42,
    numero: 99,
    tipo: "INSTALACAO",
    status: "AGENDADO",
    observacoes: null,
    criadoEm: "2024-01-01T10:00:00.000Z",
    cliente: { id: 1, nome: "C" },
    ...overrides,
  };
}

const noop = () => {};

describe("OrdensServicoDetalhePanel", () => {
  it("mostra loading", () => {
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={undefined}
        loadingDetalhe
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    expect(screen.getByTestId("ordens-servico-detalhe-loading")).toBeInTheDocument();
  });

  it("edge: não renderiza painel quando linha não está expandida", () => {
    const { container } = render(
      <OrdensServicoDetalhePanel
        osDetalhe={base()}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={99}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("edge: dados stale (id diferente da linha) mostra loading", () => {
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({ id: 1 })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    expect(screen.getByTestId("ordens-servico-detalhe-loading")).toBeInTheDocument();
  });

  it("AGENDADO não-RETIRADA: botão iniciar testes", async () => {
    const user = userEvent.setup();
    const onIniciar = vi.fn();
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({ tipo: "INSTALACAO", status: "AGENDADO" })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={onIniciar}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    await user.click(screen.getByTestId("ordens-servico-btn-iniciar-testes"));
    expect(onIniciar).toHaveBeenCalledTimes(1);
  });

  it("edge: sem permissão desabilita iniciar testes", () => {
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({ status: "AGENDADO" })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs={false}
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    expect(screen.getByTestId("ordens-servico-btn-iniciar-testes")).toBeDisabled();
  });

  it("RETIRADA AGENDADA: retirada realizada", async () => {
    const user = userEvent.setup();
    const onRet = vi.fn();
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({
          tipo: "RETIRADA",
          status: "AGENDADO",
          idAparelho: "IMEI-X",
        })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={onRet}
        onEnviarParaCadastro={noop}
      />,
    );
    const ret = screen.getByTestId("ordens-servico-detalhe-retirada-agendada");
    expect(ret).toBeInTheDocument();
    expect(within(ret).getByText("IMEI-X")).toBeInTheDocument();
    await user.click(screen.getByTestId("ordens-servico-btn-retirada-realizada"));
    expect(onRet).toHaveBeenCalled();
  });

  it("RETIRADA AGUARDANDO_CADASTRO: exibe dados parseados", () => {
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({
          tipo: "RETIRADA",
          status: "AGUARDANDO_CADASTRO",
          historico: [
            {
              statusAnterior: "AGENDADO",
              statusNovo: "AGUARDANDO_CADASTRO",
              criadoEm: "2024-01-02T10:00:00.000Z",
              observacao:
                "Data retirada: 10/04/2024 | Aparelho encontrado: Não",
            },
          ],
        })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    const block = screen.getByTestId("ordens-servico-detalhe-retirada-concluida");
    expect(block).toBeInTheDocument();
    expect(within(block).getByText("10/04/2024")).toBeInTheDocument();
    expect(within(block).getByText("Não")).toBeInTheDocument();
  });

  it("TESTES_REALIZADOS: enviar cadastro", async () => {
    const user = userEvent.setup();
    const onEnv = vi.fn();
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({ status: "TESTES_REALIZADOS" })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={onEnv}
      />,
    );
    await user.click(screen.getByTestId("ordens-servico-btn-enviar-cadastro"));
    expect(onEnv).toHaveBeenCalled();
  });

  it("AGUARDANDO_CADASTRO: bloco de cadastro", () => {
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({
          status: "AGUARDANDO_CADASTRO",
          plataforma: "X",
          statusCadastro: "CONCLUIDO",
          historico: [
            {
              statusAnterior: "TESTES_REALIZADOS",
              statusNovo: "AGUARDANDO_CADASTRO",
              criadoEm: "2024-03-01T12:00:00.000Z",
            },
          ],
        })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-detalhe-cadastro-info"),
    ).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("Concluído")).toBeInTheDocument();
  });

  it("edge: status desconhecido na coluna testes mostra não iniciados", () => {
    render(
      <OrdensServicoDetalhePanel
        osDetalhe={base({ status: "CANCELADO" })}
        loadingDetalhe={false}
        rowOsId={42}
        expandedOsId={42}
        canEditOs
        updateStatusPending={false}
        onOpenConfirmIniciar={noop}
        onOpenRetiradaModal={noop}
        onEnviarParaCadastro={noop}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-detalhe-testes-nao-iniciados"),
    ).toBeInTheDocument();
  });
});
