import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function useTestesMutations(onOsStatusSuccess: () => void) {
  const queryClient = useQueryClient();

  const updateStatusOsMutation = useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
      localInstalacao,
      posChave,
    }: {
      id: number;
      status: string;
      observacao?: string;
      localInstalacao?: string;
      posChave?: "SIM" | "NAO";
    }) =>
      api(`/ordens-servico/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          observacao: observacao || undefined,
          localInstalacao: localInstalacao || undefined,
          posChave: posChave || undefined,
        }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      const msg =
        variables.status === "AGENDADO"
          ? "OS reagendada com sucesso"
          : variables.status === "CANCELADO"
            ? "OS cancelada com sucesso"
            : variables.status === "AGUARDANDO_CADASTRO"
              ? "Retirada registrada com sucesso"
              : "OS finalizada com sucesso";
      toast.success(msg);
      onOsStatusSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const vincularAparelhoMutation = useMutation({
    mutationFn: ({
      ordemServicoId,
      idAparelho,
    }: {
      ordemServicoId: number;
      idAparelho: string;
    }) =>
      api(`/ordens-servico/${ordemServicoId}/aparelho`, {
        method: "PATCH",
        body: JSON.stringify({ idAparelho }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["aparelhos", "para-testes"] });
    },
    onError: () => toast.error("Erro ao vincular rastreador. Tente novamente."),
  });

  const updateStatusAparelhoMutation = useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
    }: {
      id: number;
      status: string;
      observacao: string;
    }) =>
      api(`/aparelhos/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, observacao }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
      queryClient.invalidateQueries({ queryKey: ["aparelhos", "para-testes"] });
    },
  });

  return {
    updateStatusOsMutation,
    vincularAparelhoMutation,
    updateStatusAparelhoMutation,
  };
}
