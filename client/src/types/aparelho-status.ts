/**
 * Status de aparelho (workflow: estoque → instalado).
 * Constantes visuais permanecem em `@/lib/aparelho-status`.
 */
export type StatusAparelho =
  | "EM_ESTOQUE"
  | "CONFIGURADO"
  | "DESPACHADO"
  | "COM_TECNICO"
  | "INSTALADO";

export interface StatusConfigAparelho {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  dotColor: string;
}
