import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { tecnicosResumoQueryKey } from "@/hooks/useTecnicosResumoQuery";
import type { TecnicoMutationsCallbacks } from "@/types/tecnicos";
import { buildTecnicoApiBody, type TecnicoFormData } from "../lib/tecnico-form";

export type { TecnicoMutationsCallbacks };

export function useTecnicosMutations(options?: TecnicoMutationsCallbacks) {
  const queryClient = useQueryClient();
  const optsRef = useRef(options);
  optsRef.current = options;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      api(`/tecnicos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...tecnicosResumoQueryKey] });
      toast.success("Status atualizado");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const createMutation = useMutation({
    mutationFn: (data: TecnicoFormData) =>
      api("/tecnicos", {
        method: "POST",
        body: JSON.stringify(buildTecnicoApiBody(data)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...tecnicosResumoQueryKey] });
      optsRef.current?.onCreateSuccess?.();
      toast.success("Técnico criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar técnico"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TecnicoFormData }) =>
      api(`/tecnicos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(buildTecnicoApiBody(data)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...tecnicosResumoQueryKey] });
      optsRef.current?.onUpdateSuccess?.();
      toast.success("Técnico atualizado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar técnico",
      ),
  });

  return {
    queryClient,
    updateStatusMutation,
    createMutation,
    updateMutation,
  };
}
