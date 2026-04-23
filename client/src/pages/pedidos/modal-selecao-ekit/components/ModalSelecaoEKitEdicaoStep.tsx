import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { ModalSelecaoEKitTabelaRastreadoresNoKit } from "./ModalSelecaoEKitTabelaRastreadoresNoKit";
import { ModalSelecaoEKitPanelNovosRastreadores } from "./ModalSelecaoEKitPanelNovosRastreadores";
import type { ModalSelecaoEKitController } from "../hooks/useModalSelecaoEKit";

export interface ModalSelecaoEKitEdicaoStepProps {
  ctl: ModalSelecaoEKitController;
}

export function ModalSelecaoEKitEdicaoStep({
  ctl,
}: ModalSelecaoEKitEdicaoStepProps) {
  const {
    pedido,
    pedidoApi,
    kitSelecionado,
    kitComAparelhos,
    isMisto,
    handleVoltar,
    handleClose,
    destinatariosData,
    aparelhosNoKit,
    progressQtd,
    qtdEsperada,
    handleRemoverAparelho,
    destinatarioLote,
    setDestinatarioLote,
    showAllClientes,
    setShowAllClientes,
    buscaAparelho,
    setBuscaAparelho,
    filtroMarcaModelo,
    setFiltroMarcaModelo,
    filtroOperadora,
    setFiltroOperadora,
    filtroCliente,
    setFiltroCliente,
    opcoesMarcaModelo,
    opcoesOperadora,
    opcoesCliente,
    aparelhosFiltrados,
    aparelhosSelecionados,
    setAparelhosSelecionados,
    handleAdicionarSelecionados,
    handleSalvarEVincular,
  } = ctl;

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MaterialIcon name="inventory" className="text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Editar Kit — {kitSelecionado?.nome}
            </h2>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleVoltar}>
          <MaterialIcon name="arrow_back" /> Voltar
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {pedido && (
          <section>
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest border-l-4 border-erp-blue pl-2 mb-4">
              Informações do Kit
            </h3>
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Pedido
                </Label>
                <div className="text-xs font-bold text-slate-700">
                  {pedido.codigo}
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Destino
                </Label>
                <div className="text-xs font-bold text-slate-700">
                  {pedido.destinatario}
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Quantidade Esperada
                </Label>
                <div className="text-xs font-bold text-erp-blue bg-blue-50 inline-block px-2 py-0.5 rounded">
                  {qtdEsperada} Unidades
                </div>
              </div>
            </div>
          </section>
        )}
        <ModalSelecaoEKitTabelaRastreadoresNoKit
          isMisto={isMisto}
          aparelhosNoKit={aparelhosNoKit}
          kitComAparelhos={kitComAparelhos}
          destinatariosData={destinatariosData}
          pedidoApi={pedidoApi}
          progressQtd={progressQtd}
          qtdEsperada={qtdEsperada}
          onRemover={handleRemoverAparelho}
        />
        <ModalSelecaoEKitPanelNovosRastreadores
          pedido={pedido}
          pedidoApi={pedidoApi}
          isMisto={isMisto}
          destinatariosData={destinatariosData}
          destinatarioLote={destinatarioLote}
          setDestinatarioLote={setDestinatarioLote}
          showAllClientes={showAllClientes}
          setShowAllClientes={setShowAllClientes}
          buscaAparelho={buscaAparelho}
          setBuscaAparelho={setBuscaAparelho}
          filtroMarcaModelo={filtroMarcaModelo}
          setFiltroMarcaModelo={setFiltroMarcaModelo}
          filtroOperadora={filtroOperadora}
          setFiltroOperadora={setFiltroOperadora}
          filtroCliente={filtroCliente}
          setFiltroCliente={setFiltroCliente}
          opcoesMarcaModelo={opcoesMarcaModelo}
          opcoesOperadora={opcoesOperadora}
          opcoesCliente={opcoesCliente}
          aparelhosFiltrados={aparelhosFiltrados}
          aparelhosSelecionados={aparelhosSelecionados}
          setAparelhosSelecionados={setAparelhosSelecionados}
          onAdicionarSelecionados={handleAdicionarSelecionados}
        />
      </div>
      <footer className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <span
          className={cn(
            "text-[10px] font-bold px-3 py-1 rounded-full border uppercase flex items-center gap-1.5",
            progressQtd >= qtdEsperada
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-amber-50 text-amber-600 border-amber-200",
          )}
        >
          <MaterialIcon name="check_circle" className="text-sm" />
          {progressQtd >= qtdEsperada
            ? "Kit Completo"
            : `Em andamento (${progressQtd}/${qtdEsperada})`}
        </span>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSalvarEVincular}
            className="bg-erp-blue hover:bg-blue-700"
          >
            Salvar e Vincular ao Pedido
          </Button>
        </div>
      </footer>
    </>
  );
}
