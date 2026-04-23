import type { SetorUsuario } from "./constants";

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

export interface Permission {
  id: number;
  code: string;
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
