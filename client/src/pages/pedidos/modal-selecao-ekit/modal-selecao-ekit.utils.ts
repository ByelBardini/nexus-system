import type { PedidoRastreadorView, PedidoRastreadorApi } from "../shared/pedidos-rastreador.types";
import type {
  AparelhoNoKit,
  KitDetalhe,
  KitVinculado,
} from "../shared/pedidos-config-types";
import { getDestinatarioFiltroAparelhoNoKit } from "../shared/aparelho-destinatario";
import {
  collectMarcasModelosLabelsFromAparelhos,
  collectOperadorasLabelsFromAparelhos,
} from "../shared/aparelho-no-kit-aggregates";
import type { ModalSelecaoEKitFiltrosPedido } from "./modal-selecao-ekit.types";

export function buildKitIdsEmOutrosPedidos(
  pedidoId: number | undefined,
  kitsPorPedido: Record<number, KitVinculado[]> | undefined,
): Set<number> {
  if (!pedidoId || !kitsPorPedido) return new Set<number>();
  const ids = new Set<number>();
  Object.entries(kitsPorPedido).forEach(([pedidoIdStr, kits]) => {
    if (Number(pedidoIdStr) !== pedidoId) {
      kits.forEach((k) => ids.add(k.id));
    }
  });
  return ids;
}

export function filterKitsDisponiveisParaSelecao(
  kitsDetalhes: KitDetalhe[],
  kitIdsEmOutrosPedidos: Set<number>,
): KitDetalhe[] {
  return kitsDetalhes.filter(
    (k) => !k.kitConcluido && !kitIdsEmOutrosPedidos.has(k.id),
  );
}

/**
 * Compatibilidade com requisitos do pedido (marca/modelo/operadora).
 * `marcaModelo` no view usa " / " entre marca e modelo (ex.: "X / Y").
 */
export function filterKitsCompativeisComPedido(
  kitsDisponiveis: KitDetalhe[],
  pedido: PedidoRastreadorView | null,
): KitDetalhe[] {
  const temRequisito = !!(pedido?.marcaModelo || pedido?.operadora);
  if (!temRequisito) return kitsDisponiveis;

  return kitsDisponiveis.filter((k) => {
    if (
      k.quantidade === 0 ||
      (k.marcas.length === 0 &&
        k.modelos.length === 0 &&
        k.operadoras.length === 0)
    )
      return true;

    const parts = pedido?.marcaModelo?.split(" / ") ?? [];
    const marcaReq = parts[0]?.trim() ?? null;
    const modeloReq = parts[1]?.trim() ?? null;
    const operadoraReq = pedido?.operadora ?? null;

    if (
      modeloReq &&
      k.modelos.length > 0 &&
      !k.modelos.every((m) => m === modeloReq)
    )
      return false;
    if (
      marcaReq &&
      !modeloReq &&
      k.marcas.length > 0 &&
      !k.marcas.every((m) => m === marcaReq)
    )
      return false;
    if (
      operadoraReq &&
      k.operadoras.length > 0 &&
      !k.operadoras.every((op) => op === operadoraReq)
    )
      return false;

    return true;
  });
}

export function filterKitsPorTextoBusca(
  kitsCompativeis: KitDetalhe[],
  filtroBusca: string,
): KitDetalhe[] {
  if (!filtroBusca.trim()) return kitsCompativeis;
  const s = filtroBusca.toLowerCase();
  return kitsCompativeis.filter(
    (k) =>
      k.nome.toLowerCase().includes(s) ||
      k.modelosOperadoras.toLowerCase().includes(s),
  );
}

export function buildAparelhosDisponiveisApiPath(
  pedidoApi: PedidoRastreadorApi | null | undefined,
  filtrosPedido: ModalSelecaoEKitFiltrosPedido | null | undefined,
  isMisto: boolean,
  showAllClientes: boolean,
): string {
  const params = new URLSearchParams();
  if (isMisto && !showAllClientes && pedidoApi?.itens) {
    pedidoApi.itens.forEach((item) => {
      if (item.proprietario === "CLIENTE" && item.clienteId) {
        params.append("clienteIds", String(item.clienteId));
      }
    });
    if (pedidoApi.itens.some((item) => item.proprietario === "INFINITY")) {
      params.set("includeInfinity", "true");
    }
  } else if (!isMisto && !showAllClientes && filtrosPedido?.clienteId) {
    params.set("clienteId", String(filtrosPedido.clienteId));
  }
  if (filtrosPedido?.modeloEquipamentoId)
    params.set(
      "modeloEquipamentoId",
      String(filtrosPedido.modeloEquipamentoId),
    );
  if (filtrosPedido?.marcaEquipamentoId)
    params.set(
      "marcaEquipamentoId",
      String(filtrosPedido.marcaEquipamentoId),
    );
  if (filtrosPedido?.operadoraId)
    params.set("operadoraId", String(filtrosPedido.operadoraId));
  const qs = params.toString();
  return qs
    ? `/aparelhos/pareamento/aparelhos-disponiveis?${qs}`
    : "/aparelhos/pareamento/aparelhos-disponiveis";
}

export function computeAparelhosParaAdicionar(
  aparelhosDisponiveis: AparelhoNoKit[],
  idsJaNoKit: number[],
): AparelhoNoKit[] {
  const idsNoKit = new Set(idsJaNoKit);
  return aparelhosDisponiveis.filter((a) => !idsNoKit.has(a.id));
}

export function buildOpcoesMarcaModelo(
  aparelhosParaAdicionar: AparelhoNoKit[],
): string[] {
  return collectMarcasModelosLabelsFromAparelhos(aparelhosParaAdicionar);
}

export function buildOpcoesOperadora(
  aparelhosParaAdicionar: AparelhoNoKit[],
): string[] {
  return collectOperadorasLabelsFromAparelhos(aparelhosParaAdicionar);
}

export function buildOpcoesCliente(
  aparelhosParaAdicionar: AparelhoNoKit[],
): string[] {
  const set = new Set<string>();
  aparelhosParaAdicionar.forEach((a) => {
    const c = getDestinatarioFiltroAparelhoNoKit(a);
    if (c) set.add(c);
  });
  return Array.from(set).sort();
}

export interface FiltroListaAparelhosParams {
  buscaAparelho: string;
  filtroMarcaModelo: string;
  filtroOperadora: string;
  filtroCliente: string;
}

export function filterAparelhosParaSelecao(
  aparelhosParaAdicionar: AparelhoNoKit[],
  p: FiltroListaAparelhosParams,
): AparelhoNoKit[] {
  return aparelhosParaAdicionar.filter((a) => {
    if (p.buscaAparelho.trim()) {
      const s = p.buscaAparelho.toLowerCase();
      if (
        !(a.identificador?.toLowerCase().includes(s) ?? false) &&
        !(a.marca?.toLowerCase().includes(s) ?? false) &&
        !(a.modelo?.toLowerCase().includes(s) ?? false)
      )
        return false;
    }
    const mm = [a.marca, a.modelo].filter(Boolean).join(" / ");
    if (p.filtroMarcaModelo && mm !== p.filtroMarcaModelo) return false;
    const op = a.operadora ?? a.simVinculado?.operadora;
    if (p.filtroOperadora && op !== p.filtroOperadora) return false;
    const clienteLabel = getDestinatarioFiltroAparelhoNoKit(a);
    if (p.filtroCliente && clienteLabel !== p.filtroCliente) return false;
    return true;
  });
}
