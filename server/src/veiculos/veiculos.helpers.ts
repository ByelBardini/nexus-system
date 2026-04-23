export function normalizarPlaca(placa: string): string {
  return placa
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 7);
}

/** Placa Mercosul/antiga: 7 caracteres alfanuméricos após normalização. */
export function placaNormalizadaOuNull(placa: string): string | null {
  const raw = normalizarPlaca(placa);
  return raw.length < 7 ? null : raw;
}
