import type { StatusAparelho } from "@/lib/aparelho-status";
import type {
  Aparelho,
  AparelhosFiltros,
  ProprietarioTipo,
  TipoAparelho,
} from "./aparelhos-page.shared";
import { PAGE_SIZE } from "./aparelhos-page.shared";

export function getRastreadorVinculadoAoSim(ap: Aparelho) {
  return ap.tipo === "SIM" ? ap.aparelhosVinculados?.[0] : undefined;
}

export function getIdentificadorVinculado(ap: Aparelho): string | undefined {
  if (ap.tipo === "RASTREADOR") return ap.simVinculado?.identificador;
  return ap.aparelhosVinculados?.[0]?.identificador ?? undefined;
}

export function resolveKitNome(
  ap: Aparelho,
  kitsPorId: Map<number, string>,
): string | null {
  const rastreador = getRastreadorVinculadoAoSim(ap);
  const kitNome =
    ap.kit?.nome ??
    (ap.kitId ? kitsPorId.get(ap.kitId) : null) ??
    rastreador?.kit?.nome ??
    (rastreador?.kitId ? kitsPorId.get(rastreador.kitId) : null);
  return kitNome ?? null;
}

/** Coluna Técnico na tabela principal (sem misturar cliente). */
export function getTecnicoNomeColunaTabela(ap: Aparelho): string | null {
  const rastreador = getRastreadorVinculadoAoSim(ap);
  const nome = ap.tecnico?.nome ?? rastreador?.tecnico?.nome;
  return nome ?? null;
}

/** Coluna Cliente / titular na tabela (Infinity quando aplicável). */
export function getClienteOuInfinityColunaTabela(ap: Aparelho): string {
  const rastreador = getRastreadorVinculadoAoSim(ap);
  const prop = ap.proprietario ?? rastreador?.proprietario;
  const clienteNome = ap.cliente?.nome ?? rastreador?.cliente?.nome;
  return clienteNome ?? (prop === "INFINITY" ? "Infinity" : "-");
}

/** Campo Técnico no painel expandido (regra de negócio distinta da coluna da tabela). */
export function getNomeDestaqueVinculosTecnico(ap: Aparelho): string | null {
  const rastreador = getRastreadorVinculadoAoSim(ap);
  const nome =
    ap.cliente?.nome ??
    ap.tecnico?.nome ??
    rastreador?.cliente?.nome ??
    rastreador?.tecnico?.nome;
  return nome ?? null;
}

export function computeMarcasDisponiveis(aparelhos: Aparelho[]): string[] {
  const set = new Set<string>();
  aparelhos.forEach((a) => {
    if (a.tipo === "RASTREADOR" && a.marca) set.add(a.marca);
    if (a.tipo === "SIM" && a.operadora) set.add(a.operadora);
  });
  return Array.from(set).sort();
}

export function computeStatusCounts(
  aparelhos: Aparelho[],
): Record<StatusAparelho, number> {
  const counts: Record<StatusAparelho, number> = {
    EM_ESTOQUE: 0,
    CONFIGURADO: 0,
    DESPACHADO: 0,
    COM_TECNICO: 0,
    INSTALADO: 0,
  };
  aparelhos.forEach((a) => {
    counts[a.status]++;
  });
  return counts;
}

export function filterAparelhos(
  aparelhos: Aparelho[],
  f: AparelhosFiltros,
): Aparelho[] {
  const buscaNorm = f.busca.trim().toLowerCase();
  return aparelhos.filter((a) => {
    const matchBusca =
      !buscaNorm ||
      a.identificador?.toLowerCase().includes(buscaNorm) ||
      a.lote?.referencia?.toLowerCase().includes(buscaNorm) ||
      a.tecnico?.nome?.toLowerCase().includes(buscaNorm);

    const matchStatus =
      f.statusFilter === "TODOS" || a.status === f.statusFilter;
    const matchTipo = f.tipoFilter === "TODOS" || a.tipo === f.tipoFilter;
    const matchProprietario =
      f.proprietarioFilter === "TODOS" ||
      a.proprietario === f.proprietarioFilter;
    const matchMarca =
      f.marcaFilter === "TODOS" ||
      (a.tipo === "RASTREADOR" && a.marca === f.marcaFilter) ||
      (a.tipo === "SIM" && a.operadora === f.marcaFilter);

    return (
      matchBusca && matchStatus && matchTipo && matchProprietario && matchMarca
    );
  });
}

export function slicePagina<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPaginas(filteredLength: number, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(filteredLength / pageSize));
}

export function kitMapFromList(kits: { id: number; nome: string }[]) {
  return new Map(kits.map((k) => [k.id, k.nome]));
}

/** Garante tipo estreito para selects da toolbar. */
export function asStatusFilter(v: string): StatusAparelho | "TODOS" {
  return v as StatusAparelho | "TODOS";
}

export function asTipoFilter(v: string): TipoAparelho | "TODOS" {
  return v as TipoAparelho | "TODOS";
}

export function asProprietarioFilter(v: string): ProprietarioTipo | "TODOS" {
  return v as ProprietarioTipo | "TODOS";
}
