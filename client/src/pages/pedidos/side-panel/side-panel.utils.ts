import type {
  AparelhoNoKit,
  KitVinculado,
  TipoDespacho,
} from "../shared/pedidos-config-types";
import {
  collectMarcasModelosLabelsFromAparelhos,
  collectOperadorasLabelsFromAparelhos,
} from "../shared/aparelho-no-kit-aggregates";
import { collectDestinatariosEmpresasAparelhos } from "../shared/aparelho-destinatario";
import type {
  PedidoRastreadorApi,
  PedidoRastreadorView,
  StatusPedidoKey,
  StatusPedidoRastreador,
} from "../shared/pedidos-rastreador.types";
import {
  STATUS_ORDER,
  STATUS_TO_API,
} from "../shared/pedidos-rastreador.types";
import type {
  ResumoAparelhosDoKit,
  SidePanelDerivations,
} from "@/types/pedidos-side-panel";

export type { ResumoAparelhosDoKit, SidePanelDerivations };

/** Agrega listas exibidas no painel a partir dos aparelhos de um kit. */
export function aggregateResumoAparelhosDoKit(
  aparelhos: AparelhoNoKit[] | null | undefined,
): ResumoAparelhosDoKit {
  const list = aparelhos ?? [];
  const marcasModelos = collectMarcasModelosLabelsFromAparelhos(list);
  const operadoras = collectOperadorasLabelsFromAparelhos(list);
  const empresas = collectDestinatariosEmpresasAparelhos(list);
  return { marcasModelos, operadoras, empresas };
}

export function getSidePanelDerivations(
  pedido: PedidoRastreadorView,
  kitsVinculados: KitVinculado[],
  tipoDespacho: TipoDespacho,
  podeEditar: boolean,
  transportadora: string,
  numeroNf: string,
): SidePanelDerivations {
  const estaConcluido = pedido.status === "entregue";
  const statusIdx = STATUS_ORDER.indexOf(pedido.status);
  const progress = kitsVinculados.reduce((s, k) => s + k.quantidade, 0);
  const total = pedido.quantidade ?? 0;
  const progressPct = total ? Math.min(100, (progress / total) * 100) : 0;
  const podeDespachar = progress >= total && total > 0;

  if (statusIdx < 0) {
    return {
      estaConcluido,
      statusIdx,
      podeRetroceder: false,
      statusAnterior: null,
      proximoStatus: null,
      progress,
      total,
      progressPct,
      podeDespachar,
      bloqueiaAvançoParaConfigurado: false,
      bloqueiaAvançoParaDespacho: false,
      podeAvançar: false,
      mostraConcluir: false,
    };
  }

  const podeRetroceder =
    statusIdx > 0 &&
    podeEditar &&
    !estaConcluido &&
    pedido.status !== "despachado";
  const statusAnterior = podeRetroceder ? STATUS_ORDER[statusIdx - 1]! : null;

  let proximoStatus: StatusPedidoKey | null = null;
  if (!estaConcluido && statusIdx < STATUS_ORDER.length - 1 && podeEditar) {
    if (pedido.status === "configurado" && tipoDespacho === "EM_MAOS")
      proximoStatus = "entregue";
    else if (pedido.status === "despachado") proximoStatus = "entregue";
    else proximoStatus = STATUS_ORDER[statusIdx + 1]!;
  }

  const bloqueiaAvançoParaConfigurado =
    proximoStatus === "configurado" && progress < total;

  const bloqueiaAvançoParaDespacho =
    proximoStatus === "despachado" &&
    ((tipoDespacho === "TRANSPORTADORA" &&
      (!transportadora.trim() || !numeroNf.trim())) ||
      (tipoDespacho === "CORREIOS" && !numeroNf.trim()));

  const podeAvançar =
    proximoStatus != null &&
    !bloqueiaAvançoParaConfigurado &&
    !bloqueiaAvançoParaDespacho;
  const mostraConcluir = proximoStatus === "entregue";

  return {
    estaConcluido,
    statusIdx,
    podeRetroceder,
    statusAnterior,
    proximoStatus,
    progress,
    total,
    progressPct,
    podeDespachar,
    bloqueiaAvançoParaConfigurado,
    bloqueiaAvançoParaDespacho,
    podeAvançar,
    mostraConcluir,
  };
}

export function buildAvançarStatusPayload(
  pedido: PedidoRastreadorView,
  proximoStatus: StatusPedidoKey,
  kitsVinculados: KitVinculado[],
): { id: number; status: StatusPedidoRastreador; kitIds?: number[] } {
  const novoStatus = STATUS_TO_API[proximoStatus];
  const precisaKitIds =
    novoStatus === "CONFIGURADO" ||
    novoStatus === "DESPACHADO" ||
    novoStatus === "ENTREGUE";
  return {
    id: pedido.id,
    status: novoStatus,
    kitIds:
      precisaKitIds && kitsVinculados.length > 0
        ? kitsVinculados.map((k) => k.id)
        : undefined,
  };
}

export function buildRetrocederStatusPayload(
  pedido: PedidoRastreadorView,
  statusAnterior: StatusPedidoKey,
  kitsVinculados: KitVinculado[],
  pedidoApi: PedidoRastreadorApi | null,
): { id: number; status: StatusPedidoRastreador; kitIds?: number[] } {
  const novoStatus = STATUS_TO_API[statusAnterior];
  const precisaKitIds =
    pedido.status === "despachado" || pedido.status === "entregue";
  const payload: {
    id: number;
    status: StatusPedidoRastreador;
    kitIds?: number[];
  } = {
    id: pedido.id,
    status: novoStatus,
  };
  if (precisaKitIds) {
    const ids =
      kitsVinculados.length > 0
        ? kitsVinculados.map((k) => k.id)
        : pedidoApi?.kitIds && Array.isArray(pedidoApi.kitIds)
          ? pedidoApi.kitIds
          : [];
    if (ids.length > 0) payload.kitIds = ids;
  }
  return payload;
}
