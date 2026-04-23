import { STATUS_CONFIG_APARELHO } from "@/lib/aparelho-status";
import {
  slicePagina,
  totalPaginas,
} from "@/pages/aparelhos/lista/aparelhos-list.helpers";
import type {
  EquipamentoListItem,
  EquipamentosListFiltros,
  EquipamentoStatusPresentation,
} from "@/types/equipamentos-lista";
import {
  EQUIPAMENTOS_LIST_PAGE_SIZE,
  equipamentoMatchesStageFilter,
} from "./equipamentos-page.shared";

export type {
  EquipamentosListFiltros,
  EquipamentoStatusPresentation,
} from "@/types/equipamentos-lista";

export function listOnlyEquipamentosMontados(
  aparelhos: EquipamentoListItem[],
): EquipamentoListItem[] {
  return aparelhos.filter(
    (a) => a.tipo === "RASTREADOR" && a.simVinculado != null,
  );
}

export function computeMarcasFromEquipamentos(
  equipamentos: EquipamentoListItem[],
): string[] {
  const set = new Set<string>();
  equipamentos.forEach((e) => {
    if (e.marca) set.add(e.marca);
  });
  return Array.from(set).sort();
}

export function computeOperadorasFromEquipamentos(
  equipamentos: EquipamentoListItem[],
): string[] {
  const set = new Set<string>();
  equipamentos.forEach((e) => {
    if (e.simVinculado?.operadora) set.add(e.simVinculado.operadora);
  });
  return Array.from(set).sort();
}

export function computePipelineCounts(equipamentos: EquipamentoListItem[]) {
  return {
    total: equipamentos.length,
    configurados: equipamentos.filter((e) =>
      equipamentoMatchesStageFilter(e, "CONFIGURADO"),
    ).length,
    emKit: equipamentos.filter((e) =>
      equipamentoMatchesStageFilter(e, "EM_KIT"),
    ).length,
    despachados: equipamentos.filter((e) =>
      equipamentoMatchesStageFilter(e, "DESPACHADO"),
    ).length,
    comTecnico: equipamentos.filter((e) =>
      equipamentoMatchesStageFilter(e, "COM_TECNICO"),
    ).length,
    instalados: equipamentos.filter((e) =>
      equipamentoMatchesStageFilter(e, "INSTALADO"),
    ).length,
  };
}

export function filterEquipamentosList(
  equipamentos: EquipamentoListItem[],
  f: EquipamentosListFiltros,
): EquipamentoListItem[] {
  const buscaNorm = f.busca.trim().toLowerCase();
  const buscaRaw = f.busca.trim();
  return equipamentos.filter((e) => {
    const matchBusca =
      !buscaNorm ||
      e.identificador?.toLowerCase().includes(buscaNorm) ||
      e.simVinculado?.identificador?.toLowerCase().includes(buscaNorm) ||
      e.tecnico?.nome?.toLowerCase().includes(buscaNorm) ||
      e.kitId?.toString().includes(buscaRaw) ||
      e.lote?.referencia?.toLowerCase().includes(buscaNorm);

    const matchPipeline = equipamentoMatchesStageFilter(e, f.pipelineFilter);
    const matchStatus = equipamentoMatchesStageFilter(e, f.statusFilter);
    const matchProprietario =
      f.proprietarioFilter === "TODOS" ||
      e.proprietario === f.proprietarioFilter;
    const matchMarca = f.marcaFilter === "TODOS" || e.marca === f.marcaFilter;
    const matchOperadora =
      f.operadoraFilter === "TODOS" ||
      e.simVinculado?.operadora === f.operadoraFilter;

    return (
      matchBusca &&
      matchPipeline &&
      matchStatus &&
      matchProprietario &&
      matchMarca &&
      matchOperadora
    );
  });
}

export function resolveKitNomeEquipamento(
  e: EquipamentoListItem,
  kitsPorId: Map<number, string>,
): string | null {
  return e.kit?.nome ?? (e.kitId ? (kitsPorId.get(e.kitId) ?? null) : null);
}

export function formatMarcaModeloEquipamento(e: EquipamentoListItem): string {
  return e.marca ? `${e.marca} ${e.modelo || ""}`.trim() : "-";
}

export function proprietarioLabelEquipamento(e: EquipamentoListItem): string {
  return e.cliente?.nome ?? (e.proprietario === "INFINITY" ? "Infinity" : "-");
}

/** Texto operadora · marca sim · plano (para colunas e painel). */
export function simLinhaDetalheOperadora(e: EquipamentoListItem): string {
  const parts = [
    e.simVinculado?.operadora,
    e.simVinculado?.marcaSimcard?.nome,
    e.simVinculado?.planoSimcard
      ? `${e.simVinculado.planoSimcard.planoMb} MB`
      : null,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : "-";
}

export function loteEquipamentoResumo(e: EquipamentoListItem): string {
  const parts = [e.lote?.referencia, e.simVinculado?.lote?.referencia].filter(
    Boolean,
  ) as string[];
  return parts.length ? parts.join(" · ") : "-";
}

export function getEquipamentoStatusPresentation(
  e: EquipamentoListItem,
): EquipamentoStatusPresentation {
  const statusConfig = STATUS_CONFIG_APARELHO[e.status];
  if (e.status === "CONFIGURADO" && e.kitId) {
    return {
      kind: "em_kit",
      label: "Em Kit",
      dotClass: "bg-purple-500",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      headerIcon: "🟣",
    };
  }
  return {
    kind: "standard",
    label: statusConfig.label,
    dotClass: statusConfig.dotColor,
    badgeClass: cnBadgeFromStatusConfig(statusConfig),
    headerIcon: statusConfig.icon,
  };
}

function cnBadgeFromStatusConfig(
  c: (typeof STATUS_CONFIG_APARELHO)[keyof typeof STATUS_CONFIG_APARELHO],
): string {
  return `${c.bgColor} ${c.color} ${c.borderColor}`;
}

export function sliceEquipamentosPage<T>(items: T[], page: number) {
  return slicePagina(items, page, EQUIPAMENTOS_LIST_PAGE_SIZE);
}

export function totalPaginasEquipamentosList(filteredLength: number) {
  return totalPaginas(filteredLength, EQUIPAMENTOS_LIST_PAGE_SIZE);
}
