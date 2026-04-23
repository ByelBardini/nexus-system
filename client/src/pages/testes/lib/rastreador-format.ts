import type { RastreadorParaTeste } from "./testes-types";

/** Texto concatenado para filtro de busca (minúsculas). */
export function rastreadorTextoBusca(r: RastreadorParaTeste): string {
  const imei = (r.identificador ?? "").trim();
  const iccid = (r.simVinculado?.identificador ?? "").trim();
  const marcaModelo = [r.marca, r.modelo].filter(Boolean).join(" ");
  const operadora =
    r.marcaSimcard?.operadora?.nome ?? r.operadora ?? "";
  const marcaSim = r.marcaSimcard?.nome ?? "";
  const plano =
    r.planoSimcard?.planoMb ?? r.simVinculado?.planoSimcard?.planoMb;
  const partes = [imei, iccid, marcaModelo, operadora, marcaSim];
  if (plano != null) partes.push(`${plano}MB`);
  return partes.filter(Boolean).join(" ").toLowerCase();
}

export function rastreadorOperadoraNome(r: RastreadorParaTeste): string | null {
  return (
    r.marcaSimcard?.operadora?.nome ??
    r.operadora ??
    r.simVinculado?.marcaSimcard?.operadora?.nome ??
    r.simVinculado?.operadora ??
    null
  );
}

export function rastreadorMarcaSimNome(r: RastreadorParaTeste): string | null {
  return (
    r.marcaSimcard?.nome ?? r.simVinculado?.marcaSimcard?.nome ?? null
  );
}

export function rastreadorPlanoMb(r: RastreadorParaTeste): number | null {
  const plano =
    r.planoSimcard?.planoMb ?? r.simVinculado?.planoSimcard?.planoMb;
  return plano ?? null;
}

/** Linha “operadora / marca / plano” (sem ICCID), para lista do select. */
export function rastreadorLinhaOperadoraPlano(
  r: RastreadorParaTeste,
): string | null {
  const operadora = rastreadorOperadoraNome(r);
  const marcaSim = rastreadorMarcaSimNome(r);
  const plano = rastreadorPlanoMb(r);
  const planoStr = plano != null ? `${plano} MB` : null;
  const partes = [operadora, marcaSim, planoStr].filter(
    (x): x is string => !!x,
  );
  return partes.length > 0 ? partes.join(" / ") : null;
}

/** Resumo para painel: operadora / marca SIM / ICCID / plano. */
export function formatRastreadorOperadoraMarcaIccidPlano(
  r: RastreadorParaTeste,
): string {
  const operadora = rastreadorOperadoraNome(r);
  const marcaSim = rastreadorMarcaSimNome(r);
  const iccid = (r.simVinculado?.identificador ?? "").trim();
  const plano = rastreadorPlanoMb(r);
  const planoStr = plano != null ? `${plano} MB` : null;
  const partes = [operadora, marcaSim, iccid || null, planoStr].filter(
    (x): x is string => !!x,
  );
  return partes.length > 0 ? partes.join(" / ") : "—";
}

export function rastreadorMarcaModeloLabel(r: RastreadorParaTeste): string {
  return [r.marca, r.modelo].filter(Boolean).join(" ") || "—";
}

export function findRastreadorPorIdentificador(
  list: RastreadorParaTeste[],
  identificador: string,
): RastreadorParaTeste | null {
  const t = identificador.trim().toLowerCase();
  if (!t) return null;
  return (
    list.find(
      (r) =>
        (r.identificador ?? "").trim().toLowerCase() === t,
    ) ?? null
  );
}
