import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CargoWithPermissions,
  PaginatedUsuariosResponse,
  Permission,
} from "@/types/usuarios";

export function useUsuariosPaginatedQuery(
  debouncedSearch: string,
  statusFilter: string,
  page: number,
) {
  return useQuery<PaginatedUsuariosResponse>({
    queryKey: ["users-paginated", debouncedSearch, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter && statusFilter !== "TODOS")
        params.set("ativo", statusFilter === "ATIVOS" ? "true" : "false");
      params.set("page", String(page));
      params.set("limit", "15");
      return api(`/users/paginated?${params.toString()}`);
    },
  });
}

export function usePermissionsQuery() {
  return useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: () => api("/roles/permissions"),
  });
}

export function useCargosComPermissoesQuery(enabled: boolean) {
  return useQuery<CargoWithPermissions[]>({
    queryKey: ["roles-with-permissions"],
    queryFn: () => api("/roles?includePermissions=true"),
    enabled,
  });
}
