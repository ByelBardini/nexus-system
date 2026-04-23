import type { AparelhoNoKit } from "./pedidos-config-types";

/**
 * Nome de destinatário/empresa para exibição em tabelas e resumos.
 * Mantém o mesmo critério em e-Kit, painel e filtros.
 */
function rawDestinatarioAparelhoNoKit(a: AparelhoNoKit): string | null {
  return (
    a.cliente?.nome ??
    a.tecnico?.nome ??
    (a.proprietario === "INFINITY" ? "Infinity" : null)
  );
}

export function getDestinatarioExibicaoAparelhoNoKit(a: AparelhoNoKit): string {
  return rawDestinatarioAparelhoNoKit(a) ?? "-";
}

/**
 * Rótulo para filtro/igualdade: string vazia quando não há “empresa” (vs "-" na UI).
 */
export function getDestinatarioFiltroAparelhoNoKit(a: AparelhoNoKit): string {
  return rawDestinatarioAparelhoNoKit(a) ?? "";
}

/**
 * Conjunto de nomes de empresa/destino para o resumo do painel (exclui vazio).
 */
export function collectDestinatariosEmpresasAparelhos(
  aparelhos: AparelhoNoKit[] | null | undefined,
): string[] {
  const list = aparelhos ?? [];
  return Array.from(
    new Set(
      list
        .map((a) => rawDestinatarioAparelhoNoKit(a))
        .filter((n): n is string => Boolean(n)),
    ),
  ).sort();
}
