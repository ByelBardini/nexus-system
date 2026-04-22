import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CriarOrdemServicoPayload } from "../ordens-servico-criacao.types";

export function useCriarOrdemServicoMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarOrdemServicoPayload) =>
      api<{ id: number; numero: number }>("/ordens-servico", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      if (variables.subclienteUpdate) {
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
      }
      toast.success(`Ordem de serviço #${data.numero} criada`);
      navigate("/");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar OS"),
  });
}
