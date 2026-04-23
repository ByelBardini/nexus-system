const DEFAULT_CORS_ORIGINS: readonly string[] = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/**
 * Lê a lista de origens CORS a partir de `CORS_ORIGINS` (vírgulas) ou usa o padrão do Vite local.
 * Ex.: `CORS_ORIGINS=https://app.exemplo.com,https://stg.exemplo.com`
 */
export function corsAllowedOriginsFromEnv(
  value: string | undefined,
): string[] {
  if (value == null || value.trim() === '') {
    return [...DEFAULT_CORS_ORIGINS];
  }
  const list = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return list.length > 0 ? list : [...DEFAULT_CORS_ORIGINS];
}
