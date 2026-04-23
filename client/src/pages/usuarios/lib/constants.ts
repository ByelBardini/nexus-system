export const SETORES_USUARIO = [
  { value: "AGENDAMENTO", label: "Agendamento" },
  { value: "CONFIGURACAO", label: "Configuração" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
] as const;

export type SetorUsuario = (typeof SETORES_USUARIO)[number]["value"];
