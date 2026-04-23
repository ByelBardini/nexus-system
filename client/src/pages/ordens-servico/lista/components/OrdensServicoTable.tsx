import { Fragment, type Dispatch, type SetStateAction } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatarDataHoraCurta, formatId, TIPO_OS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  ORDENS_SERVICO_STATUS_COLORS,
  ORDENS_SERVICO_STATUS_LABELS,
} from "../../shared/ordens-servico.constants";
import type {
  OrdemServicoDetalhe,
  OrdemServicoListItem,
  OrdensServicoPaginatedResult,
} from "../../shared/ordens-servico.types";
import { OrdensServicoDetalhePanel } from "./OrdensServicoDetalhePanel";

type NavigateFn = (to: string) => void;

export type OrdensServicoTableProps = {
  lista: OrdensServicoPaginatedResult | undefined;
  loadingLista: boolean;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  expandedOsId: number | null;
  setExpandedOsId: (id: number | null) => void;
  osDetalhe: OrdemServicoDetalhe | undefined;
  loadingDetalhe: boolean;
  navigate: NavigateFn;
  downloadingPdf: boolean;
  onDownloadPdf: (id: number) => void;
  updateStatusPending: boolean;
  canEditOs: boolean;
  onOpenConfirmIniciar: (id: number) => void;
  onOpenRetiradaModal: (id: number) => void;
  onEnviarParaCadastro: (id: number) => void;
};

export function OrdensServicoTable({
  lista,
  loadingLista,
  page,
  setPage,
  expandedOsId,
  setExpandedOsId,
  osDetalhe,
  loadingDetalhe,
  navigate,
  downloadingPdf,
  onDownloadPdf,
  updateStatusPending,
  canEditOs,
  onOpenConfirmIniciar,
  onOpenRetiradaModal,
  onEnviarParaCadastro,
}: OrdensServicoTableProps) {
  return (
    <div
      className="bg-white border border-slate-300 shadow-sm overflow-hidden"
      data-testid="ordens-servico-table-wrap"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse erp-table font-condensed">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>OS #</th>
              <th>Cliente</th>
              <th>Subcliente</th>
              <th>Placa</th>
              <th>Técnico</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Última Mov.</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-medium uppercase tracking-tight">
            {loadingLista ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  <Loader2
                    className="h-6 w-6 animate-spin mx-auto"
                    data-testid="ordens-servico-table-loading"
                  />
                </td>
              </tr>
            ) : lista?.data?.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-8 text-center text-slate-500"
                  data-testid="ordens-servico-table-empty"
                >
                  Nenhuma ordem de serviço
                </td>
              </tr>
            ) : (
              lista?.data?.map((os: OrdemServicoListItem) => {
                const isExpanded = expandedOsId === os.id;
                return (
                  <Fragment key={os.id}>
                    <tr
                      data-testid={`ordens-servico-row-${os.id}`}
                      className={cn(
                        "hover:bg-slate-50 cursor-pointer transition-colors",
                        isExpanded &&
                          "bg-slate-100/50 border-l-4 border-erp-blue",
                      )}
                      onClick={() => setExpandedOsId(isExpanded ? null : os.id)}
                    >
                      <td>
                        <MaterialIcon
                          name={isExpanded ? "expand_more" : "chevron_right"}
                          className={cn(
                            "text-base",
                            isExpanded ? "text-erp-blue" : "text-slate-400",
                          )}
                        />
                      </td>
                      <td
                        className={cn(
                          "font-bold",
                          isExpanded ? "text-erp-blue" : "text-slate-950",
                        )}
                      >
                        #{formatId(os.numero)}
                      </td>
                      <td>{os.cliente?.nome ?? "-"}</td>
                      <td>
                        {os.subclienteSnapshotNome ??
                          os.subcliente?.nome ??
                          "-"}
                      </td>
                      <td className="font-bold">{os.veiculo?.placa ?? "-"}</td>
                      <td>{os.tecnico?.nome ?? "-"}</td>
                      <td>{TIPO_OS_LABELS[os.tipo] ?? os.tipo}</td>
                      <td>
                        <span
                          className={`px-1.5 py-0.5 border ${
                            ORDENS_SERVICO_STATUS_COLORS[os.status] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ORDENS_SERVICO_STATUS_LABELS[os.status] ?? os.status}
                        </span>
                      </td>
                      <td className="text-slate-500">
                        {formatarDataHoraCurta(os.criadoEm)}
                      </td>
                      <td
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 hover:bg-slate-200 transition-colors"
                              aria-label="Mais ações"
                              data-testid={`ordens-servico-acoes-${os.id}`}
                            >
                              <MaterialIcon
                                name="more_vert"
                                className="text-sm"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {os.status === "EM_TESTES" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/testes?osId=${os.id}`)
                                }
                              >
                                <MaterialIcon
                                  name="biotech"
                                  className="text-sm mr-2"
                                />
                                Ir para Testes
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onDownloadPdf(os.id)}
                              disabled={downloadingPdf}
                              data-testid={`ordens-servico-pdf-${os.id}`}
                            >
                              {downloadingPdf ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Salvar PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr data-testid={`ordens-servico-expanded-${os.id}`}>
                        <td colSpan={10} className="p-0 align-top">
                          <div className="border-t border-b border-slate-300 bg-white">
                            <OrdensServicoDetalhePanel
                              osDetalhe={osDetalhe}
                              loadingDetalhe={loadingDetalhe}
                              rowOsId={os.id}
                              expandedOsId={expandedOsId}
                              canEditOs={canEditOs}
                              updateStatusPending={updateStatusPending}
                              onOpenConfirmIniciar={() =>
                                onOpenConfirmIniciar(os.id)
                              }
                              onOpenRetiradaModal={() =>
                                onOpenRetiradaModal(os.id)
                              }
                              onEnviarParaCadastro={() =>
                                onEnviarParaCadastro(os.id)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-slate-300 flex justify-between items-center bg-slate-50">
        <div
          className="text-[10px] font-bold text-slate-500 uppercase"
          data-testid="ordens-servico-pagination-info"
        >
          Exibindo{" "}
          {(lista?.page ?? 1) * (lista?.limit ?? 15) - (lista?.limit ?? 15) + 1}
          -
          {Math.min(
            (lista?.page ?? 1) * (lista?.limit ?? 15),
            lista?.total ?? 0,
          )}{" "}
          de {lista?.total ?? 0} ordens
        </div>
        <div className="flex gap-1" data-testid="ordens-servico-pagination">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] font-bold h-7"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            data-testid="ordens-servico-page-prev"
          >
            Anterior
          </Button>
          {Array.from(
            { length: Math.min(5, lista?.totalPages ?? 1) },
            (_, i) => i + 1,
          ).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              className={`text-[10px] font-bold h-7 ${p === page ? "bg-slate-900" : ""}`}
              onClick={() => setPage(p)}
              data-testid={`ordens-servico-page-num-${p}`}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] font-bold h-7"
            disabled={page >= (lista?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            data-testid="ordens-servico-page-next"
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
