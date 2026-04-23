import type { CsvLinhaInput } from "./types";
import type { LotePareamentoListItem } from "./types";
import type { MarcaSimcardPareamentoCatalog } from "./types";

export const CSV_HEADER = [
  "marca_rastreador",
  "modelo",
  "imei",
  "operadora",
  "marca_simcard",
  "plano",
  "iccid",
  "lote_rastreador",
  "lote_simcard",
] as const;

export const CSV_HEADER_ALIASES: Record<string, keyof CsvLinhaInput> = {
  marca_rastreador: "marcaRastreador",
  marcarastreador: "marcaRastreador",
  "marca(rastreador)": "marcaRastreador",
  modelo: "modeloRastreador",
  modelo_rastreador: "modeloRastreador",
  imei: "imei",
  marca_simcard: "marcaSimcard",
  marcasimcard: "marcaSimcard",
  "marca(simcard)": "marcaSimcard",
  operadora: "operadora",
  plano: "plano",
  iccid: "iccid",
  lote_rastreador: "loteRastreador",
  loterastreador: "loteRastreador",
  "lote(rastreador)": "loteRastreador",
  lote_simcard: "loteSimcard",
  lotesimcard: "loteSimcard",
  lote_sim: "loteSimcard",
  "lote(simcard)": "loteSimcard",
};

export function normalizarCabecalho(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "").replace(/["']/g, "");
}

export function gerarTemplateCsv(): string {
  const header = CSV_HEADER.join(";");
  const exemplo1 =
    "Suntech;ST-901;358942109982341;Claro;Claro SIMCard;10MB;8955101234567890123;;";
  const exemplo2 =
    ";;358942109982342;;;;8955101234567890124;LOTE-RAST-001;LOTE-SIM-001";
  return [header, exemplo1, exemplo2].join("\n");
}

export function parseIds(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n\r]+/)
    .map((s) =>
      s
        .replace(/\s+/g, "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim(),
    )
    .filter(Boolean);
}

export function computeMassaLists(textImeis: string, textIccids: string) {
  const imeis = parseIds(textImeis);
  const iccids = parseIds(textIccids);
  const quantidadeBate = imeis.length === iccids.length;
  const paresMassa =
    quantidadeBate && imeis.length > 0
      ? imeis.map((imei, i) => ({ imei, iccid: iccids[i] ?? "" }))
      : [];
  return { imeis, iccids, quantidadeBate, paresMassa };
}

export type CsvParseOutcome =
  | { ok: true; linhas: CsvLinhaInput[] }
  | { ok: false; error: string };

/** Processa linhas já parseadas pelo PapaParse (header: true). */
export function processCsvRowsFromPapa(
  rows: Record<string, string>[],
  parseErrors: { message: string }[],
): CsvParseOutcome {
  if (parseErrors.length > 0) {
    return { ok: false, error: `Erro ao ler CSV: ${parseErrors[0].message}` };
  }
  const camposValidos = new Set(Object.values(CSV_HEADER_ALIASES));
  const linhasParsed: CsvLinhaInput[] = [];
  for (const row of rows) {
    const linha: CsvLinhaInput = { imei: "", iccid: "" };
    for (const [k, v] of Object.entries(row)) {
      const campo = CSV_HEADER_ALIASES[normalizarCabecalho(k)];
      if (campo && camposValidos.has(campo)) {
        (linha as unknown as Record<string, string>)[campo] = String(
          v ?? "",
        ).trim();
      }
    }
    if (!linha.imei && !linha.iccid) continue;
    linhasParsed.push(linha);
  }
  if (linhasParsed.length === 0) {
    return {
      ok: false,
      error: "Nenhuma linha válida encontrada. Verifique o cabeçalho do CSV.",
    };
  }
  return { ok: true, linhas: linhasParsed };
}

export function filtrarLotesRastreadores(
  lotes: LotePareamentoListItem[],
  busca: string,
): LotePareamentoListItem[] {
  const s = busca.trim().toLowerCase();
  if (!s) return lotes;
  return lotes.filter((l) => {
    const info = [l.marca, l.modelo].filter(Boolean).join(" / ");
    return (
      l.referencia.toLowerCase().includes(s) || info.toLowerCase().includes(s)
    );
  });
}

export function filtrarLotesSims(
  lotes: LotePareamentoListItem[],
  busca: string,
  marcasSimcard: MarcaSimcardPareamentoCatalog[],
): LotePareamentoListItem[] {
  const s = busca.trim().toLowerCase();
  if (!s) return lotes;
  return lotes.filter((l) => {
    const marcaNome =
      marcasSimcard.find((m) => m.id === l.marcaSimcardId)?.nome ?? null;
    const info = [l.operadora, marcaNome].filter(Boolean).join(" / ");
    return (
      l.referencia.toLowerCase().includes(s) || info.toLowerCase().includes(s)
    );
  });
}
