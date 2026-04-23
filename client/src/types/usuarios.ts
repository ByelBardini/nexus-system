import type { Permission } from "@/types/cargo";

export const SETORES_USUARIO = [
  { value: "AGENDAMENTO", label: "Agendamento" },
  { value: "CONFIGURACAO", label: "Configuração" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
] as const;

export type SetorUsuario = (typeof SETORES_USUARIO)[number]["value"];

export type { Permission };

export interface CargoWithPermissions {
  id: number;
  code: string;
  nome: string;
  categoria: string;
  setor: { id: number; code: string; nome: string };
  cargoPermissoes: { permissao: { id: number; code: string } }[];
}

export interface PermissoesPorModulo {
  modulo: string;
  acoes: string[];
}

export interface UsuarioListItem {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  setor?: SetorUsuario | null;
  createdAt: string;
  ultimoAcesso?: string | null;
  usuarioCargos?: {
    cargo: {
      id: number;
      nome: string;
      categoria: string;
      cargoPermissoes: { permissaoId: number }[];
    };
  }[];
}

export interface PaginatedUsuariosResponse {
  data: UsuarioListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UsuariosMutationsOptions {
  onCreateSettled?: () => void;
  onUpdateSettled?: () => void;
}

export interface UsuarioAccessLevel {
  percent: number;
  label: string;
  color: string;
  barColor: string;
}

export interface UsuarioExpandedPanelProps {
  user: UsuarioListItem;
  accessLevel: UsuarioAccessLevel;
  totalPermissions: number;
  canEdit: boolean;
  currentUserId?: number;
  onResetPassword: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  resetPasswordPending: boolean;
}
