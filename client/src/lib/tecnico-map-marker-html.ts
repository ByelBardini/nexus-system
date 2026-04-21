/** Sanitiza texto vindo da API para uso em HTML de marcador Leaflet. */
export function escapeHtmlForMarker(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Primeira letra do nome para exibir no círculo do marcador. */
export function initialFromNome(nome: string): string {
  const t = nome.trim();
  if (!t) return "?";
  const ch = t[0];
  return /[A-Za-zÀ-ÿ]/.test(ch) ? ch.toUpperCase() : "?";
}
