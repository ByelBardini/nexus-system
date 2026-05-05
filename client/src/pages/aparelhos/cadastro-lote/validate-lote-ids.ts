import type { LoteFormValues } from "./schema";

export type TipoAparelhoLote = LoteFormValues["tipo"];

export interface LoteIdValidation {
  validos: string[];
  duplicados: string[];
  invalidos: string[];
  jaExistentes: string[];
}

/**
 * Valida e normaliza IMEI (rastreador) ou ICCID (SIM) a partir de texto multilinha.
 * Quando `quantidadeCaracteres` é informado, valida tamanho exato; sem ele, aceita qualquer tamanho.
 */
export function validateLoteIds(
  texto: string,
  _tipo: TipoAparelhoLote,
  existentes: string[],
  quantidadeCaracteres?: number | null,
): LoteIdValidation {
  const linhas = texto
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const validos: string[] = [];
  const duplicados: string[] = [];
  const invalidos: string[] = [];
  const jaExistentes: string[] = [];
  const vistos = new Set<string>();

  for (const id of linhas) {
    const cleanId = id.replace(/\D/g, "");

    if (vistos.has(cleanId)) {
      duplicados.push(id);
      continue;
    }
    vistos.add(cleanId);

    if (existentes.includes(cleanId)) {
      jaExistentes.push(id);
      continue;
    }

    if (
      quantidadeCaracteres != null &&
      cleanId.length !== quantidadeCaracteres
    ) {
      invalidos.push(id);
      continue;
    }

    validos.push(cleanId);
  }

  return { validos, duplicados, invalidos, jaExistentes };
}
