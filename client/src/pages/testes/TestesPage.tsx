import { TesteBancada } from "./components/TesteBancada";
import { TesteFilaSidebar } from "./components/TesteFilaSidebar";
import { RetiradaRealizadaDialog } from "./components/RetiradaRealizadaDialog";
import { CancelarOperacaoTesteDialog } from "./components/CancelarOperacaoTesteDialog";
import { useTestesBancadaController } from "./hooks/useTestesBancadaController";

export function TestesPage() {
  const {
    listaTestando,
    selectedOsId,
    setSelectedOsId,
    search,
    setSearch,
    imeiSearch,
    setImeiSearch,
    comunicacaoResult,
    novoLocalInstalacao,
    setNovoLocalInstalacao,
    posChave,
    setPosChave,
    observacoes,
    setObservacoes,
    showCancelarModal,
    setShowCancelarModal,
    showRetiradaModal,
    setShowRetiradaModal,
    selectedOs,
    rastreadores,
    aparelhoSelecionado,
    handleTrocarAparelho,
    handleComunicacaoChange,
    handleCancelarClick,
    handleReagendar,
    handleCancelarOs,
    handleRetiradaRealizada,
    handleRetiradaConfirmar,
    handleFinalizar,
    canFinalizar,
    updateStatusOsMutation,
  } = useTestesBancadaController();

  return (
    <div className="-m-4 flex flex-1 min-h-0 overflow-hidden">
      <TesteBancada
        selectedOs={selectedOs ?? null}
        rastreadores={rastreadores}
        imeiSearch={imeiSearch}
        onImeiSearchChange={setImeiSearch}
        aparelhoSelecionado={aparelhoSelecionado ?? null}
        onTrocarAparelho={handleTrocarAparelho}
        comunicacaoResult={comunicacaoResult}
        onComunicacaoChange={handleComunicacaoChange}
        novoLocalInstalacao={novoLocalInstalacao}
        onNovoLocalInstalacaoChange={setNovoLocalInstalacao}
        posChave={posChave}
        onPosChaveChange={setPosChave}
        observacoes={observacoes}
        onObservacoesChange={setObservacoes}
        onCancelar={handleCancelarClick}
        onFinalizar={handleFinalizar}
        onRetiradaRealizada={handleRetiradaRealizada}
        canFinalizar={canFinalizar}
        isRetirada={selectedOs?.tipo === "RETIRADA"}
      />
      <TesteFilaSidebar
        items={listaTestando}
        selectedId={selectedOsId}
        search={search}
        onSearchChange={setSearch}
        onSelect={setSelectedOsId}
      />

      <RetiradaRealizadaDialog
        open={showRetiradaModal}
        onOpenChange={setShowRetiradaModal}
        onConfirm={handleRetiradaConfirmar}
        isPending={updateStatusOsMutation.isPending}
      />

      <CancelarOperacaoTesteDialog
        open={showCancelarModal}
        onOpenChange={setShowCancelarModal}
        onReagendar={handleReagendar}
        onCancelarOs={handleCancelarOs}
        canAct={!!selectedOs}
        isPending={updateStatusOsMutation.isPending}
      />
    </div>
  );
}
