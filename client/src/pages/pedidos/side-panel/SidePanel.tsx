import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import type { KitResumo, KitVinculado } from "../shared/pedidos-config-types";
import { ModalSelecaoEKit } from "../modal-selecao-ekit/ModalSelecaoEKit";
import { SidePanelDespachoCarga } from "./components/SidePanelDespachoCarga";
import { SidePanelHeader } from "./components/SidePanelHeader";
import { SidePanelHistoricoPedido } from "./components/SidePanelHistoricoPedido";
import { SidePanelKitsVinculados } from "./components/SidePanelKitsVinculados";
import { SidePanelMistoDistribuicao } from "./components/SidePanelMistoDistribuicao";
import { SidePanelProgressoEStatus } from "./components/SidePanelProgressoEStatus";
import type { SidePanelProps } from "./side-panel.types";
import {
  buildAvançarStatusPayload,
  buildRetrocederStatusPayload,
  getSidePanelDerivations,
} from "./side-panel.utils";
import { useKitComAparelhosQuery } from "./hooks/useKitComAparelhosQuery";
import { useSidePanelMutations } from "./hooks/useSidePanelMutations";

export function SidePanel({
  pedido,
  pedidoApi,
  open,
  onClose,
  onStatusUpdated,
  kitsVinculados,
  onKitsChange,
  tipoDespacho,
  onTipoDespachoChange,
  kitsPorPedido,
  transportadora,
  numeroNf,
  onTransportadoraChange,
  onNumeroNfChange,
  onSaveDespacho,
}: SidePanelProps) {
  const [kitExpandidoId, setKitExpandidoId] = useState<number | null>(null);
  const [detalhesKitId, setDetalhesKitId] = useState<number | null>(null);
  const [modalSelecaoKit, setModalSelecaoKit] = useState(false);
  const [kitParaEditar, setKitParaEditar] = useState<{
    id: number;
    nome: string;
  } | null>(null);

  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR");
  const { kitIdsMutation, statusMutation, despachoCargaMutation } =
    useSidePanelMutations(onStatusUpdated);

  const { data: kitDetalhes, isLoading: carregandoDetalhes } =
    useKitComAparelhosQuery(detalhesKitId, open && detalhesKitId != null);

  if (!open || !pedido) return null;
  const p = pedido;

  const deriv = getSidePanelDerivations(
    p,
    kitsVinculados,
    tipoDespacho,
    podeEditar,
    transportadora,
    numeroNf,
  );

  const estaDespachadoOuEntregue =
    p.status === "despachado" || p.status === "entregue";

  function handleAvançar() {
    if (!deriv.proximoStatus) return;
    statusMutation.mutate(
      buildAvançarStatusPayload(p, deriv.proximoStatus, kitsVinculados),
    );
  }

  function handleRetroceder() {
    if (!deriv.statusAnterior) return;
    statusMutation.mutate(
      buildRetrocederStatusPayload(
        p,
        deriv.statusAnterior,
        kitsVinculados,
        pedidoApi,
      ),
    );
  }

  function handleSaveDespacho(data: {
    tipoDespacho: string;
    transportadora: string;
    numeroNf: string;
  }) {
    onSaveDespacho(data);
    despachoCargaMutation.mutate({ id: p.id, ...data });
  }

  function handleVincularKit(kit: KitResumo, qtd: number) {
    const prev = kitsVinculados;
    const idx = prev.findIndex((k) => k.id === kit.id);
    const newKits: KitVinculado[] =
      idx >= 0
        ? prev.map((k, i) =>
            i === idx ? { ...k, nome: kit.nome, quantidade: qtd } : k,
          )
        : [...prev, { id: kit.id, nome: kit.nome, quantidade: qtd }];
    onKitsChange(newKits);
    kitIdsMutation.mutate({
      id: p.id,
      kitIds: newKits.map((k) => k.id),
    });
  }

  function handleRemoverKit(kitId: number) {
    const newKits = kitsVinculados.filter((k) => k.id !== kitId);
    onKitsChange(newKits);
    if (kitExpandidoId === kitId) setKitExpandidoId(null);
    if (detalhesKitId === kitId) setDetalhesKitId(null);
    kitIdsMutation.mutate({
      id: p.id,
      kitIds: newKits.map((k) => k.id),
    });
  }

  function handleToggleExpandir(kitId: number) {
    if (kitExpandidoId === kitId) {
      setKitExpandidoId(null);
      setDetalhesKitId(null);
    } else {
      setKitExpandidoId(kitId);
      setDetalhesKitId(kitId);
    }
  }

  function handleEditarKit(kit: KitVinculado) {
    setKitParaEditar({ id: kit.id, nome: kit.nome });
    setModalSelecaoKit(true);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[580px] max-w-[95vw] sm:max-w-[580px] p-0 flex flex-col overflow-y-auto"
      >
        <SidePanelHeader pedido={p} />
        <SidePanelMistoDistribuicao pedido={p} />
        <SidePanelProgressoEStatus
          deriv={deriv}
          podeEditar={podeEditar}
          onAvançar={handleAvançar}
          onRetroceder={handleRetroceder}
          statusMutation={statusMutation}
        />
        <SidePanelKitsVinculados
          kitsVinculados={kitsVinculados}
          estaConcluido={deriv.estaConcluido}
          kitExpandidoId={kitExpandidoId}
          detalhesKitId={detalhesKitId}
          kitDetalhes={kitDetalhes}
          carregandoDetalhes={carregandoDetalhes}
          onAddKit={() => setModalSelecaoKit(true)}
          onToggleExpandir={handleToggleExpandir}
          onRemoverKit={handleRemoverKit}
          onEditarKit={handleEditarKit}
        />
        {deriv.statusIdx >= 2 && (
          <SidePanelDespachoCarga
            bloqueado={estaDespachadoOuEntregue}
            podeDespachar={deriv.podeDespachar}
            bloqueiaAvançoParaDespacho={deriv.bloqueiaAvançoParaDespacho}
            tipoDespacho={tipoDespacho}
            onTipoDespachoChange={onTipoDespachoChange}
            transportadora={transportadora}
            numeroNf={numeroNf}
            onTransportadoraChange={onTransportadoraChange}
            onNumeroNfChange={onNumeroNfChange}
            onSave={handleSaveDespacho}
          />
        )}
        {p.historico && p.historico.length > 0 && (
          <SidePanelHistoricoPedido historico={p.historico} />
        )}

        <ModalSelecaoEKit
          open={modalSelecaoKit}
          onOpenChange={(o) => {
            setModalSelecaoKit(o);
            if (!o) setKitParaEditar(null);
          }}
          pedido={p}
          pedidoApi={pedidoApi}
          onVincular={handleVincularKit}
          kitParaEditar={kitParaEditar}
          kitsPorPedido={kitsPorPedido}
          filtrosPedido={
            pedidoApi
              ? {
                  clienteId: pedidoApi.deClienteId,
                  modeloEquipamentoId: pedidoApi.modeloEquipamentoId,
                  marcaEquipamentoId: pedidoApi.marcaEquipamentoId,
                  operadoraId: pedidoApi.operadoraId,
                }
              : null
          }
        />
      </SheetContent>
    </Sheet>
  );
}
