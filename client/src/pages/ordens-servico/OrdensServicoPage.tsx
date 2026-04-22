import { Loader2 } from "lucide-react";
import { useOrdensServicoPage } from "./hooks/useOrdensServicoPage";
import { ConfirmIniciarTestesDialog } from "./lista/components/ConfirmIniciarTestesDialog";
import { OrdensServicoListToolbar } from "./lista/components/OrdensServicoListToolbar";
import { OrdensServicoPipelineStrip } from "./lista/components/OrdensServicoPipelineStrip";
import { OrdensServicoTable } from "./lista/components/OrdensServicoTable";
import { RetiradaRealizadaDialog } from "./lista/components/RetiradaRealizadaDialog";

export function OrdensServicoPage() {
  const {
    navigate,
    resumo,
    loadingResumo,
    lista,
    loadingLista,
    osDetalhe,
    loadingDetalhe,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    expandedOsId,
    setExpandedOsId,
    downloadingPdf,
    confirmIniciarOsId,
    setConfirmIniciarOsId,
    showRetiradaModal,
    setShowRetiradaModal,
    canCreate,
    canEditOs,
    updateStatusMutation,
    handleStatusClick,
    handleIniciarTestes,
    handleRetiradaConfirmar,
    handleEnviarParaCadastro,
    handleAbrirImpressao,
  } = useOrdensServicoPage();

  if (loadingResumo) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-testid="ordens-servico-loading-resumo"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ordens-servico-page">
      <OrdensServicoPipelineStrip
        statusFilter={statusFilter}
        resumo={resumo}
        onStatusClick={handleStatusClick}
      />

      <OrdensServicoListToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        canCreate={canCreate}
      />

      <OrdensServicoTable
        lista={lista}
        loadingLista={loadingLista}
        page={page}
        setPage={setPage}
        expandedOsId={expandedOsId}
        setExpandedOsId={setExpandedOsId}
        osDetalhe={osDetalhe}
        loadingDetalhe={loadingDetalhe}
        navigate={navigate}
        downloadingPdf={downloadingPdf}
        onDownloadPdf={handleAbrirImpressao}
        updateStatusPending={updateStatusMutation.isPending}
        canEditOs={canEditOs}
        onOpenConfirmIniciar={setConfirmIniciarOsId}
        onOpenRetiradaModal={setShowRetiradaModal}
        onEnviarParaCadastro={handleEnviarParaCadastro}
      />

      <ConfirmIniciarTestesDialog
        open={confirmIniciarOsId != null}
        onOpenChange={(open) => !open && setConfirmIniciarOsId(null)}
        onCancel={() => setConfirmIniciarOsId(null)}
        onConfirm={() => {
          if (confirmIniciarOsId != null) {
            handleIniciarTestes(confirmIniciarOsId);
            setConfirmIniciarOsId(null);
          }
        }}
        isPending={updateStatusMutation.isPending}
      />

      <RetiradaRealizadaDialog
        open={showRetiradaModal != null}
        onOpenChange={(open) => !open && setShowRetiradaModal(null)}
        onClose={() => setShowRetiradaModal(null)}
        onConfirmSim={() => handleRetiradaConfirmar(true)}
        onConfirmNao={() => handleRetiradaConfirmar(false)}
        isPending={updateStatusMutation.isPending}
      />
    </div>
  );
}
