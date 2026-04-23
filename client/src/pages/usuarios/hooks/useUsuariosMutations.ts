import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { FormCreate, FormEdit } from "../lib/schemas";

export interface UsuariosMutationsOptions {
  onCreateSettled?: () => void;
  onUpdateSettled?: () => void;
}

export function useUsuariosMutations(options: UsuariosMutationsOptions = {}) {
  const { onCreateSettled, onUpdateSettled } = options;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: FormCreate) => {
      const user: { id: number } = await api("/users", {
        method: "POST",
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          password: "#Infinity123",
          ativo: data.ativo,
          setor: data.setor,
        }),
      });
      if (data.cargoIds.length > 0) {
        await api(`/roles/users/${user.id}/roles`, {
          method: "PATCH",
          body: JSON.stringify({ roleIds: data.cargoIds }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-paginated"] });
      onCreateSettled?.();
      toast.success("Usuário criado com senha padrão");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      roleIds,
    }: {
      id: number;
      data: FormEdit;
      roleIds: number[];
    }) => {
      await Promise.all([
        api(`/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
        api(`/roles/users/${id}/roles`, {
          method: "PATCH",
          body: JSON.stringify({ roleIds }),
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-paginated"] });
      onUpdateSettled?.();
      toast.success("Usuário atualizado");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      await api(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-paginated"] });
      toast.success("Status atualizado");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      await api(`/users/${id}/reset-password`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast.success("Senha resetada para: #Infinity123");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao resetar senha"),
  });

  return {
    createMutation,
    updateMutation,
    toggleStatusMutation,
    resetPasswordMutation,
  };
}
