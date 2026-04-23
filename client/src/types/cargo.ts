export type CategoriaCargo = "OPERACIONAL" | "ADMINISTRATIVO" | "GESTAO";

export interface Permission {
  id: number;
  code: string;
}

export type EstruturaPermissoes = Record<
  string,
  Record<string, { acao: string; permissao: Permission }[]>
>;

export interface Setor {
  id: number;
  code: string;
  nome: string;
}

export interface Cargo {
  id: number;
  code: string;
  nome: string;
  descricao: string | null;
  categoria: CategoriaCargo;
  ativo: boolean;
  setor: Setor;
  usuariosVinculados: number;
  cargoPermissoes: { permissaoId: number }[];
}

export const CATEGORIA_CONFIG: Record<
  CategoriaCargo,
  { label: string; className: string; dotColor: string }
> = {
  OPERACIONAL: {
    label: "Operacional",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  ADMINISTRATIVO: {
    label: "Administrativo",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  GESTAO: {
    label: "Gestão",
    className: "bg-purple-100 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
};

export type CategoriaCargoStyle = (typeof CATEGORIA_CONFIG)[CategoriaCargo];

/** Categoria desconhecida da API: exibe rótulo cru e estilo neutro. */
export function categoriaCargoParaBadge(
  categoria: string,
): CategoriaCargoStyle {
  if (
    categoria === "OPERACIONAL" ||
    categoria === "ADMINISTRATIVO" ||
    categoria === "GESTAO"
  ) {
    return CATEGORIA_CONFIG[categoria];
  }
  return {
    label: categoria,
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  };
}

/** Valores inválidos caem em Operacional (comportamento anterior com `|| OPERACIONAL`). */
export function categoriaCargoOuOperacional(
  categoria: string,
): CategoriaCargoStyle {
  return (
    CATEGORIA_CONFIG[categoria as CategoriaCargo] ??
    CATEGORIA_CONFIG.OPERACIONAL
  );
}

export interface CargoModalProps {
  open: boolean;
  cargo: Cargo | null;
  isNew: boolean;
  onClose: () => void;
  permissoes: Permission[];
  setores: Setor[];
}
