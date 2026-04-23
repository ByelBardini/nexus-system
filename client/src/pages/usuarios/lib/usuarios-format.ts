import {
  SETORES_USUARIO,
  type CargoWithPermissions,
  type SetorUsuario,
  type UsuarioAccessLevel,
  type UsuarioListItem,
} from "@/types/usuarios";

export function getSetorLabel(setor?: SetorUsuario | null): string {
  if (!setor) return "";
  const found = SETORES_USUARIO.find((s) => s.value === setor);
  return found?.label ?? setor;
}

export function getInitials(nome: string): string {
  const parts = nome.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}

export function getAccessLevel(
  user: UsuarioListItem,
  totalPermissions: number,
): UsuarioAccessLevel {
  if (
    !user.usuarioCargos ||
    user.usuarioCargos.length === 0 ||
    totalPermissions === 0
  ) {
    return {
      percent: 0,
      label: "Nenhum",
      color: "text-slate-400",
      barColor: "bg-slate-300",
    };
  }

  const uniquePermIds = new Set<number>();
  for (const uc of user.usuarioCargos) {
    for (const cp of uc.cargo.cargoPermissoes) {
      uniquePermIds.add(cp.permissaoId);
    }
  }

  const percent = Math.round((uniquePermIds.size / totalPermissions) * 100);

  if (percent <= 25) {
    return {
      percent,
      label: "Baixo",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }
  if (percent <= 50) {
    return {
      percent,
      label: "Médio",
      color: "text-amber-600",
      barColor: "bg-amber-500",
    };
  }
  if (percent <= 75) {
    return {
      percent,
      label: "Alto",
      color: "text-orange-600",
      barColor: "bg-orange-500",
    };
  }
  return {
    percent,
    label: "Total",
    color: "text-red-600",
    barColor: "bg-red-500",
  };
}

/**
 * @param now - injetável para testes de data relativa
 */
export function formatLastLogin(
  dateStr: string | null | undefined,
  now = new Date(),
): string {
  if (!dateStr) return "Nunca acessou";

  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Score percentual (0–100) de cobertura de permissões a partir dos cargos selecionados.
 */
export function computeAccessScore(
  selectedRoleIds: number[],
  cargosComPermissoes: CargoWithPermissions[],
  totalPermissoesCount: number,
): number {
  if (totalPermissoesCount === 0) return 0;
  if (selectedRoleIds.length === 0) return 0;
  const uniqueCount = cargosComPermissoes
    .filter((c) => selectedRoleIds.includes(c.id))
    .flatMap((c) => c.cargoPermissoes.map((cp) => cp.permissao.id))
    .filter((v, i, a) => a.indexOf(v) === i).length;
  return Math.round((uniqueCount / totalPermissoesCount) * 100);
}
