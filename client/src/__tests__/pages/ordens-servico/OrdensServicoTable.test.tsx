import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdensServicoTable } from "@/pages/ordens-servico/lista/components/OrdensServicoTable";
import type { OrdensServicoPaginatedResult } from "@/pages/ordens-servico/shared/ordens-servico.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

vi.mock(
  "@/pages/ordens-servico/lista/components/OrdensServicoDetalhePanel",
  () => ({
    OrdensServicoDetalhePanel: () => (
      <div data-testid="ordens-servico-detalhe-mock">detalhe</div>
    ),
  }),
);

const listaBase: OrdensServicoPaginatedResult = {
  data: [
    {
      id: 1,
      numero: 10,
      tipo: "INSTALACAO",
      status: "AGENDADO",
      cliente: { id: 1, nome: "A" },
      criadoEm: "2024-01-01T10:00:00.000Z",
    },
    {
      id: 2,
      numero: 20,
      tipo: "INSTALACAO",
      status: "EM_TESTES",
      cliente: { id: 2, nome: "B" },
      criadoEm: "2024-01-02T10:00:00.000Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 15,
  totalPages: 1,
};

describe("OrdensServicoTable", () => {
  it("estado vazio", () => {
    render(
      <OrdensServicoTable
        lista={{ ...listaBase, data: [], total: 0 }}
        loadingLista={false}
        page={1}
        setPage={vi.fn()}
        expandedOsId={null}
        setExpandedOsId={vi.fn()}
        osDetalhe={undefined}
        loadingDetalhe={false}
        navigate={vi.fn()}
        downloadingPdf={false}
        onDownloadPdf={vi.fn()}
        updateStatusPending={false}
        canEditOs
        onOpenConfirmIniciar={vi.fn()}
        onOpenRetiradaModal={vi.fn()}
        onEnviarParaCadastro={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-table-empty"),
    ).toBeInTheDocument();
  });

  it("loading lista", () => {
    render(
      <OrdensServicoTable
        lista={undefined}
        loadingLista
        page={1}
        setPage={vi.fn()}
        expandedOsId={null}
        setExpandedOsId={vi.fn()}
        osDetalhe={undefined}
        loadingDetalhe={false}
        navigate={vi.fn()}
        downloadingPdf={false}
        onDownloadPdf={vi.fn()}
        updateStatusPending={false}
        canEditOs
        onOpenConfirmIniciar={vi.fn()}
        onOpenRetiradaModal={vi.fn()}
        onEnviarParaCadastro={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("ordens-servico-table-loading"),
    ).toBeInTheDocument();
  });

  it("expande linha e mostra mock de detalhe", async () => {
    const user = userEvent.setup();
    const setExp = vi.fn();
    render(
      <OrdensServicoTable
        lista={listaBase}
        loadingLista={false}
        page={1}
        setPage={vi.fn()}
        expandedOsId={1}
        setExpandedOsId={setExp}
        osDetalhe={undefined}
        loadingDetalhe={false}
        navigate={vi.fn()}
        downloadingPdf={false}
        onDownloadPdf={vi.fn()}
        updateStatusPending={false}
        canEditOs
        onOpenConfirmIniciar={vi.fn()}
        onOpenRetiradaModal={vi.fn()}
        onEnviarParaCadastro={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ordens-servico-expanded-1")).toBeInTheDocument();
    expect(
      screen.getByTestId("ordens-servico-detalhe-mock"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("ordens-servico-row-1"));
    expect(setExp).toHaveBeenCalledWith(null);
  });

  it("EM_TESTES: menu pode acionar PDF e navegação", async () => {
    const user = userEvent.setup();
    const nav = vi.fn();
    const pdf = vi.fn();
    render(
      <OrdensServicoTable
        lista={listaBase}
        loadingLista={false}
        page={1}
        setPage={vi.fn()}
        expandedOsId={null}
        setExpandedOsId={vi.fn()}
        osDetalhe={undefined}
        loadingDetalhe={false}
        navigate={nav}
        downloadingPdf={false}
        onDownloadPdf={pdf}
        updateStatusPending={false}
        canEditOs
        onOpenConfirmIniciar={vi.fn()}
        onOpenRetiradaModal={vi.fn()}
        onEnviarParaCadastro={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("ordens-servico-acoes-2"));
    await user.click(screen.getByText("Ir para Testes"));
    expect(nav).toHaveBeenCalledWith("/testes?osId=2");
    await user.click(screen.getByTestId("ordens-servico-acoes-2"));
    await user.click(screen.getByTestId("ordens-servico-pdf-2"));
    expect(pdf).toHaveBeenCalledWith(2);
  });

  it("edge: paginação desabilita anterior na primeira página", () => {
    const setPage = vi.fn();
    render(
      <OrdensServicoTable
        lista={listaBase}
        loadingLista={false}
        page={1}
        setPage={setPage}
        expandedOsId={null}
        setExpandedOsId={vi.fn()}
        osDetalhe={undefined}
        loadingDetalhe={false}
        navigate={vi.fn()}
        downloadingPdf={false}
        onDownloadPdf={vi.fn()}
        updateStatusPending={false}
        canEditOs
        onOpenConfirmIniciar={vi.fn()}
        onOpenRetiradaModal={vi.fn()}
        onEnviarParaCadastro={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ordens-servico-page-prev")).toBeDisabled();
    expect(screen.getByTestId("ordens-servico-page-next")).toBeDisabled();
  });

  it("edge: muda de página", async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    const lista: OrdensServicoPaginatedResult = {
      ...listaBase,
      totalPages: 3,
      page: 2,
    };
    render(
      <OrdensServicoTable
        lista={lista}
        loadingLista={false}
        page={2}
        setPage={setPage}
        expandedOsId={null}
        setExpandedOsId={vi.fn()}
        osDetalhe={undefined}
        loadingDetalhe={false}
        navigate={vi.fn()}
        downloadingPdf={false}
        onDownloadPdf={vi.fn()}
        updateStatusPending={false}
        canEditOs
        onOpenConfirmIniciar={vi.fn()}
        onOpenRetiradaModal={vi.fn()}
        onEnviarParaCadastro={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("ordens-servico-page-next"));
    expect(setPage).toHaveBeenCalled();
  });
});
